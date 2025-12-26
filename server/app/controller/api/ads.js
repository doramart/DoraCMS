/*
 * @Author: doramart
 * @Date: 2019-09-26 09:19:25
 * @Last Modified by: doramart
 * @Last Modified time: 2025-07-26 21:51:21
 */
'use strict';
// const _ = require('lodash');

const AdsController = {
  /**
   * 🔥 优化版：获取广告
   * @param ctx
   * @description 支持 RESTful 路由：GET /api/v1/ads/:id
   */
  async getOne(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容查询参数 name
    const id = ctx.params.id || ctx.query.name;

    // 🔥 标准化查询条件
    const filters = {
      name: { $eq: id },
      state: { $eq: true },
    };

    // 🔥 标准化查询选项
    const options = {
      filters,
      populate: [
        {
          path: 'items',
          select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
        },
      ],
    };

    const targetItem = await ctx.service.ads.findOne(filters, options);

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },
};

module.exports = AdsController;
