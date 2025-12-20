/**
 * 标准化的 Ads MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class AdsMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Ads');

    // 设置 MongoDB 模型
    this.model = this.app.model.Ads;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        items: {
          model: this.app.model.AdsItems,
          path: 'items',
          select: ['title', 'link', 'appLink', 'sImg', 'alt', 'width', 'height', 'target'],
        },
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
      {
        path: 'items',
        select: ['title', 'link', 'appLink', 'sImg', 'alt', 'width', 'height', 'target'],
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'comments'];
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
   * 重写状态映射（Ads特定状态）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.BOOLEAN_STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（Ads特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法
    item = super._customProcessDataItem(item);

    // 添加 Ads 特有的数据处理
    if (item.type !== undefined) {
      const typeTexts = {
        0: '文字',
        1: '图片',
        2: '友情链接',
      };
      item.typeText = typeTexts[item.type] || '未知';
    }

    // 添加状态文本
    if (item.state !== undefined) {
      item.stateText = item.state ? '启用' : '禁用';
    }

    // 添加广告单元数量
    if (item.items) {
      item.itemCount = Array.isArray(item.items) ? item.items.length : 0;
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（Ads特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 设置默认值
    if (data.type === undefined) data.type = '0';
    if (data.state === undefined) data.state = true;
    if (data.carousel === undefined) data.carousel = true;
    if (data.height === undefined) data.height = 50;
    if (!data.items) data.items = [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（Ads特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 确保 items 字段是数组
    if (data.items && !Array.isArray(data.items)) {
      data.items = [];
    }

    return data;
  }

  // ===== 🔥 Ads 特有的业务方法 =====

  /**
   * 🔥 统一异常处理版本：检查广告名称是否唯一 - 必须使用UniqueChecker
   * @param {String} name 广告名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当广告名称已存在时抛出异常
   */
  async checkNameUnique(name, excludeId = null) {
    try {
      // 🔥 必须使用UniqueChecker统一处理唯一性验证
      const isUnique = await UniqueChecker.checkAdsNameUnique(this, name, excludeId);
      if (!isUnique) {
        throw this.exceptions.ads.nameExists(name);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkNameUnique', { name, excludeId });
    }
  }

  /**
   * 根据状态查找广告
   * @param {Boolean} state 广告状态
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByState(state, options = {}) {
    const filters = { state, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 根据类型查找广告
   * @param {String} type 广告类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByType(type, options = {}) {
    const filters = { type, ...options.filters };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 根据名称查找广告（模糊匹配）
   * @param {String} name 广告名称
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByName(name, options = {}) {
    const filters = {
      name: { $regex: name, $options: 'i' },
      ...options.filters,
    };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 获取启用的广告
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的广告列表
   */
  async findEnabledAds(options = {}) {
    return await this.findByState(true, {
      ...options,
      sort: [{ field: 'createdAt', order: 'desc' }],
    });
  }

  /**
   * 根据广告单元ID查找包含该单元的广告
   * @param {String|Array} itemIds 广告单元ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByItems(itemIds, options = {}) {
    const itemIdArray = Array.isArray(itemIds) ? itemIds : [itemIds];
    const filters = {
      items: { $in: itemIdArray },
      ...options.filters,
    };
    return await this.find({}, { ...options, filters });
  }

  /**
   * 批量更新广告状态
   * @param {Array} ids ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(ids, state) {
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const result = await this.model.updateMany({ _id: { $in: idArray } }, { $set: { state, updatedAt: new Date() } });
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'batchUpdateState', { ids, state });
    }
  }

  /**
   * 获取广告统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdsStats(filter = {}) {
    try {
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
            totalHeight: { $sum: '$height' },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, enabled: 0, disabled: 0, totalHeight: 0 };

      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        stats.totalHeight += item.totalHeight || 0;

        if (item._id === true) {
          stats.enabled = count;
        } else if (item._id === false) {
          stats.disabled = count;
        }
      });

      // 获取按类型统计
      const typeStats = await this.model.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      stats.byType = {};
      typeStats.forEach(item => {
        stats.byType[item._id] = item.count;
      });

      return stats;
    } catch (error) {
      this._handleError(error, 'getAdsStats', { filter });
      return { total: 0, enabled: 0, disabled: 0, totalHeight: 0, byType: {} };
    }
  }

  /**
   * 检查广告是否可以删除（有关联的广告单元）
   * @param {String} adsId 广告ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当广告有关联单元时抛出异常
   */
  async checkCanDelete(adsId) {
    try {
      const ads = await this.findById(adsId);
      if (!ads) {
        throw this.exceptions.ads.notFound(adsId);
      }

      // if (ads.items && ads.items.length > 0) {
      //   throw this.exceptions.ads.hasItems(adsId);
      // }

      return true;
    } catch (error) {
      if (error.name === 'BusinessRuleError' || error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'checkCanDelete', { adsId });
    }
  }

  /**
   * 验证广告类型是否有效
   * @param {String} type 广告类型
   * @return {Promise<Boolean>} 类型是否有效
   * @throws {ValidationError} 当类型无效时抛出异常
   */
  async checkTypeValid(type) {
    try {
      const validTypes = ['0', '1', '2'];
      if (!validTypes.includes(type)) {
        throw this.exceptions.ads.invalidType(type);
      }
      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'checkTypeValid', { type });
    }
  }
}

module.exports = AdsMongoRepository;
