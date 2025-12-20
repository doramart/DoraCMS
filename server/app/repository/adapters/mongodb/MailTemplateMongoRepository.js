/**
 * 标准化的 MailTemplate MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
// const _ = require('lodash');

class MailTemplateMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'MailTemplate');

    // 设置 MongoDB 模型
    this.model = this.app.model.MailTemplate;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // MailTemplate 通常不需要复杂的关联关系
        // 如果需要关联用户或其他实体，可以在这里定义
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // MailTemplate 通常不需要关联查询
      // 如果需要关联创建者信息，可以添加：
      // { path: 'createBy', select: ['userName', 'nickName'] },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['title', 'subTitle', 'type', 'comment'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' },
      { field: 'title', order: 'asc' },
    ];
  }

  // ===== 🔥 基类钩子方法重写 - 用于MailTemplate特定逻辑 =====

  /**
   * 重写状态映射（如果MailTemplate有状态字段）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（MailTemplate特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加MailTemplate特定的数据处理
    // 添加模板类型文本描述
    if (item.type) {
      item.typeText = this._getTemplateTypeText(item.type);
    }

    // 添加内容长度信息
    if (item.content) {
      item.contentLength = item.content.length;
      item.contentPreview = item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '');
    }

    // 确保字段的默认值
    item.comment = item.comment || '';
    item.subTitle = item.subTitle || '';

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（MailTemplate特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加MailTemplate特定的创建前处理
    // 数据验证
    if (!data.title || data.title.trim() === '') {
      throw this.exceptions.mailTemplate.titleRequired();
    }

    if (!data.content || data.content.trim() === '') {
      throw this.exceptions.mailTemplate.contentRequired();
    }

    // 验证标题长度
    if (data.title && data.title.length > 200) {
      throw this.exceptions.mailTemplate.titleTooLong(200);
    }

    // 验证类型有效性
    if (data.type && !this._isValidTemplateType(data.type)) {
      throw this.exceptions.mailTemplate.invalidType(data.type);
    }

    // 设置默认值
    if (!data.type) data.type = SYSTEM_CONSTANTS.MAIL.TEMPLATE_TYPE.GENERAL;
    if (!data.comment) data.comment = '';

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（MailTemplate特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加MailTemplate特定的更新前处理
    // 数据验证
    if (data.title !== undefined && (!data.title || data.title.trim() === '')) {
      throw this.exceptions.mailTemplate.titleRequired();
    }

    if (data.content !== undefined && (!data.content || data.content.trim() === '')) {
      throw this.exceptions.mailTemplate.contentRequired();
    }

    // 验证标题长度
    if (data.title && data.title.length > 200) {
      throw this.exceptions.mailTemplate.titleTooLong(200);
    }

    // 验证类型有效性
    if (data.type && !this._isValidTemplateType(data.type)) {
      throw this.exceptions.mailTemplate.invalidType(data.type);
    }

    return data;
  }

  // ===== MailTemplate 特定的业务方法 =====

  /**
   * 检查模板标题是否唯一
   * @param {String} title 模板标题
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标题已存在时抛出异常
   */
  async checkTitleUnique(title, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkMailTemplateTitleUnique(this, title, excludeId);
      if (!isUnique) {
        throw this.exceptions.mailTemplate.titleExists(title);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkTitleUnique', { title, excludeId });
    }
  }

  /**
   * 根据模板类型查找模板
   * @param {String} type 模板类型
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByType(type, payload = {}, options = {}) {
    try {
      const filters = { type, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByType', { type, payload, options });
    }
  }

  /**
   * 根据标题查找模板
   * @param {String} title 模板标题
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 模板信息
   */
  async findByTitle(title, options = {}) {
    try {
      const query = { title };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByTitle', { title, options });
    }
  }

  /**
   * 获取模板统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getTemplateStats(filter = {}) {
    try {
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgContentLength: { $avg: { $strLenCP: '$content' } },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const total = await this.count(filter);

      const stats = {
        total,
        byType: result.map(item => ({
          type: item._id,
          count: item.count,
          avgContentLength: Math.round(item.avgContentLength || 0),
          typeText: this._getTemplateTypeText(item._id),
        })),
      };

      return stats;
    } catch (error) {
      this._handleError(error, 'getTemplateStats', { filter });
      return { total: 0, byType: [] };
    }
  }

  /**
   * 批量更新模板类型
   * @param {Array} templateIds 模板ID数组
   * @param {String} newType 新类型
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateType(templateIds, newType) {
    try {
      if (!this._isValidTemplateType(newType)) {
        throw this.exceptions.mailTemplate.invalidType(newType);
      }

      const idArray = Array.isArray(templateIds) ? templateIds : [templateIds];
      const result = await this.model.updateMany(
        { _id: { $in: idArray } },
        { $set: { type: newType, updatedAt: new Date() } }
      );

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'batchUpdateType', { templateIds, newType });
    }
  }

  /**
   * 搜索模板内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 搜索结果
   */
  async searchContent(keyword, payload = {}, options = {}) {
    try {
      const searchPayload = {
        ...payload,
        searchkey: keyword,
      };

      const searchOptions = {
        ...options,
        searchKeys: ['title', 'subTitle', 'content', 'comment'],
      };

      return await this.find(searchPayload, searchOptions);
    } catch (error) {
      this._handleError(error, 'searchContent', { keyword, payload, options });
    }
  }

  /**
   * 复制模板
   * @param {String} templateId 源模板ID
   * @param {Object} overrideData 覆盖数据
   * @return {Promise<Object>} 新模板
   */
  async duplicateTemplate(templateId, overrideData = {}) {
    try {
      const sourceTemplate = await this.findById(templateId);
      if (!sourceTemplate) {
        throw this.exceptions.mailTemplate.notFound(templateId);
      }

      // 准备新模板数据
      const newTemplateData = {
        title: overrideData.title || `${sourceTemplate.title} - 副本`,
        subTitle: overrideData.subTitle || sourceTemplate.subTitle,
        content: overrideData.content || sourceTemplate.content,
        type: overrideData.type || sourceTemplate.type,
        comment: overrideData.comment || sourceTemplate.comment,
        ...overrideData,
      };

      // 确保标题唯一性
      await this.checkTitleUnique(newTemplateData.title);

      return await this.create(newTemplateData);
    } catch (error) {
      this._handleError(error, 'duplicateTemplate', { templateId, overrideData });
    }
  }

  // ===== 辅助方法 =====

  /**
   * 获取模板类型文本描述
   * @param {String} type 模板类型
   * @return {String} 类型文本
   * @private
   */
  _getTemplateTypeText(type) {
    return SYSTEM_CONSTANTS.MAIL.TEMPLATE_TYPE_TEXT[type] || type || '未知类型';
  }

  /**
   * 验证模板类型是否有效
   * @param {String} type 模板类型
   * @return {Boolean} 是否有效
   * @private
   */
  _isValidTemplateType(type) {
    return SYSTEM_CONSTANTS.MAIL.VALID_TEMPLATE_TYPES.includes(type);
  }
}

module.exports = MailTemplateMongoRepository;
