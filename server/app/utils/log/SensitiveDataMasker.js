/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: SensitiveDataMasker - 敏感数据脱敏工具
 * 用于在记录日志前对敏感数据进行脱敏处理，保护用户隐私
 */

'use strict';

class SensitiveDataMasker {
  constructor(options = {}) {
    // 敏感字段列表（不区分大小写）
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'pwd',
      'passwd',
      'secret',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'session',
      'sessionId',
      'session_id',
      'credit_card',
      'creditCard',
      'card_number',
      'cardNumber',
      'cvv',
      'ssn',
      'social_security',
      'id_card',
      'idCard',
      'passport',
      'private_key',
      'privateKey',
      'bank_account',
      'bankAccount',
    ];

    // 脱敏掩码
    this.mask = options.mask || '******';

    // 是否启用脱敏
    this.enabled = options.enabled !== undefined ? options.enabled : true;
  }

  /**
   * 脱敏对象（递归处理）
   * @param {Object} obj 要脱敏的对象
   * @param {Number} depth 当前递归深度
   * @param {Number} maxDepth 最大递归深度
   * @return {Object} 脱敏后的对象
   */
  maskObject(obj, depth = 0, maxDepth = 10) {
    // 如果禁用脱敏，直接返回
    if (!this.enabled) {
      return obj;
    }

    // 防止过深递归
    if (depth > maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // null 或 undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 基本类型
    if (typeof obj !== 'object') {
      return obj;
    }

    // 数组
    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item, depth + 1, maxDepth));
    }

    // 日期对象
    if (obj instanceof Date) {
      return obj;
    }

    // 正则对象
    if (obj instanceof RegExp) {
      return obj.toString();
    }

    // 普通对象
    const masked = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // 检查是否为敏感字段
        if (this._isSensitiveField(key)) {
          masked[key] = this._maskValue(obj[key]);
        } else {
          // 递归处理嵌套对象
          masked[key] = this.maskObject(obj[key], depth + 1, maxDepth);
        }
      }
    }

    return masked;
  }

  /**
   * 脱敏字符串
   * @param {String} str 要脱敏的字符串
   * @param {Object} options 脱敏选项
   * @return {String} 脱敏后的字符串
   */
  maskString(str, options = {}) {
    if (!this.enabled || !str || typeof str !== 'string') {
      return str;
    }

    const {
      keepPrefix = 0, // 保留前几位
      keepSuffix = 0, // 保留后几位
      mask = this.mask,
    } = options;

    const len = str.length;

    // 字符串太短，全部脱敏
    if (len <= keepPrefix + keepSuffix) {
      return mask;
    }

    const prefix = str.substring(0, keepPrefix);
    const suffix = str.substring(len - keepSuffix);

    return `${prefix}${mask}${suffix}`;
  }

  /**
   * 脱敏邮箱
   * @param {String} email 邮箱地址
   * @return {String} 脱敏后的邮箱
   */
  maskEmail(email) {
    if (!this.enabled || !email || typeof email !== 'string') {
      return email;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
      return this.mask;
    }

    const username = parts[0];
    const domain = parts[1];

    // 用户名脱敏：保留前1位和后1位
    const maskedUsername = this.maskString(username, {
      keepPrefix: 1,
      keepSuffix: 1,
    });

    return `${maskedUsername}@${domain}`;
  }

  /**
   * 脱敏手机号
   * @param {String} phone 手机号
   * @return {String} 脱敏后的手机号
   */
  maskPhone(phone) {
    if (!this.enabled || !phone) {
      return phone;
    }

    const str = String(phone);

    // 中国手机号：保留前3位和后4位
    if (str.length === 11 && /^1[3-9]\d{9}$/.test(str)) {
      return this.maskString(str, {
        keepPrefix: 3,
        keepSuffix: 4,
        mask: '****',
      });
    }

    // 其他手机号：保留前2位和后2位
    return this.maskString(str, {
      keepPrefix: 2,
      keepSuffix: 2,
      mask: '****',
    });
  }

  /**
   * 脱敏身份证号
   * @param {String} idCard 身份证号
   * @return {String} 脱敏后的身份证号
   */
  maskIdCard(idCard) {
    if (!this.enabled || !idCard) {
      return idCard;
    }

    const str = String(idCard);

    // 18位身份证：保留前4位和后4位
    if (str.length === 18) {
      return this.maskString(str, {
        keepPrefix: 4,
        keepSuffix: 4,
        mask: '**********',
      });
    }

    // 15位身份证：保留前3位和后3位
    if (str.length === 15) {
      return this.maskString(str, {
        keepPrefix: 3,
        keepSuffix: 3,
        mask: '*********',
      });
    }

    return this.mask;
  }

  /**
   * 脱敏银行卡号
   * @param {String} cardNumber 银行卡号
   * @return {String} 脱敏后的银行卡号
   */
  maskBankCard(cardNumber) {
    if (!this.enabled || !cardNumber) {
      return cardNumber;
    }

    const str = String(cardNumber).replace(/\s/g, '');

    // 保留前6位和后4位
    return this.maskString(str, {
      keepPrefix: 6,
      keepSuffix: 4,
      mask: '******',
    });
  }

  /**
   * 脱敏IP地址
   * @param {String} ip IP地址
   * @param {Boolean} keepPublic 是否保留公网IP
   * @return {String} 脱敏后的IP地址
   */
  maskIpAddress(ip, keepPublic = false) {
    if (!this.enabled || !ip) {
      return ip;
    }

    // 如果保留公网IP，检查是否为私网IP
    if (keepPublic && !this._isPrivateIp(ip)) {
      return ip;
    }

    // IPv4: 只保留前两段
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.***. ***`;
    }

    // IPv6: 只保留前两段
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts[0]}:${parts[1]}:***:***:***:***:***:***`;
    }

    return this.mask;
  }

  /**
   * 添加敏感字段
   * @param {String|Array} fields 字段名或字段名数组
   */
  addSensitiveField(fields) {
    if (Array.isArray(fields)) {
      this.sensitiveFields.push(...fields);
    } else {
      this.sensitiveFields.push(fields);
    }
  }

  /**
   * 移除敏感字段
   * @param {String} field 字段名
   */
  removeSensitiveField(field) {
    const index = this.sensitiveFields.indexOf(field);
    if (index > -1) {
      this.sensitiveFields.splice(index, 1);
    }
  }

  /**
   * 启用脱敏
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用脱敏
   */
  disable() {
    this.enabled = false;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否为敏感字段
   * @param {String} fieldName 字段名
   * @return {Boolean}
   * @private
   */
  _isSensitiveField(fieldName) {
    const lowerFieldName = String(fieldName).toLowerCase();
    return this.sensitiveFields.some(sensitive => lowerFieldName.includes(sensitive.toLowerCase()));
  }

  /**
   * 脱敏值
   * @param {*} value 要脱敏的值
   * @return {*} 脱敏后的值
   * @private
   */
  _maskValue(value) {
    // null 或 undefined
    if (value === null || value === undefined) {
      return value;
    }

    // 字符串
    if (typeof value === 'string') {
      // 尝试智能识别数据类型
      if (this._isEmail(value)) {
        return this.maskEmail(value);
      }
      if (this._isPhone(value)) {
        return this.maskPhone(value);
      }
      if (this._isIdCard(value)) {
        return this.maskIdCard(value);
      }
      // 默认脱敏
      return this.maskString(value, { keepPrefix: 2, keepSuffix: 2 });
    }

    // 数字
    if (typeof value === 'number') {
      return this.mask;
    }

    // 布尔值
    if (typeof value === 'boolean') {
      return this.mask;
    }

    // 对象
    if (typeof value === 'object') {
      return this.maskObject(value);
    }

    return this.mask;
  }

  /**
   * 检查是否为邮箱
   * @param {String} str 字符串
   * @return {Boolean}
   * @private
   */
  _isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * 检查是否为手机号
   * @param {String} str 字符串
   * @return {Boolean}
   * @private
   */
  _isPhone(str) {
    return /^1[3-9]\d{9}$/.test(str) || /^\+?[\d\s-()]{10,}$/.test(str);
  }

  /**
   * 检查是否为身份证号
   * @param {String} str 字符串
   * @return {Boolean}
   * @private
   */
  _isIdCard(str) {
    return /^\d{15}$/.test(str) || /^\d{17}[\dXx]$/.test(str);
  }

  /**
   * 检查是否为私网IP
   * @param {String} ip IP地址
   * @return {Boolean}
   * @private
   */
  _isPrivateIp(ip) {
    // IPv4私网段
    return (
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
      ip === '127.0.0.1' ||
      ip === 'localhost'
    );
  }
}

module.exports = SensitiveDataMasker;
