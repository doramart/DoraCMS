'use strict';
const _ = require('lodash');
const { siteFunc } = require('../../utils');

const mailTemplateRule = (ctx) => {
  return {
    comment: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('备注')]),
    },

    title: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('标题')]),
    },

    // subTitle: {
    //     type: "string",
    //     required: true,
    //     message: ctx.__("validate_error_field", [ctx.__("概要")])
    // },

    content: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('内容')]),
    },

    type: {
      type: 'string',
      required: true,
      message: ctx.__('validate_error_field', [ctx.__('类型')]),
    },
  };
};

const MailTemplateController = {
  async list(ctx) {
    try {
      const payload = ctx.query;
      const queryObj = {};

      const mailTemplateList = await ctx.service.mailTemplate.find(payload, {
        query: queryObj,
        searchKeys: ['comment', 'title', 'subTitle'],
      });

      ctx.helper.renderSuccess(ctx, {
        data: mailTemplateList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async typelist(ctx) {
    try {
      const typeList = siteFunc.emailTypeKey();
      ctx.helper.renderSuccess(ctx, {
        data: typeList,
      });
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async create(ctx) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        comment: fields.comment,
        title: fields.title,
        subTitle: fields.subTitle,
        content: fields.content,
        type: fields.type,
        createTime: new Date(),
      };

      ctx.validate(mailTemplateRule(ctx), formObj);

      await ctx.service.mailTemplate.create(formObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async getOne(ctx) {
    try {
      const _id = ctx.query.id;

      const targetItem = await ctx.service.mailTemplate.item(ctx, {
        query: {
          _id,
        },
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

  async update(ctx) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        comment: fields.comment,
        title: fields.title,
        subTitle: fields.subTitle,
        content: fields.content,
        type: fields.type,
        updateTime: new Date(),
      };

      ctx.validate(mailTemplateRule(ctx), formObj);

      await ctx.service.mailTemplate.update(ctx, fields._id, formObj);

      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },

  async removes(ctx) {
    try {
      const targetIds = ctx.query.ids;
      await ctx.service.mailTemplate.removes(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = MailTemplateController;
