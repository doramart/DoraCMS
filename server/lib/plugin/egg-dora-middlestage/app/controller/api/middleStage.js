/*
 * @Author: doramart
 * @Date: 2019-09-23 14:44:21
 * @Last Modified by: doramart
 * @Last Modified time: 2025-11-22 11:00:08
 */
'use strict';
const DoraMiddleStageController = {
  async sendVerificationCode(ctx) {
    try {
      const params = ctx.request.body;
      const pluginItem = await ctx.helper.reqJsonData(
        this.app.config.doracms_api + '/api/singleUser/sendVerificationCode',
        params,
        'post'
      );
      ctx.helper.renderSuccess(ctx, {
        data: pluginItem,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },

  async getClientNotice(ctx) {
    try {
      const payload = ctx.query;

      const noticeList = await ctx.helper.reqJsonData(
        ctx.app.config.doracms_api + '/api/clientNotice/getList',
        payload
      );

      ctx.helper.renderSuccess(ctx, {
        data: noticeList,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },

  async getVersionMaintenanceInfo(ctx) {
    try {
      const payload = ctx.query;

      const noticeList = await ctx.helper.reqJsonData(
        this.app.config.doracms_api + '/api/versionMaintenance/getList',
        payload
      );

      ctx.helper.renderSuccess(ctx, {
        data: noticeList,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },
};

module.exports = DoraMiddleStageController;
