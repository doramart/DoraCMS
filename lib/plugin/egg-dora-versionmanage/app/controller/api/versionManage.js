/*
 * @Author: doramart
 * @Date: 2019-09-23 14:44:21
 * @Last Modified by: doramart
 * @Last Modified time: 2020-04-01 12:52:39
 */
'use strict';
const VersionManageController = {
  /**
   * @api {get} /api/versionManage/getAppVersion 获取APP版本信息
   * @apiDescription 获取APP版本信息
   * @apiName /versionManage/getAppVersion
   * @apiGroup VersionManage
   * @apiParam {string} versionCode 版本号(传字符串类型整数)
   * @apiParam {string} client 客户端类型(0:安卓，1:ios)
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *    "status": 200,
   *    "message": "get versionData success",
   *    "server_time": 1548049855934,
   *    "data": {
   *         "_id": "H158NRt7Q",
   *         "description": "新增自动更新1",
   *         "title": "有更新啦1",
   *         "url": "/upload/images/apk20180717192615.apk",
   *         "version": "21",
   *         "versionName": "1.1",
   *         "date": "2018-07-16 16:16:17",
   *         "forcibly": true,
   *         "id": "H158NRt7Q"
   *    }
   *}
   * @apiSampleRequest http://localhost:8080/api/versionManage/getAppVersion
   * @apiVersion 1.0.0
   */
  async list(ctx) {
    try {
      const client = ctx.query.client;
      const queryObj = {};

      if (client) {
        if (client !== '0' && client !== '1') {
          throw new Error(ctx.__('validate_error_params'));
        } else {
          queryObj.client = client;
        }
      }

      const versionManageList = await ctx.service.versionManage.find(
        {
          isPaging: '0',
        },
        {
          query: queryObj,
        }
      );

      ctx.helper.renderSuccess(ctx, {
        data: versionManageList[0],
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.versionManage.item(ctx, {
        query: {
          _id,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetUser,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = VersionManageController;
