/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 14:52:13
 */
'use strict';
module.exports = (options) => {
  return async function authApiToken(ctx, next) {
    if (ctx.session.logined) {
      await next();
    } else {
      ctx.helper.renderFail(ctx, {
        message: ctx.__('label_notice_asklogin'),
      });
    }
  };
};
