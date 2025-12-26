/**
 * Webhook 签名验证工具
 * 提供 HMAC-SHA256 签名生成和验证功能
 */
'use strict';

const crypto = require('crypto');

class WebhookSignature {
  /**
   * 生成 HMAC-SHA256 签名
   * @param {Object|String} payload 负载数据（对象会被 JSON 序列化）
   * @param {String} secret 密钥
   * @return {String} 签名字符串，格式：sha256=<hex>
   */
  static generate(payload, secret) {
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!secret) {
      throw new Error('Secret is required');
    }

    // 如果 payload 是对象，转换为 JSON 字符串
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // 创建 HMAC
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);

    // 返回签名
    return 'sha256=' + hmac.digest('hex');
  }

  /**
   * 验证 HMAC-SHA256 签名
   * @param {Object|String} payload 负载数据（对象会被 JSON 序列化）
   * @param {String} signature 待验证的签名
   * @param {String} secret 密钥
   * @return {Boolean} 签名是否有效
   */
  static verify(payload, signature, secret) {
    if (!payload) {
      throw new Error('Payload is required');
    }

    if (!signature) {
      throw new Error('Signature is required');
    }

    if (!secret) {
      throw new Error('Secret is required');
    }

    try {
      // 生成期望的签名
      const expectedSignature = this.generate(payload, secret);

      // 使用时间安全的比较方法
      return this._secureCompare(signature, expectedSignature);
    } catch (error) {
      // 签名验证失败
      return false;
    }
  }

  /**
   * 从请求头中提取签名
   * @param {Object} headers 请求头对象
   * @return {String|null} 签名字符串，如果不存在返回 null
   */
  static extractSignature(headers) {
    // 支持多种请求头格式
    return (
      headers['x-webhook-signature'] ||
      headers['X-Webhook-Signature'] ||
      headers['x-signature'] ||
      headers['X-Signature'] ||
      null
    );
  }

  /**
   * 验证请求签名（从请求头中提取）
   * @param {Object} payload 负载数据
   * @param {Object} headers 请求头对象
   * @param {String} secret 密钥
   * @return {Boolean} 签名是否有效
   */
  static verifyRequest(payload, headers, secret) {
    const signature = this.extractSignature(headers);

    if (!signature) {
      return false;
    }

    return this.verify(payload, signature, secret);
  }

  /**
   * 时间安全的字符串比较
   * 防止时序攻击
   * @param {String} a 字符串 A
   * @param {String} b 字符串 B
   * @return {Boolean} 是否相等
   * @private
   */
  static _secureCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    // 长度不同直接返回 false
    if (a.length !== b.length) {
      return false;
    }

    // 使用 crypto.timingSafeEqual 进行时间安全比较
    try {
      const bufferA = Buffer.from(a, 'utf8');
      const bufferB = Buffer.from(b, 'utf8');
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成 Webhook 请求体
   * @param {String} event 事件名称
   * @param {Object} data 事件数据
   * @param {String} timestamp 时间戳（可选，默认当前时间）
   * @return {Object} 请求体对象
   */
  static createPayload(event, data, timestamp = null) {
    return {
      event,
      timestamp: timestamp || new Date().toISOString(),
      data,
    };
  }

  /**
   * 验证时间戳是否在有效期内
   * @param {String} timestamp ISO 8601 时间戳
   * @param {Number} toleranceSeconds 容忍时间（秒），默认 5 分钟
   * @return {Boolean} 时间戳是否有效
   */
  static verifyTimestamp(timestamp, toleranceSeconds = 300) {
    try {
      const requestTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const diff = Math.abs(currentTime - requestTime);

      return diff <= toleranceSeconds * 1000;
    } catch (error) {
      return false;
    }
  }

  /**
   * 完整的 Webhook 请求验证
   * 包括签名验证和时间戳验证
   * @param {Object} payload 负载数据
   * @param {Object} headers 请求头对象
   * @param {String} secret 密钥
   * @param {Object} options 验证选项
   * @param {Boolean} options.verifyTimestamp 是否验证时间戳，默认 true
   * @param {Number} options.toleranceSeconds 时间戳容忍时间（秒），默认 300
   * @return {Object} 验证结果 { valid: Boolean, reason: String }
   */
  static verifyWebhookRequest(payload, headers, secret, options = {}) {
    const { verifyTimestamp: shouldVerifyTimestamp = true, toleranceSeconds = 300 } = options;

    // 验证签名
    const signature = this.extractSignature(headers);
    if (!signature) {
      return { valid: false, reason: 'Missing signature' };
    }

    if (!this.verify(payload, signature, secret)) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // 验证时间戳（可选）
    if (shouldVerifyTimestamp && payload.timestamp) {
      if (!this.verifyTimestamp(payload.timestamp, toleranceSeconds)) {
        return { valid: false, reason: 'Timestamp out of tolerance' };
      }
    }

    return { valid: true, reason: 'Valid' };
  }
}

module.exports = WebhookSignature;
