/**
 * 统一错误处理中间件
 * 捕获应用中的所有异常并进行标准化处理
 */
'use strict';

const APIResponse = require('../utils/apiResponse');
const { ErrorCodes, getErrorByCode } = require('../constants/ErrorCodes');
const { BusinessError, ErrorFactory } = require('../exceptions');

module.exports = (options = {}) => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (error) {
      // 记录错误日志
      ctx.app.logger.error('[ErrorHandler] Caught error:', error);

      // 错误分类和转换
      let errorInfo;
      let statusCode;
      let errorCode;
      let errorMessage;
      const errorData = {};

      // 1. 业务异常（BusinessError）
      if (error instanceof BusinessError) {
        errorCode = error.code;
        errorMessage = error.message;
        statusCode = error.statusCode || 500;

        if (error.field) {
          errorData.field = error.field;
        }
        if (error.resource) {
          errorData.resource = error.resource;
        }
      }
      // 2. 参数验证错误（egg-parameter）
      else if (error.code === 'invalid_param') {
        errorCode = 'VALIDATION_ERROR';
        errorMessage = error.message || 'Validation error';
        statusCode = 400;
        errorData.errors = error.errors;
      }
      // 3. 数据库错误
      else if (error.name === 'MongoError' || error.name === 'SequelizeError') {
        if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
          // 唯一键冲突
          errorCode = 'DUPLICATE_KEY';
          errorMessage = 'Duplicate key error';
          statusCode = 422;
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
          // 外键约束
          errorCode = 'FOREIGN_KEY_CONSTRAINT';
          errorMessage = 'Foreign key constraint violation';
          statusCode = 422;
        } else {
          errorCode = 'DATABASE_ERROR';
          errorMessage = 'Database error';
          statusCode = 500;
        }
      }
      // 4. JWT 认证错误
      else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        if (error.name === 'TokenExpiredError') {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = 'Token has expired';
        } else {
          errorCode = 'TOKEN_INVALID';
          errorMessage = 'Invalid token';
        }
        statusCode = 401;
      }
      // 5. HTTP 错误
      else if (error.status) {
        statusCode = error.status;
        errorMessage = error.message;

        // 根据状态码映射错误码
        if (statusCode === 400) {
          errorCode = 'BAD_REQUEST';
        } else if (statusCode === 401) {
          errorCode = 'UNAUTHORIZED';
        } else if (statusCode === 403) {
          errorCode = 'FORBIDDEN';
        } else if (statusCode === 404) {
          errorCode = 'NOT_FOUND';
        } else if (statusCode === 422) {
          errorCode = 'BUSINESS_ERROR';
        } else if (statusCode === 429) {
          errorCode = 'TOO_MANY_REQUESTS';
        } else if (statusCode >= 500) {
          errorCode = 'INTERNAL_ERROR';
        } else {
          errorCode = 'UNKNOWN_ERROR';
        }
      }
      // 6. 其他错误
      else {
        // 尝试使用 ErrorFactory 转换
        const context = {
          operation: ctx.method,
          resource: ctx.path.split('/').pop(),
          url: ctx.url,
          method: ctx.method,
        };
        const businessError = ErrorFactory.fromOriginalError(error, context);
        errorCode = businessError.code;
        errorMessage = businessError.message;
        statusCode = businessError.statusCode || 500;
      }

      // 获取标准错误信息（如果存在）
      if (hasErrorCode(errorCode)) {
        errorInfo = getErrorByCode(errorCode);
        // 使用自定义消息或默认消息
        errorMessage = errorMessage || errorInfo.message;
        statusCode = statusCode || errorInfo.statusCode;
      }

      // 开发环境下添加调试信息
      if (ctx.app.config.env === 'local' || ctx.app.config.env === 'development') {
        errorData.debug = {
          stack: error.stack,
          originalError: error.name,
          path: ctx.path,
          method: ctx.method,
          params: ctx.params,
          query: ctx.query,
          body: ctx.request.body,
        };
      }

      // 使用 APIResponse 发送统一格式的错误响应
      APIResponse.fail(ctx, {
        message: errorMessage,
        code: errorCode,
        status: statusCode,
        data: errorData,
      });

      // 触发错误事件（可用于监控和报警）
      ctx.app.emit('error', error, ctx);
    }
  };
};

/**
 * 辅助函数：检查错误码是否存在
 * @param code
 */
function hasErrorCode(code) {
  return !!ErrorCodes[code];
}
