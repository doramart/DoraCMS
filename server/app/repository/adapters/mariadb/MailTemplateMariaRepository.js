/**
 * 优化后的 MailTemplate MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 MailTemplate 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 MailTemplate 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 MailTemplate 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const MailTemplateSchema = require('../../schemas/mariadb/MailTemplateSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class MailTemplateMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'MailTemplate');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例，避免依赖连接管理器的缓存
      this.model = MailTemplateSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // MailTemplate 通常不需要复杂的关联关系
        },
      });

      // console.log('✅ MailTemplateMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ MailTemplateMariaRepository initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保连接已建立
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 🔥 重写基类的抽象方法 - MailTemplate 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // MailTemplate 通常不需要关联查询
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

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      1: '启用',
      0: '禁用',
    };
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从Schema获取所有字段，大幅减少维护成本
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 只需要定义需要排除的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // MailTemplate模块特有的需要排除的字段
    const moduleExcludeFields = [
      // MailTemplate 通常不需要排除特殊字段
      // 如果有关联字段或虚拟字段，在这里添加
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - MailTemplate 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加 MailTemplate 特有的数据处理
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

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - MailTemplate 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 MailTemplate 特有的创建前处理
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
   * 子类自定义的更新前数据处理 - MailTemplate 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 MailTemplate 特有的更新前处理
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
   * 🔥 统一异常处理版本：检查模板标题是否唯一 - 必须使用UniqueChecker
   * @param {String} title 模板标题
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标题已存在时抛出异常
   */
  async checkTitleUnique(title, excludeId = null) {
    try {
      // 🔥 必须使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
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
    await this._ensureConnection();

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
    await this._ensureConnection();

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
    await this._ensureConnection();

    try {
      const total = await this.count(filter);

      const typeStats = await this.model.findAll({
        attributes: [
          'type',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('type')), 'count'],
          [
            this.connection
              .getSequelize()
              .fn('AVG', this.connection.getSequelize().fn('LENGTH', this.connection.getSequelize().col('content'))),
            'avgContentLength',
          ],
        ],
        where: filter,
        group: ['type'],
        order: [['type', 'ASC']],
      });

      const stats = {
        total,
        byType: typeStats.map(item => {
          const itemJson = this._deepToJSON(item);
          return {
            type: itemJson.type,
            count: parseInt(itemJson.count) || 0,
            avgContentLength: Math.round(parseFloat(itemJson.avgContentLength) || 0),
            typeText: this._getTemplateTypeText(itemJson.type),
          };
        }),
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
    await this._ensureConnection();

    try {
      if (!this._isValidTemplateType(newType)) {
        throw this.exceptions.mailTemplate.invalidType(newType);
      }

      // 转换ID格式
      const mariadbIds = Array.isArray(templateIds)
        ? templateIds.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: templateIds }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const [result] = await this.model.update({ type: newType, updatedAt: new Date() }, { where: whereCondition });

      return { modifiedCount: result };
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
    await this._ensureConnection();

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

module.exports = MailTemplateMariaRepository;
