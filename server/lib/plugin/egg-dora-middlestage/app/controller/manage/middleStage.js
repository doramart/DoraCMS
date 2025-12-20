/*
 * @Author: doramart
 * @Date: 2019-09-23 14:44:21
 * @Last Modified by: doramart
 * @Last Modified time: 2025-11-19 21:15:17
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

  async doReg(ctx) {
    try {
      const params = ctx.request.body;
      const pluginItem = await ctx.helper.reqJsonData(
        this.app.config.doracms_api + '/api/singleUser/doReg',
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

  async doLogin(ctx) {
    try {
      // '/api/singleUser/doLogin',
      const params = ctx.request.body;
      const pluginItem = await ctx.helper.reqJsonData(
        this.app.config.doracms_api + '/api/singleUser/doLogin',
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

  async logOut(ctx) {
    try {
      const payload = ctx.query;
      if (!payload.singleUserToken) {
        throw new Error(ctx.__('validation.errorParams'));
      }
      const pluginItem = await ctx.helper.reqJsonData(this.app.config.doracms_api + '/api/singleUser/logOut', {
        token: payload.singleUserToken,
      });

      ctx.helper.renderSuccess(ctx, {
        data: pluginItem,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },

  async getUserInfo(ctx) {
    try {
      const payload = ctx.query;

      const pluginItem = await ctx.helper.reqJsonData(this.app.config.doracms_api + '/api/singleUser/userInfo', {
        token: payload.singleUserToken,
      });

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
