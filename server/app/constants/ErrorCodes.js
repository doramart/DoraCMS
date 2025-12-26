/**
 * 统一错误码定义
 * 用于标准化错误响应
 */
'use strict';

/**
 * 错误码分类：
 * - 1xxx: 客户端错误（400-499）
 * - 2xxx: 服务端错误（500-599）
 * - 3xxx: 认证/授权错误（401, 403）
 * - 4xxx: 业务逻辑错误（422）
 */

const ErrorCodes = {
  // ==================== 通用错误 ====================
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    statusCode: 500,
    category: 'server',
  },

  // ==================== 客户端错误（400-499）====================
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Bad request',
    statusCode: 400,
    category: 'client',
  },

  INVALID_PARAMETERS: {
    code: 'INVALID_PARAMETERS',
    message: 'Invalid parameters',
    statusCode: 400,
    category: 'client',
  },

  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    statusCode: 400,
    category: 'client',
  },

  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Missing required field',
    statusCode: 400,
    category: 'client',
  },

  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404,
    category: 'client',
  },

  METHOD_NOT_ALLOWED: {
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed',
    statusCode: 405,
    category: 'client',
  },

  CONFLICT: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    statusCode: 409,
    category: 'client',
  },

  UNSUPPORTED_MEDIA_TYPE: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Unsupported media type',
    statusCode: 415,
    category: 'client',
  },

  // ==================== 认证/授权错误（401, 403）====================
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    statusCode: 401,
    category: 'auth',
  },

  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired',
    statusCode: 401,
    category: 'auth',
  },

  TOKEN_INVALID: {
    code: 'TOKEN_INVALID',
    message: 'Invalid token',
    statusCode: 401,
    category: 'auth',
  },

  TOKEN_MISSING: {
    code: 'TOKEN_MISSING',
    message: 'Token is missing',
    statusCode: 401,
    category: 'auth',
  },

  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    statusCode: 403,
    category: 'auth',
  },

  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    statusCode: 403,
    category: 'auth',
  },

  // ==================== 业务逻辑错误（422）====================
  BUSINESS_ERROR: {
    code: 'BUSINESS_ERROR',
    message: 'Business logic error',
    statusCode: 422,
    category: 'business',
  },

  DUPLICATE_ENTRY: {
    code: 'DUPLICATE_ENTRY',
    message: 'Duplicate entry',
    statusCode: 422,
    category: 'business',
  },

  RESOURCE_ALREADY_EXISTS: {
    code: 'RESOURCE_ALREADY_EXISTS',
    message: 'Resource already exists',
    statusCode: 422,
    category: 'business',
  },

  OPERATION_NOT_ALLOWED: {
    code: 'OPERATION_NOT_ALLOWED',
    message: 'Operation not allowed',
    statusCode: 422,
    category: 'business',
  },

  INVALID_STATE: {
    code: 'INVALID_STATE',
    message: 'Invalid state',
    statusCode: 422,
    category: 'business',
  },

  // ==================== 速率限制（429）====================
  TOO_MANY_REQUESTS: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    statusCode: 429,
    category: 'rate_limit',
  },

  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    statusCode: 429,
    category: 'rate_limit',
  },

  // ==================== 服务端错误（500-599）====================
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500,
    category: 'server',
  },

  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database error',
    statusCode: 500,
    category: 'server',
  },

  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
    statusCode: 503,
    category: 'server',
  },

  GATEWAY_TIMEOUT: {
    code: 'GATEWAY_TIMEOUT',
    message: 'Gateway timeout',
    statusCode: 504,
    category: 'server',
  },

  // ==================== API 版本相关 ====================
  UNSUPPORTED_API_VERSION: {
    code: 'UNSUPPORTED_API_VERSION',
    message: 'Unsupported API version',
    statusCode: 400,
    category: 'client',
  },

  API_VERSION_DEPRECATED: {
    code: 'API_VERSION_DEPRECATED',
    message: 'API version is deprecated',
    statusCode: 400,
    category: 'client',
  },

  // ==================== 文件上传相关 ====================
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds limit',
    statusCode: 413,
    category: 'client',
  },

  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    message: 'Invalid file type',
    statusCode: 400,
    category: 'client',
  },

  FILE_UPLOAD_FAILED: {
    code: 'FILE_UPLOAD_FAILED',
    message: 'File upload failed',
    statusCode: 500,
    category: 'server',
  },

  // ==================== 数据库相关 ====================
  RECORD_NOT_FOUND: {
    code: 'RECORD_NOT_FOUND',
    message: 'Record not found',
    statusCode: 404,
    category: 'client',
  },

  DUPLICATE_KEY: {
    code: 'DUPLICATE_KEY',
    message: 'Duplicate key error',
    statusCode: 422,
    category: 'business',
  },

  FOREIGN_KEY_CONSTRAINT: {
    code: 'FOREIGN_KEY_CONSTRAINT',
    message: 'Foreign key constraint violation',
    statusCode: 422,
    category: 'business',
  },
};

/**
 * 根据错误码获取错误信息
 * @param {String} code 错误码
 * @return {Object} 错误信息对象
 */
function getErrorByCode(code) {
  return ErrorCodes[code] || ErrorCodes.UNKNOWN_ERROR;
}

/**
 * 根据分类获取所有错误码
 * @param {String} category 错误分类
 * @return {Array} 错误码数组
 */
function getErrorsByCategory(category) {
  return Object.values(ErrorCodes).filter(error => error.category === category);
}

/**
 * 检查错误码是否存在
 * @param {String} code 错误码
 * @return {Boolean} 是否存在
 */
function hasErrorCode(code) {
  return !!ErrorCodes[code];
}

module.exports = {
  ErrorCodes,
  getErrorByCode,
  getErrorsByCategory,
  hasErrorCode,
};
