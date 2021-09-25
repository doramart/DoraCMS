'use strict';
const xss = require('xss');
const _ = require('lodash');

const systemNotifyRule = (ctx) => {
  return {
    name: {
      type: 'string',
      required: true,
      min: 1,
      max: 12,
      message: ctx.__('validate_error_field', [ctx.__('label_tag_name')]),
    },
    comments: {
      type: 'string',
      required: true,
      min: 2,
      max: 30,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_comments')]),
    },
  };
};

const SystemNotifyController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const userNotifyList = await ctx.service.systemNotify.find(payload, {
        query: {
          systemUser: ctx.session.adminUserInfo._id,
        },
        populate: [
          {
            path: 'notify',
            select: 'title content _id',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: userNotifyList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.systemNotify.item(ctx, {
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

  async removes(ctx, app) {
    try {
      const targetIds = ctx.query.ids;
      if (!checkCurrentId(targetIds)) {
        throw new Error(ctx.__('validate_error_params'));
      } else {
        const ids = targetIds.split(',');
        // 删除消息记录
        for (let i = 0; i < ids.length; i++) {
          const userNotifyId = ids[i];
          const userNotifyObj = await ctx.service.systemNotify.item(ctx, {
            query: {
              _id: userNotifyId,
            },
          });
          if (!_.isEmpty(userNotifyObj)) {
            await ctx.service.notify.removes(ctx, userNotifyObj.notify);
          }
        }
      }

      await ctx.service.systemNotify.removes(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async setMessageHasRead(ctx, app) {
    try {
      let targetIds = ctx.query.ids;

      if (!checkCurrentId(targetIds)) {
        throw new Error(ctx.__('validate_error_params'));
      } else {
        targetIds = targetIds.split(',');
      }

      await ctx.service.systemNotify.updateMany(
        ctx,
        targetIds,
        {
          isRead: true,
        },
        {
          query: {
            systemUser: ctx.session.adminUserInfo._id,
          },
        }
      );

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = SystemNotifyController;
