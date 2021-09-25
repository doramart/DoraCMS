/*
 * @Author: doramart
 * @Date: 2019-09-26 09:19:25
 * @Last Modified by: doramart
 * @Last Modified time: 2020-04-01 09:32:02
 */
'use strict';
const _ = require('lodash');

const AdsController = {
  /**
   * @api {get} /api/ads/getOne 查找指定位置 banner
   * @apiDescription 根据ID获取广告(单图或轮播图),包含后台自定义的名称 注意：返回结果中如果 state=true 才显示
   * @apiName /ads/getOne
   * @apiGroup Ads
   * @apiParam {string} name 广告位名称（anli/案例）
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *  {
   *      "status": 200,
   *      "message": "ads",
   *      "server_time": 1542116428394,
   *      "data": {
   *        "_id": "kYMDJLFDcb",
   *        "name": "creatorClass",
   *        "comments": "创作者课顶部轮播图",
   *        "__v": 0,
   *        "items": [
   *          {
   *            "_id": "MXoW1aBxk",
   *            "title": "",
   *            "link": "https://creatorchain.work",
   *            "appLink": "MXoW1aBxk", // app链接（文章id或普通url）
   *            "appLinkType": "0", // app链接形式 0 文章，1 普通链接
   *            "width": null,
   *            "alt": "发现ads1",
   *            "sImg": "/upload/images/img20181113213438.jpg",
   *            "__v": 0,
   *            "date": "2018-11-13T13:34:56.988Z",
   *            "target": "_blank",
   *            "height": null
   *          },
   *          {
   *            "_id": "h8YuPIf6Aj",
   *            "title": "",
   *            "link": "https://creatorchain.work",
   *            "appLink": "MXoW1aBxk", // app链接（文章id或普通url）
   *            "appLinkType": "0", // app链接形式 0 文章，1 普通链接
   *            "width": null,
   *            "alt": "发现ads2",
   *            "sImg": "/upload/images/img20181113213454.jpg",
   *            "__v": 0,
   *            "date": "2018-11-13T13:34:56.991Z",
   *            "target": "_blank",
   *            "height": null
   *          }
   *        ],
   *        "date": "2018-11-13 21:34:56",
   *        "height": null,
   *        "state": true,
   *        "carousel": true,
   *        "type": "1",
   *        "id": "kYMDJLFDcb"
   *      }
   *  }
   * @apiSampleRequest http://localhost:8080/api/ads/getOne
   * @apiVersion 1.0.0
   */
  async getOne(ctx, app) {
    try {
      const name = ctx.query.name;

      const targetItem = await ctx.service.ads.item(ctx, {
        query: {
          name,
          state: true,
        },
        populate: [
          {
            path: 'items',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: targetItem,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = AdsController;
