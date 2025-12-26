/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: LogDataBuilder - 统一日志数据构建器
 * 用于构建标准化的日志数据对象，确保所有日志记录格式一致
 */

'use strict';

const SYSTEM_CONSTANTS = require('../../constants/SystemConstants');
const SensitiveDataMasker = require('./SensitiveDataMasker');

class LogDataBuilder {
  constructor() {
    this.data = {};
    this.masker = new SensitiveDataMasker();
  }

  /**
   * 创建新的构建器实例
   * @return {LogDataBuilder}
   */
  static create() {
    return new LogDataBuilder();
  }

  /**
   * 设置日志类型
   * @param {String} type 日志类型
   * @return {LogDataBuilder}
   */
  setType(type) {
    this.data.type = type || SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.TYPE.OPERATION;
    return this;
  }

  /**
   * 设置日志内容
   * @param {String} logs 日志内容
   * @return {LogDataBuilder}
   */
  setLogs(logs) {
    this.data.logs = logs || '';
    return this;
  }

  /**
   * 设置严重程度
   * @param {String} severity 严重程度
   * @return {LogDataBuilder}
   */
  setSeverity(severity) {
    this.data.severity = severity || SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.SEVERITY.LOW;
    return this;
  }

  /**
   * 从请求对象设置请求相关字段
   * @param {Object} request egg请求对象
   * @param {Object} options 选项
   * @return {LogDataBuilder}
   */
  setRequest(request, options = {}) {
    if (!request) return this;

    const { maskSensitiveData = true } = options;

    this.data.request_path = request.path || request.url;
    this.data.request_method = request.method;

    // 请求参数（脱敏处理）
    if (request.params && Object.keys(request.params).length > 0) {
      this.data.request_params = maskSensitiveData ? this.masker.maskObject(request.params) : request.params;
    }

    // 请求体（脱敏处理）
    if (request.body && Object.keys(request.body).length > 0) {
      this.data.request_body = maskSensitiveData ? this.masker.maskObject(request.body) : request.body;
    }

    // 查询字符串（脱敏处理）
    if (request.query && Object.keys(request.query).length > 0) {
      this.data.request_query = maskSensitiveData ? this.masker.maskObject(request.query) : request.query;
    }

    // IP地址
    this.data.ip_address = this._extractIpAddress(request);

    // User-Agent
    this.data.user_agent = request.header?.['user-agent'] || request.headers?.['user-agent'];

    // 客户端平台（简单判断）
    this.data.client_platform = this._detectClientPlatform(this.data.user_agent);

    return this;
  }

  /**
   * 设置用户信息
   * @param {Object} user 用户对象
   * @param {Object} options 选项
   * @return {LogDataBuilder}
   */
  setUser(user, options = {}) {
    if (!user) return this;

    const { userType = SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.USER_TYPE.GUEST } = options;

    this.data.user_id = user.id || user._id;
    this.data.user_name = user.userName || user.name || user.username;
    this.data.user_type = userType;

    return this;
  }

  /**
   * 设置会话ID
   * @param {String} sessionId 会话ID
   * @return {LogDataBuilder}
   */
  setSession(sessionId) {
    this.data.session_id = sessionId;
    return this;
  }

  /**
   * 设置响应信息
   * @param {Number} status HTTP状态码
   * @param {Number} responseTime 响应时间（毫秒）
   * @param {Number} responseSize 响应大小（字节）
   * @return {LogDataBuilder}
   */
  setResponse(status, responseTime, responseSize) {
    if (status !== undefined) this.data.response_status = status;
    if (responseTime !== undefined) this.data.response_time = responseTime;
    if (responseSize !== undefined) this.data.response_size = responseSize;
    return this;
  }

  /**
   * 设置业务信息
   * @param {Object} businessInfo 业务信息
   * @return {LogDataBuilder}
   */
  setBusiness(businessInfo = {}) {
    const { module, action, resourceType, resourceId, oldValue, newValue } = businessInfo;

    if (module) this.data.module = module;
    if (action) this.data.action = action;
    if (resourceType) this.data.resource_type = resourceType;
    if (resourceId) this.data.resource_id = resourceId;
    if (oldValue !== undefined) this.data.old_value = oldValue;
    if (newValue !== undefined) this.data.new_value = newValue;

    return this;
  }

