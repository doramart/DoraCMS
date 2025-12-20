/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Description: 访问日志中间件 - 自动记录所有API请求
 */

'use strict';

module.exports = (options = {}) => {
  const {
    enabled = true,
    excludePaths = ['/health', '/ping', '/favicon.ico'],
    excludePatterns = [/^\/public\//, /^\/static\//],
    logSlowRequests = true,
    slowRequestThreshold = 1000, // 慢请求阈值（毫秒）
    logRequestBody = false, // 是否记录请求体（敏感数据已脱敏）
  } = options;

  return async function accessLogger(ctx, next) {
    // 如果禁用，直接跳过
    if (!enabled) {
      await next();
      return;
    }

    // 检查是否在排除列表中
    const path = ctx.request.path;
    if (excludePaths.includes(path)) {
      await next();
      return;
    }

    // 检查是否匹配排除模式
    if (excludePatterns.some(pattern => pattern.test(path))) {
      await next();
      return;
    }

    const startTime = Date.now();

    try {
      await next();
    } finally {
      const responseTime = Date.now() - startTime;

      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        try {
          // 判断是否需要记录（正常请求或慢请求）
          const shouldLog = !logSlowRequests || responseTime >= slowRequestThreshold;

          if (shouldLog && ctx.service?.systemOptionLog) {
            const options = {
              status: ctx.status,
              responseSize: ctx.length,
              extraData: {},
            };

            // 如果启用记录请求体
            if (logRequestBody && ctx.request.body) {
              options.extraData.requestBody = ctx.request.body;
            }

            // 如果是慢请求，添加标签
            if (responseTime >= slowRequestThreshold) {
              options.extraData.slow = true;
            }

            ctx.service.systemOptionLog.logAccess(ctx.request, responseTime, options).catch(err => {
              // 日志记录失败不应影响主流程
              console.error('[AccessLogger] Failed to log access:', err.message);
            });
          }
        } catch (err) {
          console.error('[AccessLogger] Error in logging:', err.message);
        }
      });
    }
  };
};
