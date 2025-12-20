/*
 * @Author: doramart
 * @Date: 2019-09-26 09:19:25
 * @Last Modified by: doramart
 * @Last Modified time: 2025-07-26 21:51:21
 */
'use strict';
// const _ = require('lodash');

const AdsController = {
  async getOne(ctx) {
    const name = ctx.query.name;

    // 🔥 标准化查询条件
    const filters = {
      name: { $eq: name },
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
