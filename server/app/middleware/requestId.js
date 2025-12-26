/**
 * Request ID 中间件
 * 为每个请求生成唯一的追踪 ID，用于日志关联和问题排查
 */
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = () => {
  return async function requestId(ctx, next) {
    // 优先使用客户端传入的 Request ID（如果存在且有效）
    const clientRequestId = ctx.get('X-Request-ID') || ctx.get('X-Request-Id');

    // 生成或使用现有的 Request ID
    ctx.requestId = clientRequestId || uuidv4();

    // 设置响应头，方便客户端追踪
    ctx.set('X-Request-ID', ctx.requestId);

    await next();
  };
};
