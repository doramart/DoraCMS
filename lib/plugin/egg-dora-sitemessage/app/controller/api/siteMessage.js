/*
 * @Author: doramart
 * @Date: 2019-09-26 09:19:25
 * @Last Modified by: doramart
 * @Last Modified time: 2020-04-01 12:38:22
 */
'use strict';
const _ = require('lodash');

const SiteMessageController = {
  /**
   * @api {get} /api/siteMessage/getList 获取用户消息列表
   * @apiDescription 获取用户消息列表，带分页，包含 赞赏、关注和评论消息，需要登录态
   * @apiName /siteMessage/getList
   * @apiGroup SiteMessage
   * @apiParam {string} current 当前页码
   * @apiParam {string} pageSize 每页记录数
   * @apiParam {string} token 登录时返回的参数鉴权
   * @apiParam {string} type 消息类别(1、赞赏 ，2、关注 ，3、评论或回复)
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *    "status": 200,
   *    "message": "getSiteMessages",
   *    "server_time": 1543917647397,
   *    "data": [
   *        {
   *            "_id": "2hl6nHtY0",
   *            "type": "2",
   *            "activeUser": {
   *               "_id": "zwwdJvLmP",
   *               "userName": "doramart",
   *               "phoneNum": 15220064294,
   *               "category": [],
   *               "group": "0",
   *               "logo": "/upload/images/defaultlogo.png",
   *               "date": "2018-11-13 12:09:29",
   *               "comments": "",
   *               "enable": true,
   *               "id": "zwwdJvLmP",
   *               "content_num": 5,
   *               "watch_num": 1,
   *               "follow_num": 0,
   *               "had_followed": false
   *            },
   *            "passiveUser": {
   *               "_id": "yNYHEw3-e",
   *               "userName": "yoooyu",
   *               "category": [
   *                  "yOgDdV8_b"
   *                ],
   *               "group": "1",
   *               "logo": "/upload/images/defaultlogo.png",
   *               "date": "2018-11-17 09:59:52",
   *               "enable": true,
   *               "id": "yNYHEw3-e"
   *            },
   *              "message": {
   *                "_id": "ClvqfXbjw",
   *                "contentId": {
   *                    "_id": "HBFOrbWYz",
   *                    "title": "2018年，你一定被这十首歌逼疯过",
   *                    "date": "2018-12-25 21:50:57",
   *                    "updateDate": "2019-01-01 14:56:34",
   *                    "id": "HBFOrbWYz"
   *                },
   *                "content": "多重评论再一次",
   *                "date": "2019-01-01 14:56:34",
   *                "id": "ClvqfXbjw"
   *              },
   *            "__v": 0,
   *            "isRead": false,
   *            "date": "2018-11-18 16:11:26",
   *            "id": "2hl6nHtY0"
   *        }
   *    ]
   * }
   * @apiSampleRequest http://localhost:8080/api/siteMessage/getList
   * @apiVersion 1.0.0
   */
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const type = ctx.query.type;
      const queryObj = {};
      const userInfo = ctx.session.user || {};

      if (!_.isEmpty(userInfo)) {
        queryObj.passiveUser = userInfo._id;
      }

      if (type) {
        queryObj.type = type;
      }

      const siteMessageList = await ctx.service.siteMessage.find(payload, {
        query: queryObj,
      });

      ctx.helper.renderSuccess(ctx, {
        data: siteMessageList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  /**
   * @api {get} /api/siteMessage/setHasRead 设置消息为已读
   * @apiDescription 设置消息为已读，包含 赞赏、关注和评论消息；需要登录态
   * @apiName /siteMessage/setHasRead
   * @apiGroup SiteMessage
   * @apiParam {string} ids 消息id,多个id用逗号隔开;传 ids=all 设置所有消息为已读
   * @apiParam {string} type 当ids为all时，传该参数，指定全部设置已读的消息类别
   * @apiParam {string} token 登录时返回的参数鉴权
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *    "status": 200,
   *    "message": "设置已读成功",
   *    "server_time": 1542529985218,
   *    "data": {}
   *}
   * @apiSampleRequest http://localhost:8080/api/siteMessage/setHasRead
   * @apiVersion 1.0.0
   */
  async setMessageHasRead(ctx, app) {
    try {
      let errMsg = '',
        targetIds = ctx.query.ids;
      const messageType = ctx.query.type;
      const queryObj = {};
      // 用户只能操作自己的消息
      const userInfo = ctx.session.user || {};
      if (!_.isEmpty(userInfo)) {
        queryObj.passiveUser = userInfo._id;
      } else {
        throw new Error(ctx.__(ctx.__('validate_error_params')));
      }

      // 设置我所有未读的为已读
      if (targetIds === 'all') {
        if (messageType) {
          queryObj.type = messageType;
        }
        queryObj.isRead = false;
      } else {
        if (!checkCurrentId(targetIds)) {
          errMsg = ctx.__('validate_error_params');
        } else {
          targetIds = targetIds.split(',');
        }
        if (errMsg) {
          throw new Error(errMsg);
        }
        queryObj._id = {
          $in: targetIds,
        };
      }

      await ctx.service.siteMessage.updateMany(
        ctx,
        '',
        {
          isRead: true,
        },
        queryObj
      );

      ctx.helper.renderSuccess(ctx, {
        data: {},
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  /**
   * @api {get} /api/siteMessage/getSiteMessageOutline 获取私信概要
   * @apiDescription 获取私信概要(私信内容，关注、评论未读数量和第一条记录)
   * @apiName /siteMessage/getSiteMessageOutline
   * @apiGroup SiteMessage
   * @apiParam {string} token 登录时返回的参数鉴权
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *  "status": 200,
   *  "message": "getSiteMessageOutline",
   *  "server_time": 1543904194731,
   *  "data": {
   *    "first_privateLetter": {
   *    "_id": "yvOk_g1y71",
   *    "user": "yNYHEw3-e",
   *    "notify": {   // 私信的具体内容
   *        "_id": "5mCBWXS-B",
   *        "title": "这是一条私信，不要偷偷打开哟。。。",
   *        "content": "<p>这是一条私信，不要偷偷打开哟。。。</p>",
   *        "adminSender": "4JiWCMhzg",
   *        "type": "1",
   *        "__v": 0,
   *        "date": "2018-11-18 16:13:47",
   *        "id": "5mCBWXS-B"
   *      },
   *    "__v": 0,
   *    "date": "2018-11-18 16:13:47",
   *    "isRead": false,
   *    "id": "yvOk_g1y71"
   *    },
   *    "private_no_read_num": 1,
   *    "no_read_good_num": 1,
   *    "first_good_message": { // 被点赞的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 给你点赞了"
   *         "_id": "Ogg7mFnjS",
   *         "type": "1",
   *         "activeUser": {
   *             "_id": "zwwdJvLmP",
   *             "userName": "doramart",
   *             "date": "2018-12-04 14:16:34",
   *             "id": "zwwdJvLmP"
   *           },
   *         "passiveUser": "yNYHEw3-e",
   *         "content": "Y1XFYKL52",
   *         "__v": 0,
   *         "isRead": false,
   *         "date": "2018-11-18 16:10:44",
   *         "id": "Ogg7mFnjS"
   *    },
   *    "no_read_follow_num": 1,
   *    "first_follow_message": { // 被关注的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 关注了你"
   *         "_id": "2hl6nHtY0",
   *         "type": "2",
   *         "activeUser": {
   *             "_id": "zwwdJvLmP",
   *             "userName": "doramart",
   *             "date": "2018-12-04 14:16:34",
   *             "id": "zwwdJvLmP"
   *           },
   *         "passiveUser": "yNYHEw3-e",
   *         "__v": 0,
   *         "isRead": false,
   *         "date": "2018-11-18 16:11:26",
   *         "id": "2hl6nHtY0"
   *    },
   *    "no_read_comment_num": 1,
   *    "first_comment_message": { // 评论的第一条消息，客户端可以根据 activeUser 组装消息 "activeUser.userName 给你评论了"
   *         "_id": "iKGCu4EJj",
   *         "type": "3",
   *         "activeUser": {
   *             "_id": "zwwdJvLmP",
   *             "userName": "doramart",
   *             "date": "2018-12-04 14:16:34",
   *             "id": "zwwdJvLmP"
   *           },
   *         "passiveUser": "yNYHEw3-e",
   *         "content": "Y1XFYKL52",
   *         "__v": 0,
   *         "isRead": false,
   *         "date": "2018-11-18 16:11:21",
   *         "id": "iKGCu4EJj"
   *    }
   *  }
   *}
   * @apiSampleRequest http://localhost:8080/api/siteMessage/getSiteMessageOutline
   * @apiVersion 1.0.0
   */
  async getSiteMessageOutline(ctx, app) {
    try {
      const userInfo = ctx.session.user;
      // 获取未读消息数量
      const noReadGoodNum = await ctx.service.siteMessage.count({
        isRead: false,
        type: '4',
        passiveUser: userInfo._id,
      });

      const noReadGoodContent = await ctx.service.siteMessage.find(
        {
          isPaging: '0',
          pageSize: 1,
        },
        {
          query: {
            type: '4',
            passiveUser: userInfo._id,
          },
        }
      );

      const noReadFollowNum = await ctx.service.siteMessage.count({
        isRead: false,
        type: '2',
        passiveUser: userInfo._id,
      });
      const noReadFollowContent = await ctx.service.siteMessage.find(
        {
          isPaging: '0',
          pageSize: 1,
        },
        {
          query: {
            type: '2',
            passiveUser: userInfo._id,
          },
        }
      );

      const noReadCommentNum = await ctx.service.siteMessage.count({
        isRead: false,
        type: '3',
        passiveUser: userInfo._id,
      });
      const noReadCommentContent = await ctx.service.siteMessage.find(
        {
          isPaging: '0',
          pageSize: 1,
        },
        {
          query: {
            type: '3',
            passiveUser: userInfo._id,
          },
        }
      );

      const userNotify_num = await ctx.service.systemNotify.count({
        isRead: false,
        user: userInfo._id,
      });

      const userNotifyContent = await ctx.service.systemNotify.find(
        {},
        {
          query: {
            isRead: false,
            user: userInfo._id,
          },
          populate: ['notify'],
        }
      );

      const renderData = {
        first_privateLetter: userNotifyContent[0] || {},
        private_no_read_num: userNotify_num,
        no_read_good_num: noReadGoodNum,
        first_good_message: noReadGoodContent[0] || {},
        no_read_follow_num: noReadFollowNum,
        first_follow_message: noReadFollowContent[0] || {},
        no_read_comment_num: noReadCommentNum,
        first_comment_message: noReadCommentContent[0] || {},
      };

      ctx.helper.renderSuccess(ctx, {
        data: renderData,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = SiteMessageController;
