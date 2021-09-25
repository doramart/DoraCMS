/*
 * @Author: doramart
 * @Date: 2019-11-02 18:38:55
 * @Discription 404 filter
 * @Last Modified by: doramart
 * @Last Modified time: 2020-07-28 20:34:10
 */
'use strict';
const _ = require('lodash');
module.exports = () => {
  return async function notFoundHandler(ctx, next) {
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
            const defaultTemp = await ctx.helper.reqJsonData(
              'contentTemplate/getDefaultTempInfo'
            );
            const configs = await ctx.helper.reqJsonData(
              'systemConfig/getConfig'
            );
            if (!_.isEmpty(defaultTemp) && !_.isEmpty(configs)) {
              await ctx.render(`${defaultTemp.alias}/404`, {
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
