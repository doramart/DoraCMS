/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2025-05-15 19:49:14
 */
'use strict';

module.exports = (options = {}) => {
  return async function crossHeader(ctx, next) {
    // 设置允许的源，支持多个域名
    const allowedOrigins = options.origins || ['http://localhost:9527', 'http://localhost:3000'];
    const origin = ctx.get('origin');

    if (allowedOrigins.includes(origin)) {
      ctx.set('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      ctx.set('Access-Control-Allow-Origin', '*');
    }

    // 允许的请求头
    ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, yourHeaderFeild, x-request-id'
    );
    // 允许的请求方法
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    // 允许携带凭证（cookies等）
    ctx.set('Access-Control-Allow-Credentials', 'true');
    // 预检请求的有效期，单位秒
    ctx.set('Access-Control-Max-Age', '3600');

    // 处理预检请求
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    await next();
  };
};
