/*
 * @Author: Claude Code
 * @Date: 2024-08-17
 * @Description: 自定义错误类型定义
 * 提供细分的错误类型，便于错误处理和用户反馈
 */

'use strict';

/**
 * 基础业务错误类
 * 所有业务错误的基类
 */
class BusinessError extends Error {
  constructor(message, code = 'BUSINESS_ERROR', statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError);
    }
  }

  /**
   * 转换为JSON格式
   * @return {Object} 错误信息对象
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 验证错误类
 * 用于数据验证失败的场景
 */
class ValidationError extends BusinessError {
  constructor(field, message, value = null) {
    const fullMessage = field ? `${field}: ${message}` : message;
    super(fullMessage, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    };
  }
}

/**
 * 权限错误类
 * 用于权限不足的场景
 */
class PermissionError extends BusinessError {
  constructor(message = '权限不足', resource = null, action = null) {
    super(message, 'PERMISSION_ERROR', 403);
    this.name = 'PermissionError';
    this.resource = resource;
    this.action = action;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      action: this.action,
    };
  }
}

/**
 * 认证错误类
 * 用于身份认证失败的场景
 */
class AuthenticationError extends BusinessError {
  constructor(message = '身份认证失败') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 资源未找到错误类
 * 用于请求的资源不存在的场景
 */
class NotFoundError extends BusinessError {
  constructor(resource = '资源', id = null) {
    const message = id ? `${resource} (ID: ${id}) 不存在` : `${resource}不存在`;
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      id: this.id,
    };
  }
}

/**
 * 数据一致性错误类
 * 用于数据一致性检查失败的场景
 */
class DataConsistencyError extends BusinessError {
  constructor(message, details = null) {
    super(message, 'DATA_CONSISTENCY_ERROR', 409);
    this.name = 'DataConsistencyError';
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

/**
 * 唯一性约束错误类
 * 用于唯一性约束违反的场景
 */
class UniqueConstraintError extends ValidationError {
  constructor(field, value, message = null) {
    const defaultMessage = message || `"${value}" 已存在`;
    super(field, defaultMessage, value);
    this.name = 'UniqueConstraintError';
    this.code = 'UNIQUE_CONSTRAINT_ERROR';
  }
}

/**
 * 配置错误类
 * 用于系统配置错误的场景
 */
class ConfigurationError extends BusinessError {
  constructor(message, configKey = null) {
    super(message, 'CONFIGURATION_ERROR', 500);
    this.name = 'ConfigurationError';
    this.configKey = configKey;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      configKey: this.configKey,
    };
  }
}

/**
 * 外部服务错误类
 * 用于外部服务调用失败的场景
 */
class ExternalServiceError extends BusinessError {
  constructor(serviceName, message, originalError = null) {
    const fullMessage = `${serviceName} 服务错误: ${message}`;
    super(fullMessage, 'EXTERNAL_SERVICE_ERROR', 502);
    this.name = 'ExternalServiceError';
    this.serviceName = serviceName;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
      originalError: this.originalError ? this.originalError.message : null,
    };
  }
}

/**
 * 数据库操作错误类
 * 用于数据库操作失败的场景
 */
class DatabaseError extends BusinessError {
  constructor(operation, message, originalError = null) {
    const fullMessage = `数据库${operation}操作失败: ${message}`;
    super(fullMessage, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      originalError: this.originalError ? this.originalError.message : null,
    };
  }
}

/**
 * 业务规则错误类
 * 用于违反业务规则的场景
 */
class BusinessRuleError extends BusinessError {
  constructor(rule, message) {
    super(message, 'BUSINESS_RULE_ERROR', 422);
    this.name = 'BusinessRuleError';
    this.rule = rule;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      rule: this.rule,
    };
  }
}

/**
 * 限流错误类
 * 用于请求频率超限的场景
 */
class RateLimitError extends BusinessError {
  constructor(limit, window, retryAfter = null) {
    const message = `请求频率超限，限制: ${limit}次/${window}秒`;
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
    this.limit = limit;
    this.window = window;
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      limit: this.limit,
      window: this.window,
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * 文件操作错误类
 * 用于文件上传、下载等操作失败的场景
 */
class FileOperationError extends BusinessError {
  constructor(operation, filename, message) {
    const fullMessage = `文件${operation}失败: ${message}`;
    super(fullMessage, 'FILE_OPERATION_ERROR', 400);
    this.name = 'FileOperationError';
    this.operation = operation;
    this.filename = filename;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      filename: this.filename,
    };
  }
}

/**
 * 并发冲突错误类
 * 用于并发操作冲突的场景
 */
class ConcurrencyError extends BusinessError {
  constructor(resource, message = '资源正在被其他操作修改，请稍后重试') {
    super(message, 'CONCURRENCY_ERROR', 409);
    this.name = 'ConcurrencyError';
    this.resource = resource;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
    };
  }
}

