/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2025-08-03 10:58:55
 */
'use strict';
const { authToken } = require('../utils');
const _ = require('lodash');
module.exports = (options, app) => {
  return async function authUserToken(ctx, next) {
    try {
      ctx.session.user = '';
      ctx.session.logined = false;
      let userToken = '';

      // Get token from cookie
      // 🔥 读取 cookie 时不需要指定 secure 等属性，这些是设置时才需要的
      const getTokenFromCookie = ctx.cookies.get('api_' + app.config.auth_cookie_name, {
        signed: true, // 只需要指定是否签名即可
      });

      // Get token from Authorization header
      const authHeader = ctx.get('authorization');
      let getTokenFromHeader = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        getTokenFromHeader = authHeader.substring(7); // Remove 'Bearer ' prefix
      }

      // Prioritize Authorization header over cookie
      userToken = getTokenFromHeader || getTokenFromCookie;

      if (userToken) {
        try {
          const checkToken = await authToken.checkToken(userToken, app.config.jwtSecret);

          if (checkToken && typeof checkToken === 'object' && checkToken.userId) {
            const targetUser = await ctx.service.user.findOne(
              {
                id: { $eq: checkToken.userId },
              },
              {
                fields: getAuthUserFields('session').split(' ').filter(Boolean),
              }
            );
            const userContentsNum = await ctx.service.content.count({
              uAuthor: checkToken.userId,
              state: '2',
            });
            if (!_.isEmpty(targetUser)) {
              const {
                id,
                userName,
                email,
                logo,
                comments,
                praiseContents,
                praiseMessages,
                despiseMessage,
                favorites,
                followers,
                watchers,
              } = targetUser;
              ctx.session.user = {
                id,
                userName,
                email,
                logo,
                comments,
                praiseContentsNum: praiseContents.length,
                praiseMessagesNum: praiseMessages.length,
                despiseMessageNum: despiseMessage.length,
                favoritesNum: favorites.length,
                followersNum: followers.length,
                watchersNum: watchers.length,
                contentsNum: userContentsNum,
              };
              ctx.session.user.token = userToken;
              ctx.session.logined = true;

              // 自动续期session，确保与JWT token同步
              // ctx.session.manualSave();
            }
          }
        } catch (tokenError) {
          // JWT token验证失败，清除可能存在的过期cookie
          console.log('JWT token validation failed:', tokenError.message);
          ctx.cookies.set('api_' + app.config.auth_cookie_name, null, {
            path: '/',
            maxAge: 0,
          });
        }
      }
      await next();
    } catch (error) {
      // 记录错误日志
      console.error('authUserToken middleware error:', error);
      ctx.helper.renderFail(ctx, {
        message: `${error.message}`,
      });
      // await next();
    }
  };
};
