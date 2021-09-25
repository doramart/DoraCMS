'use strict';
const xss = require('xss');
const _ = require('lodash');

const SiteMessageController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const siteMessageList = await ctx.service.siteMessage.find(payload, {
        populate: [
          {
            path: 'activeUser',
            select: getAuthUserFields('base'),
          },
          {
            path: 'passiveUser',
            select: getAuthUserFields(),
          },
          {
            path: 'content',
            select: 'title _id',
          },
          {
            path: 'message',
            select: 'content _id contentId',
            populate: {
              path: 'contentId',
              select: 'title _id date',
            },
          },
        ],
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

  async getOne(ctx, app) {
    try {
      const _id = ctx.query.id;

      const targetUser = await ctx.service.siteMessage.item(ctx, {
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
      await ctx.service.siteMessage.removes(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = SiteMessageController;
