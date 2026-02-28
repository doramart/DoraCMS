/**
 * MailTemplate API Controller
 * 基于最新的三层架构和统一异常处理规范 (2024)
 * 🔥 移除重复try-catch，使用统一异常处理中间件
 * 🎯 标准化参数格式，集成邮件发送功能
 * ✅ 优化邮件发送逻辑，增强错误处理
 */
'use strict';

const Controller = require('egg').Controller;
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

class MailTemplateController extends Controller {
  /**
   * 获取邮件模板列表（API接口）
   */
  async list() {
    const { ctx, service } = this;

    const payload = ctx.query;

    // 🔥 构建标准化查询条件
    const filters = {};

    if (payload.type) {
      filters.type = { $eq: payload.type };
    }

    // 🔥 API接口通常需要更简洁的字段
    const options = {
      filters,
      fields: ['id', 'title', 'subTitle', 'type', 'createdAt'],
      searchKeys: ['title', 'subTitle', 'comment'],
      sort: [{ field: 'createdAt', order: 'desc' }],
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

    const typeList = await service.mailTemplate.getTemplateTypes();

    ctx.helper.renderSuccess(ctx, {
      data: typeList,
    });
  }

  /**
   * 根据类型获取单个模板
   * @description 支持 RESTful 路由：GET /api/v1/mail-templates/:id
   */
  async getOne() {
    const { ctx, service } = this;

    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容查询参数 type
    const type = ctx.params.id || ctx.query.type;

    if (!type) {
      throw RepositoryExceptions.business.operationNotAllowed('模板类型不能为空');
    }

    // 🔥 使用标准化的查询方法
    const result = await service.mailTemplate.findByType(type, { pageSize: 1 });

    // 提取第一个模板
    let template = null;
    if (result && result.docs && result.docs.length > 0) {
      template = result.docs[0];
    } else if (Array.isArray(result) && result.length > 0) {
      template = result[0];
    }

    ctx.helper.renderSuccess(ctx, {
      data: template,
    });
  }

  /**
   * 发送邮件（核心功能）
   * 🔒 安全限制：批量邮件功能仅限管理员使用
   */
  async sendEmail() {
    const { ctx, service } = this;

    const fields = ctx.request.body || {};
    const { tempkey, info: sendEmailInfo } = fields;

    // 🔒 安全检查：批量邮件（tempkey = '-1'）仅限管理员使用
    let allowBulkEmail = false;
    if (tempkey === '-1') {
      const isAdmin = !!(ctx.session.adminUserInfo && ctx.session.adminUserInfo.id);

      if (!isAdmin) {
        throw RepositoryExceptions.business.operationNotAllowed(
          '批量邮件发送功能仅限管理员使用'
        );
      }

      allowBulkEmail = true;
    }

    // 🔥 调用 service 层的邮件发送方法
    const sendResult = await service.mailTemplate.sendEmail(tempkey, sendEmailInfo, {
      allowBulkEmail,
    });

    ctx.helper.renderSuccess(ctx, {
      data: sendResult,
    });
  }

  /**
   * 🔥 新增：获取模板预览
   */
  async preview() {
    const { ctx, service } = this;

    const { id, type } = ctx.query;

    let template = null;

    if (id) {
      template = await service.mailTemplate.findById(id);
    } else if (type) {
      const result = await service.mailTemplate.findByType(type, { pageSize: 1 });
      if (result && result.docs && result.docs.length > 0) {
        template = result.docs[0];
      }
    }

    if (!template) {
      throw RepositoryExceptions.mailTemplate.notFound(id || type);
    }

    // 🔥 返回预览数据（不包含敏感信息）
    const previewData = {
      id: template.id,
      title: template.title,
      subTitle: template.subTitle,
      content: template.content,
      type: template.type,
      typeText: template.typeText,
    };

    ctx.helper.renderSuccess(ctx, {
      data: previewData,
    });
  }

  /**
   * 🔥 新增：验证邮件配置
   */
  async validateEmailConfig() {
    const { ctx, service } = this;

    // 🔥 调用 service 层的邮件配置验证方法
    const result = await service.mailTemplate.validateEmailConfig();

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  }

  /**
   * 🔥 新增：测试邮件发送
   */
  async testEmail() {
    const { ctx, service } = this;

    const { email } = ctx.request.body;

    // 🔥 调用 service 层的测试邮件发送方法
    const sendResult = await service.mailTemplate.sendTestEmail(email);

    ctx.helper.renderSuccess(ctx, {
      data: sendResult,
    });
  }
}

module.exports = MailTemplateController;
