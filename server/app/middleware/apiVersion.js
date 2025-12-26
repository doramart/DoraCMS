/**
 * API 版本管理中间件
 * 支持 URL 路径版本（/api/v1/）和请求头版本（API-Version）
 * 在响应头中添加版本信息
 */
'use strict';

module.exports = (options = {}) => {
  // 默认配置
  const defaultOptions = {
    // 默认 API 版本
    defaultVersion: 'v1',

    // 支持的 API 版本列表
    supportedVersions: ['v1'],

    // 是否严格模式（不支持的版本返回 400）
    strictMode: false,

    // 版本提取正则表达式
    versionPattern: /^\/api\/(v\d+)\//,

    // 请求头字段名
    headerField: 'API-Version',
  };

  const config = { ...defaultOptions, ...options };

  return async function apiVersion(ctx, next) {
    let version = config.defaultVersion;
    let versionSource = 'default';

    // 1. 从 URL 路径提取版本（优先级最高）
    const pathMatch = ctx.path.match(config.versionPattern);
    if (pathMatch && pathMatch[1]) {
      version = pathMatch[1];
      versionSource = 'path';
    } else {
      // 2. 从请求头提取版本
      const headerVersion = ctx.get(config.headerField);
      if (headerVersion) {
        // 规范化版本号（支持 v1 或 1 格式）
        version = headerVersion.startsWith('v') ? headerVersion : `v${headerVersion}`;
        versionSource = 'header';
      }
    }

    // 验证版本是否支持
    if (!config.supportedVersions.includes(version)) {
      if (config.strictMode) {
        ctx.status = 400;
        ctx.body = {
          status: 400,
          code: 'UNSUPPORTED_API_VERSION',
          message: `API version '${version}' is not supported. Supported versions: ${config.supportedVersions.join(', ')}`,
          timestamp: new Date().toISOString(),
        };
        return;
      }
      // 非严格模式：使用默认版本
      version = config.defaultVersion;
      versionSource = 'fallback';
    }

    // 将版本信息附加到 ctx
    ctx.apiVersion = version;
    ctx.apiVersionSource = versionSource;

    // 设置响应头
    ctx.set('API-Version', version);
    ctx.set('X-API-Version-Source', versionSource);

    await next();
  };
};
