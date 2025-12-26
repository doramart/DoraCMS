'use strict';
const _ = require('lodash');
const fs = require('fs');
const { contentCategory } = require('../../utils');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

const ContentCategoryController = {
  async list(ctx) {
    // 🔥 统一异常处理版本 - 移除重复try-catch
    const payload = ctx.query;

    // 🔥 标准化参数格式
    const options = {
      filters: {
        enable: { $eq: true }, // 使用操作符格式
      },
      populate: [{ path: 'contentTemp', select: ['name', 'alias', 'forder'] }],
    };

    const contentCategoryList = await ctx.service.contentCategory.find(
      {
        isPaging: '0',
        flat: true, // 平铺格式，不需要树形结构
      },
      options
    );

    // let removeArr = [];

    // for (const item of contentCategoryList) {
    //   item.url = `/${item.defaultUrl}___${item.id}`;
    //   const cateContentsNum = await ctx.helper.reqJsonData(
    //     `content/getContentCountsByCateId?typeId=${item.id}`
    //   );
    //   if (!_.isEmpty(cateContentsNum) && !_.isEmpty(cateContentsNum[0])) {
    //     item.postCount = cateContentsNum[0].total_sum;
    //   }
    //   if (!_.isEmpty(item.contentTemp)) {
    //     if (item.parentId !== '0' && item.contentTemp.forder) {
    //       const currentPath = `${process.cwd()}/app/view/${
    //         defaultTemp.alias
    //       }/${item.contentTemp.forder}`;
    //       // console.log('--currentPath--', currentPath)
    //       if (!fs.existsSync(currentPath)) {
    //         removeArr.push(item.id);
    //         removeArr.push(item.parentId);
    //       }
    //     }
    //   } else {
    //     removeArr.push(item.id);
    //   }
    // }

    // removeArr = _.uniq(removeArr);

    // _.remove(contentCategoryList, function (cate) {
    //   return removeArr.indexOf(cate.id) >= 0;
    // });

    ctx.helper.renderSuccess(ctx, {
      data: contentCategoryList,
    });
  },

  async treelist(ctx) {
    try {
      // 🚀 使用TemplateService的优化缓存方法
      const contentCategoryTree = await ctx.service.templateService.fetchContent('categoryTree', {
        enable: true,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: contentCategoryTree,
      });
    } catch (error) {
      ctx.logger.error('Get category tree error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取单个分类
   * @param ctx
   * @description 支持 RESTful 路由：GET /api/v1/categories/:id
   */
  async getOne(ctx) {
    // 🔥 统一异常处理版本 - 移除try-catch
    // 🔥 RESTful: 优先使用路径参数，也兼容查询参数
    const { id } = ctx.params.id ? { id: ctx.params.id } : ctx.query;

    // 🔥 使用语义化异常验证
    if (!id) {
      throw RepositoryExceptions.contentCategory.notFound(id);
    }

    const targetItem = await ctx.service.contentCategory.findById(id);

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },

  /**
   * 🔥 优化版：根据类别id获取祖先分类
   * @param ctx
   * @description 支持 RESTful 路由：GET /api/v1/categories/:id/ancestors
   */
  async getCurrentCategoriesById(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id
    const typeId = ctx.params.id || ctx.query.typeId;
    const contentId = ctx.query.contentId;

    const result = await ctx.service.contentCategory.getCurrentCategoriesById(typeId, contentId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },
};

module.exports = ContentCategoryController;
