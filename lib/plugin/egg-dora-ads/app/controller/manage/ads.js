'use strict';
const xss = require('xss');
const _ = require('lodash');

const adsRule = (ctx) => {
  return {
    name: {
      type: 'string',
      required: true,
      min: 2,
      max: 15,
      message: ctx.__('validate_error_field', [ctx.__('label_ads_name')]),
    },
    comments: {
      type: 'string',
      required: true,
      min: 5,
      max: 30,
      message: ctx.__('validate_inputCorrect', [ctx.__('label_comments')]),
    },
  };
};

const AdsController = {
  async list(ctx, app) {
    try {
      const payload = ctx.query;
      const adsList = await ctx.service.ads.find(payload, {
        populate: [
          {
            path: 'items',
          },
        ],
      });

      ctx.helper.renderSuccess(ctx, {
        data: adsList,
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
        name: fields.name,
        state: fields.state,
        height: fields.height,
        carousel: fields.carousel,
        type: fields.type,
        comments: fields.comments,
      };

      ctx.validate(adsRule(ctx), formObj);

      const itemIdArr = [],
        adsItems = fields.items;
      if (adsItems.length > 0) {
        for (let i = 0; i < adsItems.length; i++) {
          const newItem = await ctx.service.adsItem.create(adsItems[i]);
          itemIdArr.push(newItem._id);
        }
      }
      formObj.items = itemIdArr;
      await ctx.service.ads.create(formObj);

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

      const targetItem = await ctx.service.ads.item(ctx, {
        query: {
          _id,
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

  async update(ctx, app) {
    try {
      const fields = ctx.request.body || {};
      const formObj = {
        name: fields.name,
        state: fields.state,
        height: fields.height,
        carousel: fields.carousel,
        type: fields.type,
        comments: fields.comments,
      };

      ctx.validate(adsRule(ctx), formObj);

      const itemIdArr = [],
        adsItems = fields.items;
      if (adsItems.length > 0) {
        for (let i = 0; i < adsItems.length; i++) {
          let targetItem = adsItems[i],
            currentId = '';
          if (targetItem._id) {
            currentId = targetItem._id;
            await ctx.service.adsItem.update(ctx, targetItem._id, targetItem);
          } else {
            const newItem = await ctx.service.adsItem.create(targetItem);
            currentId = newItem._id;
          }
          itemIdArr.push(currentId);
        }
      }
      formObj.items = itemIdArr;

      await ctx.service.ads.update(ctx, fields._id, formObj);

      ctx.helper.renderSuccess(ctx);
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

        for (let i = 0; i < ids.length; i++) {
          const currentId = ids[i];

          const targetAd = await ctx.service.ads.item(ctx, {
            query: {
              _id: currentId,
            },
          });
          if (!_.isEmpty(targetAd)) {
            await ctx.service.adsItem.removes(ctx, targetAd.items.join(','));
          }
        }
      }

      await ctx.service.ads.removes(ctx, targetIds);
      ctx.helper.renderSuccess(ctx);
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err,
      });
    }
  },
};

module.exports = AdsController;
