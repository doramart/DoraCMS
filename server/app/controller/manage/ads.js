'use strict';
// const xss = require('xss');
// const _ = require('lodash');
const { adsRule } = require('../../validate');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const AdsController = {
  async list(ctx) {
    const payload = ctx.query;

    // 🔥 标准化查询参数格式
    const filters = {};

    // 动态构建filters对象
    if (payload.state !== undefined) {
      filters.state = { $eq: payload.state === 'true' };
    }

    if (payload.type) {
      filters.type = { $eq: payload.type };
    }

    if (payload.name) {
      filters.name = { $regex: payload.name, $options: 'i' };
    }

    // 🔥 标准化查询选项
    const options = {
      filters,
      fields: ['id', 'name', 'type', 'state', 'height', 'carousel', 'comments', 'createdAt', 'items'],
      sort: [{ field: 'createdAt', order: 'desc' }],
      populate: [
        {
          path: 'items',
          select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target'],
        },
      ],
    };

    const adsList = await ctx.service.ads.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: adsList,
    });
  },

  async create(ctx) {
    const fields = ctx.request.body || {};
    const formObj = {
      name: fields.name,
      state: fields.state,
      height: fields.height,
      carousel: fields.carousel,
      type: fields.type,
      comments: fields.comments,
    };

    ctx.validate(adsRule.form(ctx), formObj);

    // 🔥 优化：先创建广告单元，再创建广告（带事务逻辑在Repository层处理）
    const itemIdArr = [];
    const adsItems = fields.items || [];

    if (adsItems.length > 0) {
      for (let i = 0; i < adsItems.length; i++) {
        // 业务验证在Service层自动处理
        const newItem = await ctx.service.adsItem.create(adsItems[i]);
        itemIdArr.push(newItem.id);
      }
    }

    formObj.items = itemIdArr;

    // 🔥 业务验证（唯一性检查、类型验证等）在Service层自动处理
    await ctx.service.ads.create(formObj);

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 获取单个广告信息 - 支持 RESTful 路由
   * GET /api/manage/ads/:id 或 GET /api/manage/ads/getOne?id=xxx
   * @param ctx
   */
  async getOne(ctx) {
    const id = ctx.params.id || ctx.query.id;

    // 🔥 标准化查询选项
    const options = {
      populate: [
        {
          path: 'items',
          select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
        },
      ],
    };

    const targetItem = await ctx.service.ads.findById(id, options);

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },

  /**
   * 更新广告信息 - 支持 RESTful 路由
   * PUT /api/manage/ads/:id 或 PUT /api/manage/ads/update
   * @param ctx
   */
  async update(ctx) {
    const fields = ctx.request.body || {};
    const formObj = {
      name: fields.name,
      state: fields.state,
      height: fields.height,
      carousel: fields.carousel,
      type: fields.type,
      comments: fields.comments,
    };

    ctx.validate(adsRule.form(ctx), formObj);

    // 🔥 优化：处理广告单元的创建和更新
    const itemIdArr = [];
    const adsItems = fields.items || [];

    if (adsItems.length > 0) {
      for (let i = 0; i < adsItems.length; i++) {
        const targetItem = adsItems[i];
        let currentId = '';

        if (targetItem.id) {
          // 更新现有广告单元
          currentId = targetItem.id;
          // 业务验证在Service层自动处理
          await ctx.service.adsItem.update(targetItem.id, targetItem);
        } else {
          // 创建新的广告单元
          // 业务验证在Service层自动处理
          const newItem = await ctx.service.adsItem.create(targetItem);
          currentId = newItem.id;
        }
        itemIdArr.push(currentId);
      }
    }

    formObj.items = itemIdArr;

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || fields.id;
    fields.id = id;

    // 🔥 业务验证（唯一性检查、类型验证等）在Service层自动处理
    await ctx.service.ads.update(id, formObj);

    ctx.helper.renderSuccess(ctx);
  },

  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('ads.fields.name'),
    });

    // 🔥 优化：先删除关联的广告单元，再删除广告
    for (let i = 0; i < idsArray.length; i++) {
      const currentId = idsArray[i];

      // 获取广告信息
      const targetAd = await ctx.service.ads.findById(currentId);

      if (targetAd && targetAd.items && targetAd.items.length > 0) {
        // 删除关联的广告单元
        await ctx.service.adsItem.remove(targetAd.items?.map(item => item.id));
      }
    }

    // 🔥 业务验证（检查是否可以删除等）在Service层自动处理
    await ctx.service.ads.remove(idsArray);

    ctx.helper.renderSuccess(ctx);
  },
};

module.exports = AdsController;
