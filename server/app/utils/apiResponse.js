/**
 * 统一 API 响应格式工具类
 * 提供标准化的成功和失败响应格式
 *
 * 标准响应格式：
 * {
 *   status: 200 | 400 | 401 | 403 | 404 | 500,
 *   data: {},
 *   message: '',
 *   timestamp: '2024-01-01T00:00:00.000Z',
 *   requestId: 'uuid'
 * }
 */

'use strict';

const { v4: uuidv4 } = require('uuid');

class APIResponse {
  /**
   * 生成请求追踪 ID
   * @return {String} UUID
   */
  static generateRequestId() {
    return uuidv4();
  }

  /**
   * 生成 ISO 8601 格式的时间戳
   * @return {String} ISO 8601 时间戳
   */
  static generateTimestamp() {
    return new Date().toISOString();
  }

  /**
   * 成功响应
   * @param {Object} ctx - Egg.js Context
   * @param {Object} options - 响应选项
   * @param {*} options.data - 响应数据
   * @param {String} options.message - 响应消息
   * @param {Number} options.status - HTTP 状态码（默认 200）
   */
  static success(ctx, { data = {}, message = '', status = 200 } = {}) {
    const requestId = ctx.requestId || this.generateRequestId();

    ctx.body = {
      status,
      data: data || {},
      message: message || '',
      timestamp: this.generateTimestamp(),
      requestId,
    };
    ctx.status = status;

    // 设置标准响应头
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    ctx.set('X-Request-ID', requestId);
  }

  /**
   * 失败响应
   * @param {Object} ctx - Egg.js Context
   * @param {Object} options - 响应选项
   * @param {String} options.message - 错误消息
   * @param {String} options.code - 错误码
   * @param {*} options.data - 附加数据
   * @param {Number} options.status - HTTP 状态码（默认 500）
   */
  static fail(ctx, { message = '', code = 'UNKNOWN_ERROR', data = {}, status = 500 } = {}) {
    const requestId = ctx.requestId || this.generateRequestId();

    // 如果 message 是 Error 对象，提取消息
    if (message instanceof Error) {
      message = message.message;
    }

    ctx.body = {
      status,
      code,
      message: message || 'Request failed',
      data: data || {},
      timestamp: this.generateTimestamp(),
      requestId,
    };
    ctx.status = status;

    // 设置标准响应头
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    ctx.set('X-Request-ID', requestId);
  }

  /**
   * 认证失败响应（401）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   */
  static unauthorized(ctx, message = 'Unauthorized') {
    this.fail(ctx, {
      message,
      code: 'UNAUTHORIZED',
      status: 401,
    });
  }

  /**
   * 权限不足响应（403）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   */
  static forbidden(ctx, message = 'Forbidden') {
    this.fail(ctx, {
      message,
      code: 'FORBIDDEN',
      status: 403,
    });
  }

  /**
   * 资源不存在响应（404）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   */
  static notFound(ctx, message = 'Not Found') {
    this.fail(ctx, {
      message,
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  /**
   * 参数错误响应（400）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   * @param {*} data - 验证错误详情
   */
  static badRequest(ctx, message = 'Bad Request', data = {}) {
    this.fail(ctx, {
      message,
      code: 'BAD_REQUEST',
      data,
      status: 400,
    });
  }

  /**
   * 业务逻辑错误响应（422）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   * @param {String} code - 业务错误码
   */
  static businessError(ctx, message = 'Business Error', code = 'BUSINESS_ERROR') {
    this.fail(ctx, {
      message,
      code,
      status: 422,
    });
  }

  /**
   * 服务器内部错误响应（500）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   */
  static internalError(ctx, message = 'Internal Server Error') {
    this.fail(ctx, {
      message,
      code: 'INTERNAL_ERROR',
      status: 500,
    });
  }

  /**
   * 速率限制响应（429）
   * @param {Object} ctx - Egg.js Context
   * @param {String} message - 错误消息
   */
  static tooManyRequests(ctx, message = 'Too Many Requests') {
    this.fail(ctx, {
      message,
      code: 'TOO_MANY_REQUESTS',
      status: 429,
    });
  }
}

module.exports = APIResponse;
