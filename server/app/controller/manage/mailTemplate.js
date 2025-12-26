/**
 * MailTemplate 管理后台 Controller
 * 基于最新的三层架构和统一异常处理规范 (2024)
 * 🔥 移除重复try-catch，使用统一异常处理中间件
 * 🎯 标准化参数格式，使用操作符和数组格式
 * ✅ 集成业务验证和语义化异常
 */
'use strict';

const Controller = require('egg').Controller;
const { mailTemplateRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

class MailTemplateController extends Controller {
  /**
   * 获取邮件模板列表
   */
  async list() {
    const { ctx, service } = this;

    const payload = ctx.query;

    // 🔥 构建标准化查询条件（使用操作符格式）
    const filters = {};

    // 精确匹配
    if (payload.type) {
      filters.type = { $eq: payload.type };
    }

    // 模糊搜索
    if (payload.title) {
      filters.title = { $regex: payload.title, $options: 'i' };
    }

    if (payload.comment) {
      filters.comment = { $regex: payload.comment, $options: 'i' };
    }

    // 🔥 构建标准化查询选项
    const options = {
      filters,
      fields: ['id', 'title', 'subTitle', 'type', 'comment', 'createdAt', 'updatedAt'], // 使用数组格式
      searchKeys: ['title', 'subTitle', 'comment'], // 搜索字段
      sort: [
        { field: 'createdAt', order: 'desc' },
        { field: 'title', order: 'asc' },
      ], // 使用对象数组格式
    };

    const result = await service.mailTemplate.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 获取邮件模板类型列表
   */
  async typelist() {
    const { ctx, service } = this;

    // 🔥 使用Repository提供的统计方法，而不是工具函数
    const typeList = await service.mailTemplate.getTemplateTypes();

    ctx.helper.renderSuccess(ctx, {
      data: typeList,
    });
  }

  /**
   * 创建邮件模板
   */
  async create() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(mailTemplateRule.form(ctx));

    const fields = ctx.request.body || {};

    // 🔥 业务验证 - 检查标题唯一性（Repository会自动抛出异常）
    if (fields.title) {
      await service.mailTemplate.checkTitleUnique(fields.title);
    }

    // 🔥 构建创建数据（移除手动时间设置，由Repository处理）
    const createData = {
      title: fields.title,
      subTitle: fields.subTitle,
      content: fields.content,
      type: fields.type,
      comment: fields.comment,
    };

    const result = await service.mailTemplate.create(createData);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 获取单个邮件模板 - 支持 RESTful 路由
   * GET /api/manage/mailTemplate/:id 或 GET /api/manage/mailTemplate/getOne?id=xxx
   */
  async getOne() {
    const { ctx, service } = this;

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || ctx.query.id;

    if (!id) {
      throw RepositoryExceptions.mailTemplate.notFound(id);
    }

    // 🔥 使用标准化的findById方法
    const result = await service.mailTemplate.findById(id);

    if (!result) {
      throw RepositoryExceptions.mailTemplate.notFound(id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 更新邮件模板 - 支持 RESTful 路由
   * PUT /api/manage/mailTemplate/:id 或 PUT /api/manage/mailTemplate/update
   */
  async update() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(mailTemplateRule.form(ctx));

    const fields = ctx.request.body || {};

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || fields.id;
    fields.id = id;

    if (!id) {
      throw RepositoryExceptions.mailTemplate.notFound(id);
    }

    // 🔥 业务验证 - 检查标题唯一性（排除当前记录）
    if (fields.title) {
      await service.mailTemplate.checkTitleUnique(fields.title, id);
    }

    // 🔥 构建更新数据（移除手动时间设置，由Repository处理）
    const updateData = {
      title: fields.title,
      subTitle: fields.subTitle,
      content: fields.content,
      type: fields.type,
      comment: fields.comment,
    };

    const result = await service.mailTemplate.update(id, updateData);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 删除邮件模板
   */
  async removes() {
    const { ctx, service } = this;

    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('mailTemplate.fields.title'),
    });

    const result = await service.mailTemplate.remove(idsArray);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：批量更新模板类型
   */
  async batchUpdateType() {
    const { ctx, service } = this;

    const { ids, type } = ctx.request.body;

    if (!ids || !type) {
      throw RepositoryExceptions.business.operationNotAllowed('参数不完整');
    }

    const targetIds = Array.isArray(ids) ? ids : ids.split(',');

    const result = await service.mailTemplate.batchUpdateType(targetIds, type);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：复制模板
   */
  async duplicate() {
    const { ctx, service } = this;

    const { id, title } = ctx.request.body;

    if (!id) {
      throw RepositoryExceptions.mailTemplate.notFound(id);
    }

    // 构建覆盖数据
    const overrideData = {};
    if (title) {
      overrideData.title = title;
      // 检查新标题的唯一性
      await service.mailTemplate.checkTitleUnique(title);
    }

    const result = await service.mailTemplate.duplicateTemplate(id, overrideData);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：搜索模板内容
   */
  async search() {
    const { ctx, service } = this;

    const payload = ctx.query;
    const { keyword } = payload;

    if (!keyword || keyword.trim() === '') {
      throw RepositoryExceptions.business.operationNotAllowed('搜索关键词不能为空');
    }

    const result = await service.mailTemplate.searchContent(keyword, payload);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：获取模板统计信息
   */
  async getStats() {
    const { ctx, service } = this;

    const { type } = ctx.query;

    // 构建过滤条件
    const filter = {};
    if (type) {
      filter.type = type;
    }

    const result = await service.mailTemplate.getStats(filter);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：检查模板标题是否可用
   */
  async checkTitle() {
    const { ctx, service } = this;

    const { title, excludeId } = ctx.query;

    if (!title || title.trim() === '') {
      throw RepositoryExceptions.mailTemplate.titleRequired();
    }

    const result = await service.mailTemplate.checkTitle(title, excludeId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：获取指定类型的模板
   */
  async getByType() {
    const { ctx, service } = this;

    const payload = ctx.query;
    const { type } = payload;

    if (!type) {
      throw RepositoryExceptions.business.operationNotAllowed('模板类型不能为空');
    }

    const result = await service.mailTemplate.getTemplatesByType(type, payload);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：获取热门模板
   */
  async getPopular() {
    const { ctx, service } = this;

    const payload = ctx.query;
    const limit = parseInt(payload.limit) || 10;

    const result = await service.mailTemplate.getPopularTemplates(payload, limit);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：获取最近创建的模板
   */
  async getRecent() {
    const { ctx, service } = this;

    const limit = parseInt(ctx.query.limit) || 5;

    const result = await service.mailTemplate.getRecentTemplates(limit);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：批量删除模板
   */
  async batchDelete() {
    const { ctx, service } = this;

    const { ids } = ctx.request.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw RepositoryExceptions.business.operationNotAllowed('请选择要删除的模板');
    }

    const result = await service.mailTemplate.batchDelete(ids);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：验证模板数据
   */
  async validateData() {
    const { ctx, service } = this;

    const { data, operation = 'create' } = ctx.request.body;

    if (!data) {
      throw RepositoryExceptions.business.operationNotAllowed('验证数据不能为空');
    }

    const result = service.mailTemplate.validateTemplateData(data, operation);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }
}

module.exports = MailTemplateController;
