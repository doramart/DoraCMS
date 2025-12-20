/**
 * 优化后的 AdsItems MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 AdsItems 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 AdsItems 特定的业务方法和配置
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const AdsItemsSchema = require('../../schemas/mariadb/AdsItemsSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');

class AdsItemsMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'AdsItems');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
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
      this.model = AdsItemsSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // AdsItems 通常不需要复杂的关联关系
        },
      });

      // console.log('✅ AdsItemsMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ AdsItemsMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - AdsItems 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['title', 'alt', 'link'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 🔥 优化版：使用基类的自动检测功能
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // AdsItems模块特有的需要排除的字段
    const moduleExcludeFields = [
      // AdsItems 通常没有需要排除的字段
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - AdsItems 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法
    item = super._customProcessDataItem(item);

    // 添加 AdsItems 特有的数据处理
    if (item.target !== undefined) {
      const targetTexts = {
        _blank: '新窗口',
        _self: '当前窗口',
        _parent: '父窗口',
        _top: '顶层窗口',
      };
      item.targetText = targetTexts[item.target] || '新窗口';
    }

    // 添加 APP 链接类型文本
    if (item.appLinkType !== undefined) {
      const appLinkTypeTexts = {
        0: '文章',
        1: '分类',
        2: '其他',
      };
      item.appLinkTypeText = item.appLinkType ? appLinkTypeTexts[item.appLinkType] || '未知' : '';
    }

    // 添加便捷方法结果
    item.hasImage = !!(item.sImg && item.sImg.trim() !== '');
    item.hasLink = !!(item.link && item.link.trim() !== '');

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - AdsItems 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 设置默认值
    if (data.target === undefined) data.target = '_blank';
    if (data.height === undefined) data.height = 1;

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - AdsItems 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // AdsItems 特有的更新前处理
    return data;
  }

  // ===== 🔥 AdsItems 特有的业务方法 =====

  /**
   * 根据标题查找广告单元（模糊匹配）
   * @param {String} title 标题
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByTitle(title, options = {}) {
    await this._ensureConnection();

    try {
      const filters = {
        title: { [this.Op.like]: `%${title}%` },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByTitle', { title, options });
    }
  }

  /**
   * 根据链接查找广告单元
   * @param {String} link 链接
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByLink(link, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { link, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByLink', { link, options });
    }
  }

  /**
   * 根据链接打开方式查找广告单元
   * @param {String} target 链接打开方式
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByTarget(target, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { target, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByTarget', { target, options });
    }
  }

  /**
   * 查找有图片的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有图片的广告单元列表
   */
  async findWithImages(options = {}) {
    await this._ensureConnection();

    try {
      const filters = {
        sImg: { [this.Op.ne]: null },
        [this.Op.and]: [{ sImg: { [this.Op.ne]: '' } }],
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findWithImages', { options });
    }
  }

  /**
   * 查找有链接的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有链接的广告单元列表
   */
  async findWithLinks(options = {}) {
    await this._ensureConnection();

    try {
      const filters = {
        link: { [this.Op.ne]: null },
        [this.Op.and]: [{ link: { [this.Op.ne]: '' } }],
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findWithLinks', { options });
    }
  }

  /**
   * 根据APP链接类型查找广告单元
   * @param {String} appLinkType APP链接类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByAppLinkType(appLinkType, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { appLinkType, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByAppLinkType', { appLinkType, options });
    }
  }

  /**
   * 获取广告单元统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdsItemsStats(filter = {}) {
    await this._ensureConnection();

    try {
      // 基础统计
      const total = await this.model.count({ where: filter });

      // 有图片和有链接的统计
      const withImageCount = await this.model.count({
        where: {
          ...filter,
          sImg: { [this.Op.ne]: null },
          [this.Op.and]: [{ sImg: { [this.Op.ne]: '' } }],
        },
      });

      const withLinkCount = await this.model.count({
        where: {
          ...filter,
          link: { [this.Op.ne]: null },
          [this.Op.and]: [{ link: { [this.Op.ne]: '' } }],
        },
      });

      // 按target类型统计
      const targetStats = await this.model.findAll({
        where: filter,
        attributes: ['target', [this.connection.getSequelize().fn('COUNT', '*'), 'count']],
        group: ['target'],
        raw: true,
      });

      const stats = {
        total,
        withImage: withImageCount,
        withLink: withLinkCount,
        byTarget: {},
      };

      targetStats.forEach(item => {
        stats.byTarget[item.target] = item.count;
      });

      return stats;
    } catch (error) {
      this._handleError(error, 'getAdsItemsStats', { filter });
      return { total: 0, withImage: 0, withLink: 0, byTarget: {} };
    }
  }

  /**
   * 验证链接格式是否正确
   * @param {String} link 链接
   * @return {Promise<Boolean>} 链接是否有效
   * @throws {ValidationError} 当链接格式无效时抛出异常
   */
  async checkLinkValid(link) {
    try {
      if (!link || link.trim() === '') {
        return true; // 空链接是允许的
      }

      // 检查是否是有效的URL格式
      if (!link.match(/^https?:\/\//)) {
        throw this.exceptions.adsItems.invalidLink(link);
      }

      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkLinkValid', { link });
    }
  }

  /**
   * 验证target值是否有效
   * @param {String} target 链接打开方式
   * @return {Promise<Boolean>} target是否有效
   * @throws {ValidationError} 当target无效时抛出异常
   */
  async checkTargetValid(target) {
    try {
      const validTargets = ['_blank', '_self', '_parent', '_top'];
      if (!validTargets.includes(target)) {
        throw this.exceptions.adsItems.invalidTarget(target);
      }
      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkTargetValid', { target });
    }
  }

  /**
   * 验证尺寸是否有效
   * @param {Number} width 宽度
   * @param {Number} height 高度
   * @return {Promise<Boolean>} 尺寸是否有效
   * @throws {ValidationError} 当尺寸无效时抛出异常
   */
  async checkDimensionsValid(width, height) {
    try {
      if (width && (width < 1 || width > 5000)) {
        throw this.exceptions.adsItems.invalidDimensions('宽度必须在 1-5000 之间');
      }

      if (height && (height < 1 || height > 5000)) {
        throw this.exceptions.adsItems.invalidDimensions('高度必须在 1-5000 之间');
      }

      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkDimensionsValid', { width, height });
    }
  }

  // ===== 继承基类的标准方法（无需重复实现） =====

  /**
   * 查找单条记录
   * @param query
   * @param options
   */
  async findOne(query = {}, options = {}) {
    await this._ensureConnection();
    return await super.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param id
   * @param options
   */
  async findById(id, options = {}) {
    const query = { id };
    return await this.findOne(query, options);
  }

  /**
   * 统计记录数量
   * @param filters
   */
  async count(filters = {}) {
    await this._ensureConnection();
    return await super.count(filters);
  }

  /**
   * 创建记录
   * @param data
   */
  async create(data) {
    await this._ensureConnection();
    return await super.create(data);
  }

  /**
   * 更新记录
   * @param id
   * @param data
   * @param options
   */
  async update(id, data, options = {}) {
    await this._ensureConnection();
    return await super.update(id, data, options);
  }

  /**
   * 删除记录
   * @param ids
   * @param key
   */
  async remove(ids, key = 'id') {
    await this._ensureConnection();
    return await super.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param ids
   * @param updateObj
   */
  async safeDelete(ids, updateObj = { status: 'disabled' }) {
    await this._ensureConnection();
    return await super.safeDelete(ids, updateObj);
  }
}

module.exports = AdsItemsMariaRepository;
