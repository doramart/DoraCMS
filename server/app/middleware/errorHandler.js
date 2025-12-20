/**
 * 统一错误处理中间件
 * 捕获应用中的所有异常并进行标准化处理
 */
'use strict';

const { BusinessError, ErrorFactory } = require('../exceptions');

module.exports = (options = {}) => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (error) {
      // 记录错误日志
      ctx.app.logger.error('[ErrorHandler] Caught error:', error);

      // 转换为业务异常
      let businessError;
      if (error instanceof BusinessError) {
        businessError = error;
      } else {
        // 根据上下文信息创建合适的业务异常
        const context = {
          operation: ctx.method,
          resource: ctx.path.split('/').pop(),
          url: ctx.url,
          method: ctx.method,
        };
        businessError = ErrorFactory.fromOriginalError(error, context);
      }

      // 设置响应状态码
      ctx.status = businessError.statusCode || 500;

      // 构建响应数据
      const responseData = {
        status: businessError.statusCode || 500,
        code: businessError.code,
        message: businessError.message,
        timestamp: businessError.timestamp,
      };

      // 开发环境下添加调试信息
      if (ctx.app.config.env === 'local' || ctx.app.config.env === 'development') {
        responseData.debug = {
          stack: error.stack,
          originalError: error.name,
          path: ctx.path,
          method: ctx.method,
          params: ctx.params,
          query: ctx.query,
          body: ctx.request.body,
        };
      }

      // 特定错误类型的额外处理
      if (businessError.field) {
        responseData.field = businessError.field;
      }
      if (businessError.resource) {
        responseData.resource = businessError.resource;
      }

      // 发送响应
      ctx.body = responseData;

      // 触发错误事件（可用于监控和报警）
      ctx.app.emit('error', businessError, ctx);
    }
  };
};
