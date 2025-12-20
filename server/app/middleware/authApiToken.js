/*
 * @Author: doramart
 * @Date: 2019-08-16 14:51:46
 * @Last Modified by: doramart
 * @Last Modified time: 2025-10-30 14:49:56
 */
'use strict';
const crypto = require('crypto');
const _ = require('lodash');
module.exports = () => {
  return async function authApiToken(ctx, next) {
    if (ctx.session.logined) {
      await next();
    } else {
      const key = ctx.get('X-API-Key');
      const timestamp = ctx.get('X-API-Timestamp');
      const signature = ctx.get('X-API-Signature');

      if (!key || !timestamp || !signature) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 验证时间戳是否在有效期内（例如：5分钟）
      const now = Date.now();
      const requestTime = parseInt(timestamp, 10);
      if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 获取 API Key 信息（需要完整的 secret 来验证签名）
      const apiKey = await ctx.service.apiKey.findByKey(key, { includeSecret: true, populate: [] });
      if (!apiKey) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 验证 API Key 状态
      if (apiKey.status !== 'active') {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 验证是否过期
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 验证 IP 白名单
      if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0) {
        const clientIp = ctx.ip;
        const isIpAllowed = apiKey.ipWhitelist.some(allowedIp => {
          // 支持 CIDR 格式或精确匹配
          if (allowedIp.includes('/')) {
            // TODO: 需要实现 CIDR 匹配逻辑
            return clientIp === allowedIp.split('/')[0];
          }
          return clientIp === allowedIp;
        });

        if (!isIpAllowed) {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('system.notice.noPower'),
            code: 403,
          });
          return;
        }
      }

      // 验证签名
      const method = ctx.method.toUpperCase();
      const path = ctx.path;
      const body = ctx.request.body || {};
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const message = `${timestamp}${method}${path}${bodyString}`;
      const expectedSignature = crypto.createHmac('sha256', apiKey.secret).update(message).digest('hex');

      if (signature !== expectedSignature) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 401,
        });
        return;
      }

      // 验证权限
      // 注意：空权限数组会拒绝所有请求，这是安全的默认行为
      // 必须明确配置权限才能访问对应的API
      const hasPermission =
        apiKey.permissions &&
        apiKey.permissions.some(
          permission => permission.enabled && permission.url === path && permission.method === method
        );

      if (!hasPermission) {
        ctx.helper.renderFail(ctx, {
          message: ctx.__('system.notice.noPower'),
          code: 403,
        });
        return;
      }

      if (apiKey.userId) {
        const targetUser = await ctx.service.user.findOne(
          { id: { $eq: apiKey.userId } },
          {
            fields: getAuthUserFields('session').split(' ').filter(Boolean),
          }
        );
        if (!_.isEmpty(targetUser)) {
          const { id, userName, email } = targetUser;
          ctx.session.user = {
            id,
            userName,
            email,
          };
          ctx.session.logined = true;
        } else {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('system.notice.noPower'),
            code: 401,
          });
          return;
        }
      }

      // 将 API Key 信息添加到上下文
      ctx.apiKey = apiKey;

      // 更新 API Key 最后使用时间（异步执行，不阻塞请求）
      ctx.service.apiKey.updateLastUsedAt(key).catch(err => {
        ctx.logger.error('Failed to update API Key lastUsedAt:', err);
      });

      await next();
    }
  };
};