  /**
   * 设置错误信息
   * @param {Error|Object} error 错误对象
   * @param {Object} options 选项
   * @return {LogDataBuilder}
   */
  setError(error, options = {}) {
    if (!error) return this;

    const { includeStack = process.env.NODE_ENV !== 'production' } = options;

    this.data.error_message = error.message || String(error);
    this.data.error_code = error.code || error.name;

    if (includeStack && error.stack) {
      this.data.error_stack = error.stack;
    }

    this.data.is_handled = false;

    return this;
  }

  /**
   * 设置标签
   * @param {Array|String} tags 标签数组或单个标签
   * @return {LogDataBuilder}
   */
  setTags(tags) {
    if (!tags) return this;

    if (Array.isArray(tags)) {
      this.data.tags = tags;
    } else {
      this.data.tags = [tags];
    }

    return this;
  }

  /**
   * 添加标签
   * @param {String} tag 标签
   * @return {LogDataBuilder}
   */
  addTag(tag) {
    if (!this.data.tags) {
      this.data.tags = [];
    }
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
    }
    return this;
  }

  /**
   * 设置环境
   * @param {String} environment 环境
   * @return {LogDataBuilder}
   */
  setEnvironment(environment) {
    this.data.environment = environment || process.env.NODE_ENV || 'development';
    return this;
  }

  /**
   * 设置链路追踪ID
   * @param {String} traceId 链路追踪ID
   * @return {LogDataBuilder}
   */
  setTraceId(traceId) {
    this.data.trace_id = traceId;
    return this;
  }

  /**
   * 设置额外数据
   * @param {Object} extraData 额外数据
   * @return {LogDataBuilder}
   */
  setExtraData(extraData) {
    this.data.extra_data = extraData;
    return this;
  }

  /**
   * 从上下文对象快速构建
   * @param {Object} ctx egg上下文对象
   * @param {Object} options 选项
   * @return {LogDataBuilder}
   */
  fromContext(ctx, options = {}) {
    const { type, logs, severity, business = {}, error = null, tags = [] } = options;

    // 基本信息
    if (type) this.setType(type);
    if (logs) this.setLogs(logs);
    if (severity) this.setSeverity(severity);

    // 请求信息
    this.setRequest(ctx.request);

    // 用户信息
    if (ctx.user) {
      const userType =
        ctx.user.role === 'admin'
          ? SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.USER_TYPE.ADMIN
          : SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.USER_TYPE.USER;
      this.setUser(ctx.user, { userType });
    }

    // 会话信息
    if (ctx.session?.id) {
      this.setSession(ctx.session.id);
    }

    // 响应信息
    if (ctx.status) {
      this.setResponse(ctx.status);
    }

    // 业务信息
    if (Object.keys(business).length > 0) {
      this.setBusiness(business);
    }

    // 错误信息
    if (error) {
      this.setError(error);
    }

    // 标签
    if (tags.length > 0) {
      this.setTags(tags);
    }

    // 环境
    this.setEnvironment(ctx.app.config.env);

    // 链路追踪ID（如果有）
    if (ctx.traceId) {
      this.setTraceId(ctx.traceId);
    }

    return this;
  }

  /**
   * 构建并返回日志数据对象
   * @return {Object} 日志数据对象
   */
  build() {
    // 确保必需字段
    if (!this.data.type) {
      this.data.type = SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.TYPE.OPERATION;
    }
    if (!this.data.logs) {
      this.data.logs = '日志记录';
    }
    if (!this.data.severity) {
      this.data.severity = SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.SEVERITY.LOW;
    }

    // 设置时间戳
    if (!this.data.createdAt) {
      this.data.createdAt = new Date();
    }
    if (!this.data.updatedAt) {
      this.data.updatedAt = new Date();
    }

    return { ...this.data };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 提取IP地址
   * @param {Object} request 请求对象
   * @return {String} IP地址
   * @private
   */
  _extractIpAddress(request) {
    // 尝试从各种来源获取真实IP
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers?.['x-real-ip'] ||
      request.ip ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      '0.0.0.0'
    );
  }

  /**
   * 检测客户端平台
   * @param {String} userAgent User-Agent字符串
   * @return {String} 平台类型
   * @private
   */
  _detectClientPlatform(userAgent) {
    if (!userAgent) return 'web';

    const ua = userAgent.toLowerCase();

    // 移动端
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(ua)) {
      return 'mobile';
    }

    // 桌面应用（Electron等）
    if (/electron/.test(ua)) {
      return 'desktop';
    }

    // API调用
    if (/curl|wget|axios|postman|insomnia|httpie/.test(ua)) {
      return 'api';
    }

    // 默认为web
    return 'web';
  }
}

module.exports = LogDataBuilder;
