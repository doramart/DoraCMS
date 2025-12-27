/*
 * @Author: doramart
 * @Date: 2025-01-27
 * @Description: API版本标识中间件 - 用于区分新旧接口请求
 */
'use strict';

module.exports = () => {
  return async function apiVersionLogger(ctx, next) {
    const startTime = Date.now();
    const path = ctx.path;
    const method = ctx.method;

    // 判断是否为v2新接口
    const isV2Api = path.startsWith('/v2');
    const apiVersion = isV2Api ? 'V2_NEW' : 'V1_LEGACY';

    // 在请求上下文中添加版本标识
    ctx.apiVersion = apiVersion;
    ctx.isV2Api = isV2Api;

    // 打印请求标识
    // console.log(`[API_VERSION] ${apiVersion} | ${method} ${path} | Time: ${new Date().toISOString()}`);

    // 在响应头中添加版本标识（可选，用于前端识别）
    ctx.set('X-API-Version', apiVersion);

    try {
      await next();

      // 记录响应时间
      const responseTime = Date.now() - startTime;
      // console.log(
      //   `[API_VERSION] ${apiVersion} | ${method} ${path} | Response Time: ${responseTime}ms | Status: ${ctx.status}`
      // );
    } catch (error) {
      // const responseTime = Date.now() - startTime;
      // console.error(
      //   `[API_VERSION] ${apiVersion} | ${method} ${path} | Error: ${error.message} | Response Time: ${responseTime}ms`
      // );
      throw error;
    }
  };
};