/**
 * 错误工厂类
 * 用于快速创建常见的错误实例
 */
class ErrorFactory {
  /**
   * 创建验证错误
   * @param field
   * @param message
   * @param value
   */
  static validation(field, message, value = null) {
    return new ValidationError(field, message, value);
  }

  /**
   * 创建权限错误
   * @param message
   * @param resource
   * @param action
   */
  static permission(message = '权限不足', resource = null, action = null) {
    return new PermissionError(message, resource, action);
  }

  /**
   * 创建认证错误
   * @param message
   */
  static authentication(message = '身份认证失败') {
    return new AuthenticationError(message);
  }

  /**
   * 创建资源未找到错误
   * @param resource
   * @param id
   */
  static notFound(resource = '资源', id = null) {
    return new NotFoundError(resource, id);
  }

  /**
   * 创建唯一性约束错误
   * @param field
   * @param value
   * @param message
   */
  static uniqueConstraint(field, value, message = null) {
    return new UniqueConstraintError(field, value, message);
  }

  /**
   * 创建数据一致性错误
   * @param message
   * @param details
   */
  static dataConsistency(message, details = null) {
    return new DataConsistencyError(message, details);
  }

  /**
   * 创建业务规则错误
   * @param rule
   * @param message
   */
  static businessRule(rule, message) {
    return new BusinessRuleError(rule, message);
  }

  /**
   * 创建数据库错误
   * @param operation
   * @param message
   * @param originalError
   */
  static database(operation, message, originalError = null) {
    return new DatabaseError(operation, message, originalError);
  }

  /**
   * 从原始错误创建适当的业务错误
   * @param error
   * @param context
   */
  static fromOriginalError(error, context = {}) {
    if (error instanceof BusinessError) {
      return error;
    }

    // 数据库相关错误
    if (
      error.name === 'MongoError' ||
      error.name === 'SequelizeError' ||
      error.name === 'MongoServerError' ||
      error.name === 'SequelizeValidationError'
    ) {
      // 处理唯一性约束错误
      if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
        const field = this._extractFieldFromDuplicateError(error);
        return new UniqueConstraintError(field, null, `${field}已存在`);
      }
      return new DatabaseError(context.operation || '未知', error.message, error);
    }

    // EggJS验证相关错误
    if (error.name === 'ValidationError' || error.code === 'invalid_param') {
      return new ValidationError(context.field || null, error.message);
    }

    // 权限相关错误
    if (error.status === 401 || error.message.includes('认证') || error.message.includes('登录')) {
      return new AuthenticationError(error.message);
    }

    if (error.status === 403 || error.message.includes('权限')) {
      return new PermissionError(error.message, context.resource, context.action);
    }

    // 404错误
    if (error.status === 404 || error.message.includes('不存在')) {
      return new NotFoundError(context.resource || '资源', context.id);
    }

    // 默认返回通用业务错误
    return new BusinessError(error.message || '操作失败', 'UNKNOWN_ERROR', 500);
  }

  /**
   * 从重复键错误中提取字段名
   * @param error
   * @private
   */
  static _extractFieldFromDuplicateError(error) {
    if (error.keyPattern) {
      return Object.keys(error.keyPattern)[0];
    }
    if (error.fields) {
      return Object.keys(error.fields)[0];
    }
    // 从错误消息中提取字段名
    const match = error.message.match(/index:\s*(\w+)/);
    return match ? match[1] : '字段';
  }

  /**
   * 快速创建常见业务错误
   * @param value
   */
  static userNameExists(value = null) {
    return new UniqueConstraintError('userName', value, '用户名已存在');
  }

  static emailExists(value = null) {
    return new UniqueConstraintError('userEmail', value, '邮箱已存在');
  }

  static phoneExists(value = null) {
    return new UniqueConstraintError('userPhone', value, '手机号已存在');
  }

  static invalidCredentials() {
    return new AuthenticationError('用户名或密码错误');
  }

  static userNotFound(id = null) {
    return new NotFoundError('用户', id);
  }

  static userDisabled() {
    return new BusinessRuleError('USER_DISABLED', '用户已被禁用');
  }
}

// 导出所有错误类型
module.exports = {
  BusinessError,
  ValidationError,
  PermissionError,
  AuthenticationError,
  NotFoundError,
  DataConsistencyError,
  UniqueConstraintError,
  ConfigurationError,
  ExternalServiceError,
  DatabaseError,
  BusinessRuleError,
  RateLimitError,
  FileOperationError,
  ConcurrencyError,
  ErrorFactory,
};
