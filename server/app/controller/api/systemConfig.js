/*
 * @Author: doramart
 * @Date: 2019-07-07 13:07:27
 * @Last Modified by: doramart
 * @Last Modified time: 2025-07-26 10:27:38
 */
'use strict';
const Controller = require('egg').Controller;

class SystemConfigController extends Controller {
  async list() {
    const ctx = this.ctx;

    // 🔥 重构：使用统一的 service 方法获取配置对象
    const configObj = await ctx.service.systemConfig.getConfigsAsObject();

    ctx.helper.renderSuccess(ctx, {
      data: configObj,
    });
  }
}

module.exports = SystemConfigController;
