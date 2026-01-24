/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2026-01-24 23:34:20
 */
'use strict';
const _ = require('lodash');
module.exports = (options, app) => {
  const getRouteWhiteList = () => app.permissionWhiteList || app.getPermissionWhiteList() || [];

  return async function authAdminPower(ctx, next) {
    try {
      if (_.isEmpty(ctx.session.adminUserInfo)) {
        throw new Error(ctx.__('system.notice.noPower'));
      }
      const routeWhiteList = getRouteWhiteList();

      /**
       * 检查API权限匹配 - 安全加固版本
       * 支持泛型接口权限验证，如 template/updateOne 可以匹配 template/updateOne/:id
       * @param {string} resourceApiUrl 权限配置中的API路径
       * @param {string} targetApi 实际请求的API路径
       * @return {boolean} 是否匹配
       */
      const isApiMatched = (resourceApiUrl, targetApi) => {
        // 输入验证
        if (!resourceApiUrl || !targetApi || typeof resourceApiUrl !== 'string' || typeof targetApi !== 'string') {
          return false;
        }

        // 1. 精确匹配（最安全）
        if (resourceApiUrl === targetApi) {
          return true;
        }

        // 2. 泛型路由匹配：处理带参数的路由（严格模式）
        // 如：template/updateOne 应该匹配 template/updateOne/123
        const resourceParts = resourceApiUrl.split('/').filter(part => part.length > 0);
        const targetParts = targetApi.split('/').filter(part => part.length > 0);

        // 🔒 安全检查：资源路径不能为空或只有一个部分（防止过于宽泛的匹配）
        if (resourceParts.length === 0 || resourceParts.length === 1) {
          return false;
        }

        // 🔒 安全检查：目标路径必须比资源路径长，但不能超过合理范围
        if (resourceParts.length >= targetParts.length || targetParts.length > resourceParts.length + 2) {
          return false;
        }

        // 🔒 严格匹配前面的路径段
        for (let i = 0; i < resourceParts.length; i++) {
          if (resourceParts[i] !== targetParts[i]) {
            return false;
          }
        }

        // 🔒 验证额外的参数段
        const extraParts = targetParts.slice(resourceParts.length);
        if (extraParts.length > 0) {
          // 参数验证：确保参数是合法的ID或标识符
          for (const param of extraParts) {
            // 参数不能为空，不能包含特殊字符，长度限制
            if (
              !param ||
              param.length > 50 ||
              /[<>\"'&\s]/.test(param) ||
              param.includes('..') ||
              param.includes('//')
            ) {
              return false;
            }
          }
          return true;
        }

        return false;
      };

      /**
       * 检查API是否在白名单中
       * @param {string} targetApi 目标API路径
       * @param {Array} whiteList 白名单数组
       * @return {boolean} 是否在白名单中
       */
      const isInWhiteList = (targetApi, whiteList) => {
        if (_.isEmpty(whiteList)) {
          return false;
        }

        return whiteList.some(item => {
          // 支持通配符匹配：如 "admin/*"
          if (item.indexOf('*') > 0) {
            const prefix = item.split('*')[0];
            return targetApi.indexOf(prefix) === 0;
          }
          // 精确匹配或泛型匹配
          return item === targetApi || isApiMatched(item, targetApi);
        });
      };

      /**
       * 将 kebab-case 转换为 camelCase
       * 例如：content-tag -> contentTag
       * @param {string} str kebab-case 字符串
       * @return {string} camelCase 字符串
       */
      const kebabToCamel = str => {
        if (!str || typeof str !== 'string') {
          return str;
        }
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      };

      // 获取当前请求的API路径
      const requestPath = ctx.path || ctx.originalUrl.split('?')[0];
      const targetApi = requestPath.startsWith('/manage/')
        ? requestPath.replace('/manage/', '')
        : requestPath.replace(/^\//, '');
      const requestMethod = (ctx.method || 'GET').toUpperCase();

      if (isInWhiteList(targetApi, routeWhiteList)) {
        // 1. 先检查白名单（最快，避免数据库查询）
        await next();
        return;
      }

      // 2. 获取当前用户的权限信息
      const adminPower = await ctx.helper.getAdminPower(ctx);

      // 3. 检查用户是否有权限访问该API
      let hasPower = false;

      // 兼容旧格式（数组）和新格式（对象）
      let apis = [];
      let routePaths = [];

      const permissionCodes = Array.isArray(adminPower.permissionCodes) ? adminPower.permissionCodes : [];

      if (Array.isArray(adminPower)) {
        // 旧格式：直接是API数组
        apis = adminPower;
      } else if (adminPower && typeof adminPower === 'object') {
        // 新格式：包含 apis 和 routePaths
        apis = adminPower.apis || [];
        routePaths = adminPower.routePaths || [];
      }

      // 3.0 优先使用 PermissionRegistry 进行 method + path 校验
      if (app.permissionRegistry && permissionCodes.length > 0) {
        hasPower = app.permissionRegistry.match(requestMethod, requestPath, permissionCodes);
      }

      const allowFallback = permissionCodes.length === 0;

      // 3.1 先尝试按钮API匹配（精确匹配）
      if (allowFallback && !hasPower && apis.length > 0) {
        const matchFromApis = apis.some(api => {
          let apiPath = api;
          let apiMethod = null;
          if (api && typeof api === 'object') {
            apiPath = api.api;
            apiMethod = api.method ? api.method.toUpperCase() : null;
          }
          const matched = isApiMatched(apiPath, targetApi);
          if (!matched) return false;
          if (apiMethod && apiMethod !== requestMethod) {
            return false;
          }
          return matched;
        });
        hasPower = matchFromApis;
      }

      // 3.2 如果按钮API匹配失败，尝试路由路径匹配（严格降级策略）
      // 用于支持没有配置按钮的菜单，但需要严格控制匹配范围
      if (allowFallback && !hasPower && routePaths.length > 0) {
        const matchFromRoutes = routePaths.some(routePath => {
          // 🔒 输入验证
          if (!routePath || typeof routePath !== 'string') {
            return false;
          }

          // 🔒 安全检查：禁止过于宽泛的路径匹配
          // 不允许根路径或单级路径的宽泛匹配
          if (routePath === '/' || routePath === '' || !routePath.includes('/')) {
            return false;
          }

          // 方案1：精确匹配（最安全）
          if (targetApi === routePath) {
            return true;
          }

          // 方案2：智能路由到API映射（安全版本）
          // 从路由路径推导出可能的API模块名
          const routeParts = routePath.split('/').filter(part => part.length > 0);
          const apiParts = targetApi.split('/').filter(part => part.length > 0);

          // 🔒 安全限制：路由路径必须至少有1个部分
          if (routeParts.length === 0) {
            return false;
          }

          // 🔒 API必须是标准的两段式格式：模块/操作
          if (apiParts.length !== 2) {
            return false;
          }

          // 🔒 从路由路径提取可能的API模块名
          // 支持多种映射策略：
          // 1. 路由最后一段 -> API模块名
          // 2. kebab-case -> camelCase 转换
          const lastRoutePart = routeParts[routeParts.length - 1];
          const apiModuleName = apiParts[0];
          const apiOperation = apiParts[1];

          // 策略1：直接匹配最后一段
          let isModuleMatched = lastRoutePart === apiModuleName;

          // 策略2：kebab-case 转 camelCase 匹配
          if (!isModuleMatched) {
            const camelCaseRoutePart = kebabToCamel(lastRoutePart);
            isModuleMatched = camelCaseRoutePart === apiModuleName;
          }

          // 策略3：处理复合词匹配（如 user-manage -> user）
          if (!isModuleMatched) {
            const baseModuleName = lastRoutePart.split('-')[0];
            isModuleMatched = baseModuleName === apiModuleName;
          }

          if (!isModuleMatched) {
            return false;
          }

          // 🔒 验证操作名格式（更灵活的安全策略）
          // 操作名必须符合安全的命名规范，但不限制具体操作
          const operationPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
          if (!operationPattern.test(apiOperation)) {
            return false;
          }

          // 🔒 防止危险操作名
          const dangerousOperations = [
            'eval',
            'exec',
            'system',
            'shell',
            'cmd',
            'deleteAll',
            'dropTable',
            'truncate',
            'format',
            'rm',
            'rmdir',
            'unlink',
            'destroy',
          ];

          if (dangerousOperations.includes(apiOperation)) {
            return false;
          }

          // 🔒 操作名长度限制
          if (apiOperation.length > 50) {
            return false;
          }

          return true;
        });
        hasPower = matchFromRoutes;
      }

      if (!hasPower) {
        // 🔒 安全审计：记录权限拒绝日志
        ctx.logger.warn('Permission denied', {
          userId: ctx.session.adminUserInfo.id,
          userName: ctx.session.adminUserInfo.userName,
          targetApi,
          userAgent: ctx.headers['user-agent'],
          ip: ctx.ip,
          method: requestMethod,
          path: requestPath,
          timestamp: new Date().toISOString(),
        });

        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
        });
        return;
      }

      // 🔒 安全审计：记录权限通过日志（仅在调试模式下）
      if (process.env.NODE_ENV === 'development') {
        ctx.logger.debug('Permission granted', {
          userId: ctx.session.adminUserInfo.id,
          userName: ctx.session.adminUserInfo.userName,
          targetApi,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. 权限验证通过，继续执行
      await next();
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error.message,
      });
    }
  };
};
