/**
 * MailTemplate Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const moment = require('moment');
const RepositoryExceptions = require('../repository/base/RepositoryExceptions');
const SystemConstants = require('../constants/SystemConstants');

class MailTemplateService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 MailTemplate Repository
    this.repository = this.repositoryFactory.createMailTemplateRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    const defaultOptions = {
      searchKeys: ['title', 'subTitle', 'type', 'comment'],
      populate: [],
      fields: undefined, // MailTemplate 不需要排除字段
    };

    return await this.repository.find(payload, { ...defaultOptions, ...options });
  }

  /**
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 统计记录数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 记录数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建记录
   * @param {Object} data 记录数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    // 🔥 业务验证：检查标题唯一性
    if (data.title) {
      await this.repository.checkTitleUnique(data.title);
    }

    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    // 🔥 业务验证：检查标题唯一性（排除当前记录）
    if (data.title) {
      await this.repository.checkTitleUnique(data.title, id);
    }

    return await this.repository.update(id, data);
  }

  /**
   * 删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // ===== MailTemplate 特有的业务方法 =====

  /**
   * 根据模板类型查找模板
   * @param {String} type 模板类型
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByType(type, payload = {}, options = {}) {
    return await this.repository.findByType(type, payload, options);
  }

  /**
   * 根据标题查找模板
   * @param {String} title 模板标题
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 模板信息
   */
  async findByTitle(title, options = {}) {
    return await this.repository.findByTitle(title, options);
  }

  /**
   * 获取所有模板类型
   * @return {Promise<Object>} 模板类型映射（用于下拉选项）
   */
  async getTemplateTypes() {
    const { VALID_TEMPLATE_TYPES, TEMPLATE_TYPE_TEXT } = SystemConstants.MAIL;
    const typeMap = {};

    VALID_TEMPLATE_TYPES.forEach(type => {
      typeMap[type] = TEMPLATE_TYPE_TEXT[type] || type;
    });

    return typeMap;
  }

  /**
   * 获取模板统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getStats(filter = {}) {
    return await this.repository.getTemplateStats(filter);
  }

  /**
   * 批量更新模板类型
   * @param {Array} templateIds 模板ID数组
   * @param {String} newType 新类型
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateType(templateIds, newType) {
    // 🔥 业务验证：验证类型有效性
    const validTypes = SystemConstants.MAIL.VALID_TEMPLATE_TYPES;

    if (!validTypes.includes(newType)) {
      throw new Error(`Invalid template type: ${newType}`);
    }

    return await this.repository.batchUpdateType(templateIds, newType);
  }

  /**
   * 搜索模板内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 搜索结果
   */
  async searchContent(keyword, payload = {}, options = {}) {
    if (!keyword || keyword.trim() === '') {
      throw new Error('Search keyword is required');
    }

    return await this.repository.searchContent(keyword, payload, options);
  }

  /**
   * 复制模板
   * @param {String} templateId 源模板ID
   * @param {Object} overrideData 覆盖数据
   * @return {Promise<Object>} 新模板
   */
  async duplicateTemplate(templateId, overrideData = {}) {
    if (!templateId) {
      throw new Error('Template ID is required');
    }

    return await this.repository.duplicateTemplate(templateId, overrideData);
  }

  /**
   * 检查模板标题是否可用
   * @param {String} title 模板标题
   * @param {String} excludeId 排除的ID
   * @return {Promise<Object>} 检查结果
   */
  async checkTitle(title, excludeId = null) {
    if (!title || title.trim() === '') {
      throw new Error('Template title is required');
    }

    try {
      await this.repository.checkTitleUnique(title, excludeId);
      return { available: true, exists: false };
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        return { available: false, exists: true };
      }
      throw error;
    }
  }

  /**
   * 获取指定类型的模板列表
   * @param {String} type 模板类型
   * @param {Object} payload 分页参数
   * @return {Promise<Object>} 模板列表
   */
  async getTemplatesByType(type, payload = {}) {
    const validTypes = SystemConstants.MAIL.VALID_TEMPLATE_TYPES;

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid template type: ${type}`);
    }

    return await this.findByType(type, payload);
  }

  /**
   * 获取热门模板（按使用频率排序）
   * @param {Object} payload 分页参数
   * @param {Number} limit 限制数量
   * @return {Promise<Object>} 热门模板列表
   */
  async getPopularTemplates(payload = {}, limit = 10) {
    const options = {
      sort: [
        { field: 'createdAt', order: 'desc' }, // 按创建时间排序，实际项目中可以按使用次数排序
      ],
    };

    const limitedPayload = {
      ...payload,
      pageSize: limit,
    };

    return await this.find(limitedPayload, options);
  }

  /**
   * 获取最近创建的模板
   * @param {Number} limit 限制数量
   * @return {Promise<Array>} 最近模板列表
   */
  async getRecentTemplates(limit = 5) {
    const payload = {
      pageSize: limit,
      isPaging: true,
    };

    const options = {
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    const result = await this.find(payload, options);
    return result.docs || result;
  }

  /**
   * 批量删除模板
   * @param {Array} templateIds 模板ID数组
   * @return {Promise<Object>} 删除结果
   */
  async batchDelete(templateIds) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      throw new Error('Template IDs array is required');
    }

    return await this.remove(templateIds);
  }

  /**
   * 验证模板数据
   * @param {Object} data 模板数据
   * @param {String} operation 操作类型 ('create' | 'update')
   * @return {Object} 验证结果
   */
  validateTemplateData(data, operation = 'create') {
    const errors = [];

    // 标题验证
    if (operation === 'create' || data.title !== undefined) {
      if (!data.title || data.title.trim() === '') {
        errors.push('模板标题不能为空');
      } else if (data.title.length > 200) {
        errors.push('模板标题长度不能超过200个字符');
      }
    }

    // 内容验证
    if (operation === 'create' || data.content !== undefined) {
      if (!data.content || data.content.trim() === '') {
        errors.push('模板内容不能为空');
      }
    }

    // 类型验证
    if (data.type) {
      const validTypes = SystemConstants.MAIL.VALID_TEMPLATE_TYPES;

      if (!validTypes.includes(data.type)) {
        errors.push(`无效的模板类型: ${data.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  /**
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }

  // ===== 兼容旧版本的方法别名 =====

  /**
   * 兼容旧版本的 removes 方法
   * @param {Object} ctx 上下文
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {String} key 主键字段名，默认为 'id'
   * @return {Promise<Object>} 删除结果
   */
  async removes(ctx, ids, key = 'id') {
    return await this.remove(ids, key);
  }

  /**
   * 兼容旧版本的 item 方法
   * @param {Object} ctx 上下文
   * @param {Object} params 查询参数
   * @return {Promise<Object|null>} 记录对象
   */
  async item(ctx, params = {}) {
    return await this.findOne(params);
  }

  /**
   * 检查模板标题是否唯一
   * @param {String} title 模板标题
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkTitleUnique(title, excludeId = null) {
    try {
      await this.repository.checkTitleUnique(title, excludeId);
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        return false;
      }
      throw error;
    }
  }

  // ===== 🔥 邮件发送相关方法 =====

  /**
   * 发送邮件（核心业务方法）
   * @param {String} tempkey 模板键
   * @param {Object} sendEmailInfo 发送信息
   * @param {Object} options 发送选项
   * @return {Promise<Object>} 发送结果
   */
  async sendEmail(tempkey, sendEmailInfo, options = {}) {
    if (!tempkey || !sendEmailInfo) {
      throw RepositoryExceptions.business.operationNotAllowed('邮件发送参数不完整');
    }

    // 🔒 安全验证：批量邮件需要明确的授权标识
    const normalizedType = this._normalizeTemplateType(tempkey);
    if (normalizedType === SystemConstants.MAIL.BUSINESS_TYPES.BULK_EMAIL) {
      // 批量邮件必须通过 options.allowBulkEmail 明确授权
      if (!options.allowBulkEmail) {
        throw RepositoryExceptions.business.operationNotAllowed(
          '批量邮件发送需要明确授权'
        );
      }
    }

    // 🔥 获取系统邮件配置
    const sysConfigs = await this.ctx.service.systemConfig.findByKeys([
      'siteEmail',
      'siteEmailPwd',
      'siteName',
      'siteDomain',
      'siteEmailServer',
    ]);

    if (_.isEmpty(sysConfigs)) {
      throw RepositoryExceptions.business.operationNotAllowed('系统邮件配置不完整');
    }

    const { siteName, siteDomain, siteEmailServer } = sysConfigs;

    if (!siteEmailServer) {
      throw RepositoryExceptions.business.operationNotAllowed('请先在系统配置中配置邮箱服务器信息');
    }

    // 🔥 扩展邮件信息
    Object.assign(sendEmailInfo, { siteName, siteDomain });

    // normalizedType 已在前面声明，这里直接使用
    const shouldQueryTemplate = normalizedType !== SystemConstants.MAIL.BUSINESS_TYPES.BULK_EMAIL && tempkey !== '-1';

    // 🔥 获取邮件模板
    let emailTemplate = null;
    if (shouldQueryTemplate) {
      const templateResult = await this.findByType(normalizedType, { pageSize: 1 });
      if (templateResult && templateResult.docs && templateResult.docs.length > 0) {
        emailTemplate = templateResult.docs[0];
      } else if (Array.isArray(templateResult) && templateResult.length > 0) {
        emailTemplate = templateResult[0];
      }
    }

    if (!emailTemplate) {
      emailTemplate = this._getFallbackTemplate(normalizedType);
      if (emailTemplate) {
        this.ctx.logger.warn(
          `[MailTemplate] Using static fallback template for type "${normalizedType}" (original: "${tempkey}")`
        );
      }
    }

    if (!emailTemplate && shouldQueryTemplate) {
      throw RepositoryExceptions.mailTemplate.notFound(normalizedType);
    }

    // 🔥 构建邮件内容
    const emailData = await this._buildEmailContent(normalizedType, emailTemplate, sendEmailInfo);

    // 🔥 发送邮件
    const sendResult = await this._sendEmail(emailData, sysConfigs);

    return sendResult;
  }

  /**
   * 发送测试邮件
   * @param {String} email 测试邮箱地址
   * @return {Promise<Object>} 发送结果
   */
  async sendTestEmail(email) {
    if (!email) {
      throw RepositoryExceptions.business.operationNotAllowed('测试邮箱地址不能为空');
    }

    // 获取系统配置
    const sysConfigs = await this.ctx.service.systemConfig.findByKeys([
      'siteEmail',
      'siteEmailPwd',
      'siteName',
      'siteEmailServer',
    ]);

    if (_.isEmpty(sysConfigs) || !sysConfigs.siteEmailServer) {
      throw RepositoryExceptions.business.operationNotAllowed('邮件配置不完整');
    }

    // 构建测试邮件
    const emailData = {
      to: email,
      subject: `[${sysConfigs.siteName}] 邮件发送测试`,
      title: '邮件发送测试',
      content: `
        <h2>邮件发送测试</h2>
        <p>这是一封测试邮件，用于验证邮件服务器配置是否正确。</p>
        <p>发送时间：${moment().format('YYYY-MM-DD HH:mm:ss')}</p>
        <p>如果您收到这封邮件，说明邮件服务配置正常。</p>
      `,
    };

    const sendResult = await this._sendEmail(emailData, sysConfigs);

    return sendResult;
  }

  /**
   * 验证邮件配置
   * @return {Promise<Object>} 验证结果
   */
  async validateEmailConfig() {
    const sysConfigs = await this.ctx.service.systemConfig.findByKeys(['siteEmail', 'siteEmailPwd', 'siteEmailServer']);

    const isValid =
      !_.isEmpty(sysConfigs) && sysConfigs.siteEmail && sysConfigs.siteEmailPwd && sysConfigs.siteEmailServer;

    return {
      isValid,
      config: isValid
        ? {
            email: sysConfigs.siteEmail,
            server: sysConfigs.siteEmailServer,
          }
        : null,
    };
  }

  // ===== 🔥 私有辅助方法 =====

  /**
   * 构建邮件内容
   * @param {String} tempkey 模板键
   * @param {Object} template 邮件模板
   * @param {Object} sendEmailInfo 发送信息
   * @return {Promise<Object>} 邮件数据
   * @private
   */
  async _buildEmailContent(tempkey, template, sendEmailInfo) {
    const { siteName } = sendEmailInfo;
    let emailTitle = 'Hello';
    let emailSubject = 'Hello';
    let emailContent = 'Hello';
    let toEmail = '';

    // 🔥 根据不同的模板类型构建邮件内容
    switch (tempkey) {
      case SystemConstants.MAIL.BUSINESS_TYPES.BULK_EMAIL: // 邮件群发
        emailSubject = emailTitle = `[${siteName}] ${sendEmailInfo.title}`;
        emailContent = sendEmailInfo.content;
        toEmail = sendEmailInfo.targets;
        break;

      case SystemConstants.MAIL.BUSINESS_TYPES.PASSWORD_RESET: {
        // 密码重置
        toEmail = sendEmailInfo.email;
        emailSubject = emailTitle = `[${siteName}] ${(template && template.title) || '重置密码'}`;

        // 生成重置令牌
        const resetData = `${sendEmailInfo.password}$${sendEmailInfo.email}$${this.app.config.session_secret}`;
        const resetToken = this.ctx.helper.encrypt(resetData, this.app.config.encrypt_key);
        sendEmailInfo.token = encodeURIComponent(resetToken);

        emailContent = this._renderTemplate(template && template.content, sendEmailInfo, [
          'email',
          'userName',
          'token',
          'siteName',
          'siteDomain',
        ]);
        break;
      }

      case SystemConstants.MAIL.BUSINESS_TYPES.MESSAGE_NOTIFICATION: {
        // 消息通知
        const msgDate = moment(sendEmailInfo.createdAt).format('YYYY-MM-DD HH:mm:ss');
        sendEmailInfo.message_author_userName = sendEmailInfo.author.userName;
        sendEmailInfo.message_sendDate = msgDate;
        sendEmailInfo.message_content_title = sendEmailInfo.content.title;
        sendEmailInfo.message_content_id = sendEmailInfo.content.id;

        emailSubject = emailTitle = `[${siteName}] ${(template && template.title) || '留言通知'}`;
        emailContent = this._renderTemplate(template && template.content, sendEmailInfo, [
          'siteName',
          'message_author_userName',
          'message_sendDate',
          'siteDomain',
          'message_content_title',
          'message_content_id',
        ]);
        toEmail = sendEmailInfo.replyAuthor.email;
        break;
      }

      case SystemConstants.MAIL.BUSINESS_TYPES.VERIFICATION_CODE: // 验证码邮件
        emailSubject = emailTitle = `[${siteName}] ${(template && template.title) || '邮箱验证码'}`;
        emailContent = this._renderTemplate(template && template.content, sendEmailInfo, [
          'email',
          'siteName',
          'siteDomain',
          'msgCode',
        ]);
        toEmail = sendEmailInfo.email;
        break;

      default:
        if (template) {
          emailSubject = emailTitle = `[${siteName}] ${template.title}`;
          emailContent = this._renderTemplate(template.content, sendEmailInfo);
          toEmail = sendEmailInfo.email || sendEmailInfo.targets;
        }
        break;
    }

    return {
      to: toEmail,
      subject: emailSubject,
      title: emailTitle,
      content: emailContent,
    };
  }

  /**
   * 渲染邮件模板
   * @param {String} template 模板内容
   * @param {Object} data 数据
   * @param {Array} fields 字段列表
   * @return {String} 渲染后的内容
   * @private
   */
  _renderTemplate(template, data, fields = []) {
    if (!template) return '';

    let content = template;

    // 如果指定了字段列表，只替换这些字段
    if (fields.length > 0) {
      fields.forEach(field => {
        const regex = new RegExp(`{{${field}}}`, 'g');
        content = content.replace(regex, data[field] || '');
      });
    } else {
      // 替换所有可能的字段
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, data[key] || '');
      });
    }

    return content;
  }

  _normalizeTemplateType(type) {
    if (!type) return type;
    if (type === '-1') return SystemConstants.MAIL.BUSINESS_TYPES.BULK_EMAIL;
    if (type === '0') return SystemConstants.MAIL.BUSINESS_TYPES.PASSWORD_RESET;
    if (type === '6') return SystemConstants.MAIL.BUSINESS_TYPES.MESSAGE_NOTIFICATION;
    if (type === '8') return SystemConstants.MAIL.BUSINESS_TYPES.VERIFICATION_CODE;
    return type;
  }

  _getFallbackTemplate(type) {
    const templates = SystemConstants.MAIL.STATIC_TEMPLATES[type];
    if (!templates || templates.length === 0) return null;
    return templates[0];
  }

  /**
   * 发送邮件
   * @param {Object} emailData 邮件数据
   * @param {Object} sysConfigs 系统配置
   * @return {Promise<Object>} 发送结果
   * @private
   */
  async _sendEmail(emailData, sysConfigs) {
    const { siteEmail, siteEmailPwd, siteEmailServer } = sysConfigs;

    // 🔥 构建邮件服务器配置
    let transportConfig = {
      service: siteEmailServer,
      auth: {
        user: siteEmail,
        pass: this.ctx.helper.decrypt(siteEmailPwd, this.app.config.encrypt_key),
      },
    };

    // 🔥 支持自定义SMTP服务器
    if (siteEmailServer.indexOf('smtp.') === 0) {
      transportConfig = {
        host: siteEmailServer,
        port: 465,
        secure: true,
        auth: {
          user: siteEmail,
          pass: this.ctx.helper.decrypt(siteEmailPwd, this.app.config.encrypt_key),
        },
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // 🔥 构建邮件选项
    const mailOptions = {
      from: siteEmail,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.title,
      html: emailData.content,
    };

    // 🔥 发送邮件（Promise化）
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          this.ctx.logger.error('邮件发送失败：', error);
          reject(new Error(`邮件发送失败: ${error.message}`));
        } else {
          this.ctx.logger.info('邮件发送成功：', info.response);
          resolve({
            success: true,
            messageId: info.messageId,
            response: info.response,
          });
        }
      });
    });
  }
}

module.exports = MailTemplateService;
