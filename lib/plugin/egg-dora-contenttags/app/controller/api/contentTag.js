'use strict';
const _ = require('lodash');

const ContentTagController = {
  /**
   * @api {get} /api/contentTag/getList 获取标签列表
   * @apiDescription 获取标签列表
   * @apiName /contentTag/getList
   * @apiGroup ContentTag
   * @apiParam {string} token 登录返回的token
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "status": 200,
   *  "message": "communityTags",
   *  "server_time": 1542248521670,
   *  "data": [
   * {
   *      _id: "C41iXBDb5",
   *      name: "即时要闻",
   *      alias: "",
   *      comments: "即时要闻",
   *      __v: 0,
   *      date: "2019-01-04 16:54:41",
   *      id: "C41iXBDb5"
   * },
   * {
   *      _id: "C41iXBDb6",
   *      name: "测试",
   *      alias: "",
   *      comments: "测试",
   *      __v: 0,
   *      date: "2019-01-04 16:54:41",
   *      id: "C41iXBDb6"
   * },
   * {
   *      _id: "ZWlsRWWaL",
   *      name: "主笔专辑",
   *      alias: "",
   *      comments: "主笔专辑",
   *      __v: 0,
   *      date: "2019-01-04 16:54:35",
   *      id: "ZWlsRWWaL"
   * },
   * ...
   *  ]
   *}
   * @apiSampleRequest http://localhost:8080/api/contentTag/getList
   * @apiVersion 1.0.0
   */
  async list(ctx, app) {
    try {
      const payload = ctx.query;

      const queryObj = Object.assign(
        {
          isPaging: '0',
        },
        payload
      );

      const contentTagList = await ctx.service.contentTag.find(queryObj);

      ctx.helper.renderSuccess(ctx, {
        data: contentTagList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async hot(ctx, app) {
    try {
      const payload = ctx.query;
      const tagIds = await ctx.helper.reqJsonData(
        'content/getHotTagIds',
        payload
      );
      const currentList = [];
      for (const tagItem of tagIds) {
        if (tagItem.tags) {
          const targetItem = await ctx.service.contentTag.item(ctx, {
            query: {
              _id: tagItem.tags,
            },
          });
          if (!_.isEmpty(targetItem)) {
            currentList.push(targetItem);
          }
        }
      }
      ctx.helper.renderSuccess(ctx, {
        data: currentList,
      });
    } catch (error) {
      ctx.helper.renderFail(ctx, {
        message: error,
      });
    }
  },
};

module.exports = ContentTagController;
