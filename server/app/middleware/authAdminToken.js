/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2025-12-25 13:05:39
 */
'use strict';
const { authToken } = require('../utils');
const _ = require('lodash');

module.exports = (options, app) => {
  const routeWhiteList = [
    // v1 版本化后的管理端接口
    '/api/v1/admin/login',
    '/api/v1/admin/init/status',
    '/api/v1/admin/init',
    '/manage/v1/admins/login',
    '/manage/v1/admins/init/status',
    '/manage/v1/admins/init',
    '/manage/v1/admins/logout',
  ];

  /**
   * 判断是否为API请求
   * @param {Object} ctx - Egg.js上下文对象
   * @return {boolean} 是否为API请求
   */
  const isApiRequest = ctx => {
    // 检查Accept头部
    const accept = ctx.get('accept') || '';
    if (accept.includes('application/json')) {
      return true;
    }

    // 检查Content-Type头部
    const contentType = ctx.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return true;
    }

    // 检查是否有Authorization头部（通常API请求会带token）
    if (ctx.get('authorization')) {
      return true;
    }

    // 检查X-Requested-With头部（Ajax请求）
    if (ctx.get('x-requested-with') === 'XMLHttpRequest') {
      return true;
    }

    // 检查路径是否包含API标识
    const url = ctx.originalUrl || ctx.url;
    if (url.includes('/api/') || url.startsWith('/manage/')) {
      return true;
    }

    return false;
  };

  /**
   * 处理鉴权失败的情况
   * @param {Object} ctx - Egg.js上下文对象
   * @param {string} reason - 失败原因
   */
  const handleAuthFailure = (ctx, reason = 'token_invalid') => {
    // 记录鉴权失败日志
    ctx.logger.warn(`Admin auth failed: ${reason}, URL: ${ctx.originalUrl}, IP: ${ctx.ip}`);

    if (isApiRequest(ctx)) {
      // API请求返回JSON错误响应
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: ctx.__('middleware.auth.sessionExpired'),
        code: 'AUTH_FAILED',
        reason,
        timestamp: Date.now(),
      };
    } else {
      // 页面请求进行重定向，但要避免死循环
      const currentUrl = ctx.originalUrl || ctx.url;

      // 如果当前已经在登录相关页面，避免重复重定向
      if (currentUrl.includes('/admin/login') || currentUrl.includes('/dr-admin')) {
        ctx.status = 403;
        ctx.body = ctx.__('middleware.auth.accessDenied');
        return;
      }

      // 保存原始请求URL到session，登录成功后可以跳转回去
      if (ctx.method === 'GET' && !currentUrl.includes('/admin/login')) {
        ctx.session.redirectUrl = currentUrl;
      }

      ctx.redirect('/admin/login');
    }
  };

  const isInRouteWhiteList = (path, whiteList = []) => {
    if (!path || !whiteList || whiteList.length === 0) {
      return false;
    }
    return whiteList.some(item => {
      if (!item) return false;
      if (item.endsWith('*')) {
        const prefix = item.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === item;
    });
  };

  return async function authAdminToken(ctx, next) {
    // 清空之前的用户信息
    ctx.session.adminUserInfo = '';
    let userToken = '';

    // 白名单检查 - 提前检查避免不必要的token验证
    const currentPath = ctx.path || ctx.originalUrl.split('?')[0];
    const isWhitelisted = isInRouteWhiteList(currentPath, routeWhiteList);

    if (isWhitelisted) {
      await next();
      return;
    }

    // Get token from cookie
    // 🔥 读取 cookie 时不需要指定 secure 等属性，这些是设置时才需要的
    const getTokenFromCookie = ctx.cookies.get('admin_' + app.config.auth_cookie_name, {
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

    if (!userToken) {
      handleAuthFailure(ctx, 'no_token');
      return;
    }

    // 验证token - 只捕获token相关错误
    let checkToken;
    try {
      checkToken = await authToken.checkToken(userToken, app.config.jwtSecret);
    } catch (error) {
      ctx.logger.error('Token verification failed:', error);
      handleAuthFailure(ctx, 'token_verification_failed');
      return;
    }

    if (!checkToken?.id) {
      handleAuthFailure(ctx, 'invalid_token');
      return;
    }

    if (typeof checkToken !== 'object') {
      handleAuthFailure(ctx, 'malformed_token');
      return;
    }

    // 查询用户信息 - 只捕获数据库查询错误
    let targetUser;
    try {
      targetUser = await ctx.service.admin.findOne(
        {
          id: checkToken.id,
        },
        {
          populate: [{ path: 'userRoles' }],
          fields: ['id', 'userName', 'status', 'userRoles'], // 明确指定需要的字段，排除password和userEmail
        }
      );
    } catch (error) {
      ctx.logger.error('User query failed:', error);
      handleAuthFailure(ctx, 'user_query_failed');
      return;
    }

    if (_.isEmpty(targetUser)) {
      handleAuthFailure(ctx, 'user_not_found');
      return;
    }

    // 检查用户状态
    if (targetUser.status !== '1' && targetUser.status !== 1) {
      handleAuthFailure(ctx, 'user_disabled');
      return;
    }

    // 设置用户信息到session
    const { userName, id } = targetUser;
    ctx.session.adminUserInfo = {
      userName,
      id,
      // userRoles,
    };

    // 记录成功登录日志
    ctx.logger.info(`Admin auth success: ${userName}(${id}), URL: ${ctx.originalUrl}`);

    // 执行后续中间件和controller，不捕获其错误
    // 让controller的错误正常向上传播到全局错误处理器
    await next();
  };
};
