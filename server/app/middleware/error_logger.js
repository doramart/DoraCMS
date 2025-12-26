/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: 错误日志中间件 - 自动记录所有未捕获的异常
 */

'use strict';

module.exports = (options = {}) => {
  const {
    enabled = true,
    logStackTrace = process.env.NODE_ENV !== 'production',
    notifyOnCritical = false, // 是否在严重错误时发送通知
    criticalStatusCodes = [500, 502, 503, 504],
  } = options;

  return async function errorLogger(ctx, next) {
    if (!enabled) {
      await next();
      return;
    }

    try {
      await next();
    } catch (error) {
      // 记录原始错误
      const originalError = error;

      // 确定错误严重程度
      const severity = determineSeverity(error, ctx);

      // 异步记录异常日志
      setImmediate(() => {
        if (ctx.service?.systemOptionLog) {
          ctx.service.systemOptionLog
            .logException(originalError, {
              severity,
              status: ctx.status || error.status || 500,
              extraData: {
                url: ctx.request.url,
                method: ctx.request.method,
                userAgent: ctx.request.header['user-agent'],
                referer: ctx.request.header.referer,
              },
            })
            .catch(err => {
              console.error('[ErrorLogger] Failed to log exception:', err.message);
            });

          // 如果是严重错误且启用通知
          if (notifyOnCritical && severity === 'critical') {
            notifyCriticalError(ctx, originalError).catch(err => {
              console.error('[ErrorLogger] Failed to notify:', err.message);
            });
          }
        }
      });

      // 设置响应状态和内容
      ctx.status = error.status || 500;
      ctx.body = {
        success: false,
        message: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_ERROR',
      };

      // 开发环境返回堆栈信息
      if (logStackTrace && error.stack) {
        ctx.body.stack = error.stack;
      }

      // 触发应用级错误事件
      ctx.app.emit('error', error, ctx);
    }
  };

  /**
   * 确定错误严重程度
   * @param {Error} error 错误对象
   * @param {Object} ctx 上下文
   * @return {String} 严重程度
   */
  function determineSeverity(error, ctx) {
    // 严重错误（5xx）
    if (error.status >= 500 || criticalStatusCodes.includes(error.status)) {
      return 'critical';
    }

    // 高优先级错误（认证、授权、数据库错误）
    if (
      error.name === 'UnauthorizedError' ||
      error.name === 'ForbiddenError' ||
      error.name === 'DatabaseError' ||
      error.code === 'ECONNREFUSED'
    ) {
      return 'high';
    }

    // 中等优先级错误（4xx客户端错误）
    if (error.status >= 400 && error.status < 500) {
      return 'medium';
    }

    // 默认为高优先级
    return 'high';
  }

  /**
   * 通知严重错误（可扩展为发送邮件、短信、钉钉等）
   * @param {Object} ctx 上下文
   * @param {Error} error 错误对象
   * @return {Promise<void>}
   */
  async function notifyCriticalError(ctx, error) {
    // TODO: 实现通知逻辑
    // 例如：发送邮件、钉钉机器人、短信等
    console.error('[CRITICAL ERROR]', {
      message: error.message,
      stack: error.stack,
      url: ctx.request.url,
      method: ctx.request.method,
      user: ctx.user?.userName || 'anonymous',
    });
  }
};
