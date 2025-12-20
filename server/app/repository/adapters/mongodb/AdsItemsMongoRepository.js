/**
 * 标准化的 AdsItems MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const _ = require('lodash');

class AdsItemsMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'AdsItems');

    // 设置 MongoDB 模型
    this.model = this.app.model.AdsItems;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // AdsItems 通常不需要复杂的关联关系
      },
    });
  }

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
   * 子类自定义的数据项处理（AdsItems特定逻辑）
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

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（AdsItems特定逻辑）
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
   * 子类自定义的更新前数据处理（AdsItems特定逻辑）
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
    const filters = {
      title: { $regex: title, $options: 'i' },
      ...options.filters,
    };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 根据链接查找广告单元
   * @param {String} link 链接
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByLink(link, options = {}) {
    const filters = { link, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 根据链接打开方式查找广告单元
   * @param {String} target 链接打开方式
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByTarget(target, options = {}) {
    const filters = { target, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 查找有图片的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有图片的广告单元列表
   */
  async findWithImages(options = {}) {
    const filters = {
      sImg: { $exists: true, $ne: null, $ne: '' },
      ...options.filters,
    };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 查找有链接的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有链接的广告单元列表
   */
  async findWithLinks(options = {}) {
    const filters = {
      link: { $exists: true, $ne: null, $ne: '' },
      ...options.filters,
    };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 根据APP链接类型查找广告单元
   * @param {String} appLinkType APP链接类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByAppLinkType(appLinkType, options = {}) {
    const filters = { appLinkType, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 获取广告单元统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdsItemsStats(filter = {}) {
    try {
      // 基础统计
      const total = await this.count(filter);

      // 按target类型统计
      const targetStats = await this.model.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$target',
            count: { $sum: 1 },
          },
        },
      ]);

      // 有图片和有链接的统计
      const withImageCount = await this.model.countDocuments({
        ...filter,
        sImg: { $exists: true, $ne: null, $ne: '' },
      });

      const withLinkCount = await this.model.countDocuments({
        ...filter,
        link: { $exists: true, $ne: null, $ne: '' },
      });

      const stats = {
        total,
        withImage: withImageCount,
        withLink: withLinkCount,
        byTarget: {},
      };

      targetStats.forEach(item => {
        stats.byTarget[item._id] = item.count;
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
}

module.exports = AdsItemsMongoRepository;
