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

  async getOne(ctx) {
    // 🔥 统一异常处理版本 - 移除try-catch
    const { id } = ctx.query;

    // 🔥 使用语义化异常验证
    if (!id) {
      throw RepositoryExceptions.contentCategory.notFound(id);
    }

    const targetItem = await ctx.service.contentCategory.findById(id);

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },

  // 根据类别id或者文档id查询子类
  async getCurrentCategoriesById(ctx) {
    // 🔥 优化：直接调用Service方法，避免重复代码
    const { contentId, typeId } = ctx.query;

    const result = await ctx.service.contentCategory.getCurrentCategoriesById(typeId, contentId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },
};

module.exports = ContentCategoryController;
