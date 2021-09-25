'use strict';
const xss = require('xss');
const _ = require('lodash');

const announceRule = (ctx) => {
  return {
    title: {
      type: 'string',
      required: true,
      min: 5,
      max: 100,
      message: ctx.__('validate_error_field', [ctx.__('label_notify_title')]),
    },
    content: {
      type: 'string',
      required: true,
      min: 5,
      max: 500,
      message: ctx.__('validate_inputCorrect', [
        ctx.__('label_notify_content'),
      ]),
    },
  };
};

const AnnounceController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;

      const notifyList = await ctx.service.announce.find(payload, {
        query: {
          type: '1',
        },
        populate: [
          {
            path: 'adminSender',
            select: 'userName -_id',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: notifyList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async create(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        title: fields.title,
        content: fields.content,
        adminSender: ctx.session.adminUserInfo._id,
        type: '1',
      };

      ctx.validate(announceRule(ctx), formObj);

      const announceObj = await ctx.service.announce.create(formObj);
      // 发送公告给用户
      const regUsers = await ctx.service.user.find(
        {
          isPaging: '0',
        },
        {
          query: {
            state: '1',
          },
        }
      );
      if (regUsers.length > 0 && !_.isEmpty(ctx.service.systemNotify)) {
        for (let i = 0; i < regUsers.length; i++) {
          await ctx.service.systemNotify.create({
            user: regUsers[i]._id,
            notify: announceObj._id,
          });
        }
      }

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.announce.item(ctx, {
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
      await ctx.service.announce.removes(ctx, targetIds);
      if (!_.isEmpty(ctx.service.systemNotify)) {
        await ctx.service.systemNotify.removes(ctx, targetIds, 'notify');
      }
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = AnnounceController;
