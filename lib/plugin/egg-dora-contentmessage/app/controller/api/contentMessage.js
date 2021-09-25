'use strict';
const xss = require('xss');
const _ = require('lodash');
const shortid = require('shortid');
const { siteFunc } = require('../../utils');

const ContentMessageController = {
  renderMessage(ctx, userInfo = {}, messages = []) {
    return new Promise(async (resolve, reject) => {
      try {
        const newMessageArr = JSON.parse(JSON.stringify(messages));
        for (const messageItem of newMessageArr) {
          let had_comment = false;
          let had_despises = false;
          let had_praise = false;
          if (!_.isEmpty(userInfo)) {
            // 是否回复过
            const myReplyRecord = await ctx.service.message.find(
              {
                isPaging: '0',
              },
              {
                query: {
                  author: userInfo._id,
                  relationMsgId: messageItem._id,
                },
              }
            );
            if (myReplyRecord.length > 0) {
              had_comment = true;
            }
            // 是否踩过
            if (userInfo.despiseMessage.indexOf(messageItem._id) >= 0) {
              had_despises = true;
            }
            // 是否赞过
            if (userInfo.praiseMessages.indexOf(messageItem._id) >= 0) {
              had_praise = true;
            }
          }
          const praise_num = await ctx.service.user.count({
            praiseMessages: messageItem._id,
          });
          const despises_num = await ctx.service.user.count({
            despiseMessage: messageItem._id,
          });
          messageItem.praise_num = praise_num;
          messageItem.despises_num = despises_num;
          messageItem.had_comment = had_comment;
          messageItem.had_despises = had_despises;
          messageItem.had_praise = had_praise;

          const parentId = messageItem._id;
          const childMessages = await ctx.service.message.find(
            {
              pageSize: 5,
              isPaging: '0',
            },
            {
              query: {
                relationMsgId: parentId,
              },
            }
          );
          if (!_.isEmpty(childMessages)) {
            messageItem.childMessages = childMessages;
          } else {
            messageItem.childMessages = [];
          }
          messageItem.comment_num = await ctx.service.message.count({
            relationMsgId: parentId,
          });
        }

        resolve(newMessageArr);
      } catch (error) {
        resolve(messages);
      }
    });
  },

  /**
   * @api {get} /api/contentMessage/getMessages 获取评论列表
   * @apiDescription 获取评论列表 带分页
   * @apiName /contentMessage/getMessages
   * @apiGroup ContentMessage
   * @apiParam {string} current 当前页码
   * @apiParam {string} pageSize 每页记录数
   * @apiParam {string} userId 获取指定用户的评论,传用户id
   * @apiParam {string} contentId 获取指定文章的评论,传文档id
   * @apiParam {string} token 登录时返回的参数鉴权
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *  "status": 200,
   *  "message": "操作成功 message",
   *  "server_time": 1542899024811,
   *  "data": [
   *    {
   *  "_id": "tYVGV-HTL",
   *  "author": {
   *     "_id": "zwwdJvLmP",
   *     "userName": "doramart",
   *     "logo": "/upload/images/defaultlogo.png",
   *     "date": "2018-11-13 12:09:29",
   *     "enable": true,
   *     "id": "zwwdJvLmP"
   *   },
   *  "contentId": {
   *  "_id": "R8_iIMwF1",
   *  "title": "海底捞的致命缺点是什么？",
   *  "stitle": "海底捞的致命缺点是什么？",
   *  "updateDate": "2018-11-22",
   *  "date": "2018-11-22 23:03:44",
   *  "id": "R8_iIMwF1"
   *      },
   *  "__v": 0,
   *  "content": "这也是一条留言",
   *  "hasPraise": false,
   *  "praiseNum": 0,
   *  "date": "3 天前",
   *  "utype": "0",
   *  "id": "tYVGV-HTL"
   *    },
   *    {
   *  "_id": "4wv0tcLjH",
   *  "author": {
   *  "_id": "zwwdJvLmP",
   *  "userName": "doramart",
   *  "logo": "/upload/images/defaultlogo.png",
   *  "date": "2018-11-13 12:09:29",
   *  "enable": true,
   *  "id": "zwwdJvLmP"
   *      },
   *  "contentId": {
   *  "_id": "vGVoKV0g_",
   *  "title": "有哪一刹那让你对日本的美好印象瞬间破灭？",
   *  "stitle": "有哪一刹那让你对日本的美好印象瞬间破灭？",
   *  "updateDate": "2018-11-22",
   *  "date": "2018-11-22 23:03:44",
   *  "id": "vGVoKV0g_"
   *      },
   *  "__v": 0,
   *  "content": "这是一条留言",
   *  "hasPraise": false,
   *  "praiseNum": 0,
   *  "date": "3 天前",
   *  "utype": "0",
   *  "id": "4wv0tcLjH"
   *    }
   *  ]
   *}
   * @apiSampleRequest http://localhost:8080/api/contentMessage/getMessages
   * @apiVersion 1.0.0
   */
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const userId = ctx.query.userId;
      const contentId = ctx.query.contentId;
      let userInfo = ctx.session.user || {};
      const queryObj = {};

      if (userId) {
        queryObj.author = userId;
      }

      if (contentId) {
        queryObj.contentId = contentId;
      }

      const messageList = await ctx.service.message.find(payload, {
        query: queryObj,
      });

      if (!_.isEmpty(userInfo)) {
        userInfo = await ctx.service.user.item(ctx, {
          query: {
            _id: userInfo._id,
          },
        });
      }

      messageList.docs = await this.renderMessage(
        ctx,
        userInfo,
        messageList.docs
      );

      ctx.helper.renderSuccess(ctx, {
        data: messageList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  /**
   * @api {post} /api/contentMessage/postMessages 帖子评论/留言
   * @apiDescription 帖子评论/留言，需要登录态
   * @apiName /contentMessage/postMessages
   * @apiGroup ContentMessage
   * @apiParam {string} token 登录时返回的参数鉴权
   * @apiParam {string} contentId 帖子ID
   * @apiParam {string} replyAuthor 回复者ID (二级留言必填)
   * @apiParam {string} relationMsgId 回复目标留言ID (二级留言必填)
   * @apiParam {string} content 评论内容
   * @apiSuccess {json} result
   * @apiSuccessExample {json} Success-Response:
   *{
   *    "status": 200,
   *    "message": "操作成功！",
   *    "server_time": 1543372263586,
   *    "data": {}
   *}
   * @apiSampleRequest http://localhost:8080/api/contentMessage/postMessages
   * @apiVersion 1.0.0
   */
  async postMessages(ctx, app) {
    try {
      const fields = ctx.request.body;

      let errMsg = '';
      if (_.isEmpty(ctx.session.user) && _.isEmpty(ctx.session.adminUserInfo)) {
        errMsg = ctx.__('validate_error_params');
      }
      if (!shortid.isValid(fields.contentId)) {
        errMsg = ctx.__('validate_message_add_err');
      }
      if (
        fields.content &&
        (fields.content.length < 5 || fields.content.length > 200)
      ) {
        errMsg = ctx.__('validate_rangelength', [
          ctx.__('label_messages_content'),
          5,
          200,
        ]);
      }
      if (!fields.content) {
        errMsg = ctx.__('validate_inputNull', [
          ctx.__('label_messages_content'),
        ]);
      }
      if (errMsg) {
        throw new Error(errMsg);
      }

      const messageObj = {
        contentId: fields.contentId,
        content: xss(fields.content),
        replyAuthor: fields.replyAuthor,
        adminReplyAuthor: fields.adminReplyAuthor,
        author: ctx.session.user._id,
        relationMsgId: fields.relationMsgId,
        utype: fields.utype || '0',
      };

      const targetMessage = await ctx.service.message.create(messageObj);

      // 给被回复用户发送提醒邮件
      const contentInfo = await ctx.service.content.item(ctx, {
        query: {
          _id: fields.contentId,
        },
      });

      let replyAuthor;

      if (fields.replyAuthor) {
        replyAuthor = await ctx.service.user.item(ctx, {
          query: {
            _id: fields.replyAuthor,
          },
          files: 'id userName category group logo date enable state email',
        });
      } else if (fields.adminReplyAuthor) {
        replyAuthor = await ctx.service.adminUser.item(ctx, {
          query: {
            _id: fields.adminReplyAuthor,
          },
          files: 'id userName email',
        });
      }

      if (!_.isEmpty(replyAuthor)) {
        await ctx.helper.reqJsonData(
          'mailTemplate/sendEmail',
          {
            tempkey: '6',
            info: {
              replyAuthor,
              content: contentInfo,
              author: ctx.session.user,
            },
          },
          'post'
        );
      }

      //   管理员消息提醒
      ctx.helper.sendMessageToClient(
        ctx,
        'contentmessage',
        `用户 ${ctx.session.user.userName} 在文章 <a href="/details/${contentInfo.id}.html" target="_blank">${contentInfo.title}</a> 中发表了评论`
      );

      // 发送消息给客户端
      const passiveUser = fields.replyAuthor
        ? fields.replyAuthor
        : contentInfo.uAuthor;
      siteFunc.addSiteMessage(
        '3',
        ctx.session.user,
        passiveUser,
        targetMessage._id,
        {
          targetMediaType: '1',
        }
      );

      const returnMessage = await ctx.service.message.item(ctx, {
        query: {
          _id: targetMessage._id,
        },
      });

      ctx.helper.renderSuccess(ctx, {
        data: returnMessage,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = ContentMessageController;
