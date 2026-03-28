/*
 * @Author: doramart
 * @Date: 2019-06-27 17:16:32
 * @Last Modified by: doramart
 * @Last Modified time: 2025-11-30 14:40:36
 */
'use strict';
const Controller = require('egg').Controller;
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { adminRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const { extractRecords, sanitizeAdminEntity } = require('../../utils/adminInitHelper');

class AdminController extends Controller {
  _assertInitAccess() {
    const { ctx, app } = this;
    const configuredToken = app.config.adminInit?.token;
    const providedToken =
      ctx.get('x-admin-init-token') || ctx.request.body?.initToken || ctx.query?.initToken || '';
    const ip = (ctx.ip || '').replace(/^::ffff:/, '');
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';

    if (configuredToken) {
      if (providedToken !== configuredToken) {
        throw RepositoryExceptions.business.operationNotAllowed('admin init token invalid');
      }
      return;
    }

    if (app.config.adminInit?.localOnly !== false && !isLoopback) {
      throw RepositoryExceptions.business.operationNotAllowed('admin init only allowed from localhost');
    }
  }

  async getInitStatus() {
    const { ctx, service } = this;
    const needInit = await service.admin.needsInitialization();

    ctx.helper.renderSuccess(ctx, {
      data: { needInit },
    });
  }

  async initSuperAdmin() {
    const { ctx, service } = this;
    this._assertInitAccess();
    const formData = ctx.request.body || {};

    const needInit = await service.admin.needsInitialization();
    if (!needInit) {
      throw RepositoryExceptions.business.operationNotAllowed(ctx.__('admin.init.alreadyInitialized'));
    }

    ctx.validate(adminRule.initOne(ctx), formData);

    const enabledRoles = await service.role.getEnabledRoles({
      fields: ['id'],
    });
    const roleIds = extractRecords(enabledRoles)
      .map(role => role.id)
      .filter(Boolean);

    const payload = {
      ...formData,
      userGender: formData.userGender || '1',
      userPhone: formData.userPhone || '00000000000',
      status: '1',
      createBy: 'system',
      userRoles: roleIds,
    };

    const admin = await service.admin.initializeFirstAdmin(payload);
    const sanitizedAdmin = sanitizeAdminEntity(admin);

    await ctx.helper.invalidateAdminPowerCacheByAdminIds(ctx, [sanitizedAdmin.id]);

    await ctx.service.systemOptionLog
      .logOperation({
        module: 'admin',
        action: 'init',
        resource_type: 'admin_user',
        resource_id: sanitizedAdmin.id,
        new_value: JSON.stringify({
          userName: sanitizedAdmin.userName,
          userEmail: sanitizedAdmin.userEmail,
          userPhone: sanitizedAdmin.userPhone,
        }),
        logs: ctx.__('logs.admin.create', [sanitizedAdmin.userName]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log init admin:', err.message);
      });

    ctx.helper.renderSuccess(ctx, {
      data: sanitizedAdmin,
    });
  }

  async loginUser() {
    const { ctx } = this;

    const fields = ctx.request.body || {};
    const systemConfigs = await ctx.service.systemConfig.findByKeys(['showImgCode']);
    const { showImgCode } = systemConfigs;

    // 图形验证码验证
    if (showImgCode && (!fields.imageCode || fields.imageCode !== ctx.session.imageCode)) {
      const errMsg = ctx.__('validation.inputCorrect', [ctx.__('user.auth.verify.imageCode')]);
      throw RepositoryExceptions.business.operationNotAllowed(errMsg);
    }

    // 参数验证
    ctx.validate(
      adminRule.login(ctx),
      Object.assign(
        {},
        { userName: fields.userName },
        {
          password: fields.password,
        }
      )
    );

    // 使用新的Repository登录验证方法（包含密码验证和状态检查）
    const user = await ctx.service.admin.verifyLogin(fields.userName, fields.password, 'username');

    // 生成JWT token
    const adminUserToken = jwt.sign(
      {
        id: user.id,
      },
      this.app.config.jwtSecret,
      {
        expiresIn: this.app.config.jwtExpiresIn,
      }
    );

    // 设置Cookie
    // 🔥 检测实际协议：支持通过代理（如 Nginx）的 HTTPS 场景
    const isSecure = ctx.secure || ctx.protocol === 'https';

    ctx.cookies.set('admin_' + this.app.config.auth_cookie_name, adminUserToken, {
      path: '/',
      maxAge: this.app.config.adminUserMaxAge,
      signed: true,
      httpOnly: true,
      // 🔥 根据实际协议动态设置
      secure: isSecure,
      // 🔥 如果不是 HTTPS，使用 lax 而不是 strict，提高兼容性
      sameSite: isSecure ? 'strict' : 'lax',
    }); // cookie 有效期30天

    // 记录登录日志（统一日志系统）
    await ctx.service.systemOptionLog.logUserLogin(user).catch(err => {
      // 日志记录失败不应影响登录流程
      console.error('[LoginLog] Failed to log:', err.message);
    });

    ctx.helper.renderSuccess(ctx, {
      data: {
        token: adminUserToken,
      },
    });
  }
}

module.exports = AdminController;
