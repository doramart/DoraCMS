/*
 * @Author: doramart
 * @Date: 2019-11-02 18:38:55
 * @Discription 404 filter
 * @Last Modified by: doramart
 * @Last Modified time: 2025-10-03 09:25:28
 */
'use strict';
const _ = require('lodash');
module.exports = (options, app) => {
  return async function notFoundHandler(ctx, next) {
    // 初始化获取 host 信息
    if (!app.server_path && ctx.origin) {
      app.server_path = app.config.server_path || ctx.origin;
    }
    await next();
    if (ctx.status === 404 && !ctx.body) {
      if (ctx.acceptJSON) {
        ctx.body = {
          error: 'Not Found',
        };
      } else {
        if (ctx.originalUrl.indexOf('/admin/') === 0) {
          ctx.redirect('/dr-admin');
        } else {
          try {
            // 🔥 重构：使用新的 templateNew service 替代废弃的 contentTemplate
            const activeTheme = await ctx.service.template.getActiveTheme();

            // 🔥 重构：直接通过 service 调用获取系统配置
            const configs = await ctx.service.systemConfig.getConfigsAsObject();

            if (!_.isEmpty(activeTheme) && !_.isEmpty(configs)) {
              await ctx.render(`${activeTheme.slug}/templates/error-404.html`, {
                domain: configs.siteDomain,
                siteName: configs.siteName,
              });
            } else {
              ctx.body = '<h1>Page Not Found</h1>';
            }
          } catch (error) {
            ctx.body = '<h1>Page Not Found</h1>';
          }
        }
      }
    }
  };
};
