/**
 * SPA 回退中间件
 * 处理微前端子应用的路由回退到 index.html
 */

'use strict';

const path = require('path');
const fs = require('fs');

module.exports = () => {
  return async function spaFallback(ctx, next) {
    await next();

    // 只处理 GET 请求且返回 404 的情况
    if (ctx.method !== 'GET') {
      return;
    }

    // 检查是否是微前端子应用的路径
    const microAppPaths = ['/static/remote-page/ai-content-publish', '/static/remote-page/ai-model-manage'];

    const matchedPath = microAppPaths.find(appPath => ctx.path.startsWith(appPath));

    if (matchedPath) {
      // 提取应用名称
      const appName = matchedPath.split('/').pop();
      const indexPath = path.join(ctx.app.baseDir, 'backstage/remote-page', appName, 'index.html');

      // 检查 index.html 是否存在
      if (fs.existsSync(indexPath)) {
        // 设置 CORS 头部以支持跨域访问
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        ctx.type = 'html';
        ctx.body = fs.readFileSync(indexPath, 'utf8');
        ctx.status = 200;

        ctx.app.logger.info(`[SPA Fallback] ${ctx.path} -> ${indexPath}`);
      }
    }
  };
};
