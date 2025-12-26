'use strict';
// const xss = require('xss');
const _ = require('lodash');
const { contentCategoryRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const ContentCategoryController = {
  async list(ctx) {
    // 🔥 统一异常处理版本 - 移除重复try-catch
    const payload = ctx.query;

    // 🔥 标准化参数格式
    const categoryParams = {
      // ...payload,
      // flat: true,
      isPaging: '0',
      pageSize: 1000,
      lean: '1',
    };

    const options = {
      searchKeys: ['name', 'keywords', 'defaultUrl'],
      filters: {}, // 空过滤器，允许搜索所有分类
    };

    const contentCategoryList = await ctx.service.contentCategory.find(categoryParams, options);

    ctx.helper.renderSuccess(ctx, {
      data: contentCategoryList,
    });
  },

  async create(ctx) {
    // 🔥 统一异常处理版本 - 移除重复try-catch
    const fields = ctx.request.body || {};

    // 🔥 数据预处理
    const formObj = {
      name: fields.name,
      keywords: fields.keywords,
      sortId: fields.sortId,
      parentId: fields.parentId,
      enable: fields.enable,
      defaultUrl: fields.defaultUrl,
      contentTemp: fields.contentTemp,
      comments: fields.comments,
      sImg: fields.sImg,
      type: fields.type,
      icon: fields.icon,
    };

    // 兼容中文逗号
    if (fields.keywords) {
      const reg = new RegExp('，', 'g');
      formObj.keywords = fields.keywords.replace(reg, ',');
    }

    // 针对子类自动继承父类的模板
    if (Number(fields.parentId) !== 0) {
      const parentCate = await ctx.service.contentCategory.findById(fields.parentId);
      if (!_.isEmpty(parentCate)) {
        formObj.contentTemp = parentCate.contentTemp;
      }
    }

    // 🔥 数据验证
    ctx.validate(contentCategoryRule.form(ctx), formObj);

    // 🔥 Repository会自动进行业务验证并抛出语义化异常
    const cateObj = await ctx.service.contentCategory.create(formObj);

    ctx.helper.renderSuccess(ctx, { data: cateObj });
  },

  /**
   * 🔥 优化版：获取单个分类
   * @param ctx
   * @description 支持 RESTful 路由：GET /manage/v1/categories/:id
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

  async alllist(ctx) {
    // 🔥 标准化返回格式
    const result = await ctx.service.contentCategory.find({
      isPaging: '0',
    });

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 优化版：更新分类
   * @param ctx
   * @description 支持 RESTful 路由：PUT /manage/v1/categories/:id
   */
  async update(ctx) {
    // 🔥 统一异常处理版本 - 移除try-catch
    const fields = ctx.request.body || {};

    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 id
    const categoryId = ctx.params.id || fields.id;
    fields.id = categoryId; // 确保 fields 中有 id

    const formObj = {
      name: fields.name,
      keywords: fields.keywords,
      sortId: fields.sortId,
      parentId: fields.parentId,
      enable: fields.enable,
      defaultUrl: fields.defaultUrl,
      contentTemp: fields.contentTemp,
      sortPath: fields.sortPath,
      comments: fields.comments,
      sImg: fields.sImg,
      type: fields.type,
      icon: fields.icon,
    };

    // 🔥 数据验证
    ctx.validate(contentCategoryRule.form(ctx), formObj);

    // 🔥 Repository会自动进行业务验证并抛出语义化异常
    const result = await ctx.service.contentCategory.update(categoryId, formObj);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  async removes(ctx) {
    // 🔥 统一异常处理版本 - 移除try-catch
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('contentCategory.fields.name'),
    });

    // 🔥 Repository会自动检查关联内容并抛出语义化异常
    const result = await ctx.service.contentCategory.removes(idsArray);

    ctx.helper.renderSuccess(ctx, { data: result });
  },
};

module.exports = ContentCategoryController;
