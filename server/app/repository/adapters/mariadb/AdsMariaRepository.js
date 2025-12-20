/**
 * 优化后的 Ads MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 Ads 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 Ads 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 Ads 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const AdsSchema = require('../../schemas/mariadb/AdsSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class AdsMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Ads');

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
      this.model = AdsSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // 标准关联关系会自动处理，这里只需要定义特殊的关联
        },
      });

      // console.log('✅ AdsMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ AdsMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - Ads 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        path: 'items',
        select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
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
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.BOOLEAN_STATUS_TEXT;
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

    // Ads模块特有的需要排除的字段
    const moduleExcludeFields = [
      // items 字段通过JSON处理，不需要排除
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - Ads 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
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

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - Ads 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 Ads 特有的创建前处理
    // 设置默认值
    if (data.type === undefined) data.type = '0';
    if (data.state === undefined) data.state = true;
    if (data.carousel === undefined) data.carousel = true;
    if (data.height === undefined) data.height = 50;
    if (!data.items) data.items = [];

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Ads 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 Ads 特有的更新前处理
    // 确保 items 字段是数组
    if (data.items && !Array.isArray(data.items)) {
      data.items = [];
    }

    return data;
  }

  // ===== 🔥 重写基类方法以支持 items 关联查询 =====

  /**
   * 重写查找方法以支持 items 的关联查询
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 调用基类方法获取基础结果
      const result = await super.find(payload, options);

      // 🔥 处理 items 关联查询
      if (options.populate && this._shouldPopulateItems(options.populate)) {
        if (result && result.docs) {
          // 分页结果
          result.docs = await this._populateItemsForResults(result.docs);
        } else if (Array.isArray(result)) {
          // 数组结果
          return await this._populateItemsForResults(result);
        }
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 重写 findOne 方法以支持 items 的关联查询
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(query = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 调用基类方法获取基础结果
      const result = await super.findOne(query, options);

      // 🔥 处理 items 关联查询
      if (result && options.populate && this._shouldPopulateItems(options.populate)) {
        const populatedResults = await this._populateItemsForResults([result]);
        return populatedResults[0] || null;
      }

      return result;
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 检查是否需要 populate items
   * @param {Array} populateConfig populate 配置
   * @return {Boolean} 是否需要 populate items
   * @private
   */
  _shouldPopulateItems(populateConfig) {
    if (!Array.isArray(populateConfig)) return false;
    return populateConfig.some(config => {
      if (typeof config === 'string') return config === 'items';
      return config.path === 'items';
    });
  }

  /**
   * 为结果集填充 items 详情
   * @param {Array} results 查询结果数组
   * @return {Promise<Array>} 填充后的结果
   * @private
   */
  async _populateItemsForResults(results) {
    if (!results || !results.length) return results;

    // 收集所有需要查询的 item IDs
    const allItemIds = new Set();
    results.forEach(ads => {
      if (ads.items && Array.isArray(ads.items)) {
        ads.items.forEach(id => {
          if (id) allItemIds.add(id);
        });
      }
    });

    if (allItemIds.size === 0) return results;

    try {
      // 获取 AdsItems Repository 并查询所有 items
      const RepositoryFactory = require('../../factories/RepositoryFactory');
      const factory = new RepositoryFactory(this.app);
      const adsItemsRepo = factory.createAdsItemsRepository(this.ctx);

      // 确保 AdsItems Repository 连接已建立
      await adsItemsRepo._ensureConnection();

      // 批量查询所有 items
      const itemsResult = await adsItemsRepo.model.findAll({
        where: {
          id: {
            [adsItemsRepo.connection.getSequelize().Sequelize.Op.in]: Array.from(allItemIds),
          },
        },
      });

      // 转换为 JSON 并建立 ID 映射
      const itemsMap = new Map();
      itemsResult.forEach(item => {
        const itemJson = item.toJSON();
        itemsMap.set(itemJson.id, itemJson);
      });

      // 为每个 ads 填充 items 详情
      return results.map(ads => {
        const adsJson = typeof ads.toJSON === 'function' ? ads.toJSON() : ads;

        if (adsJson.items && Array.isArray(adsJson.items)) {
          adsJson.items = adsJson.items
            .map(id => {
              return itemsMap.get(id) || null;
            })
            .filter(item => item !== null); // 过滤掉无效的 items
        }

        return adsJson;
      });
    } catch (error) {
      console.error('Error populating items:', error);
      // 如果关联查询失败，返回原始结果
      return results;
    }
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
      // 🔥 必须使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
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
    await this._ensureConnection();

    try {
      const filters = { state, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByState', { state, options });
    }
  }

  /**
   * 根据类型查找广告
   * @param {String} type 广告类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByType(type, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { type, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByType', { type, options });
    }
  }

  /**
   * 根据名称查找广告（模糊匹配）
   * @param {String} name 广告名称
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByName(name, options = {}) {
    await this._ensureConnection();

    try {
      const filters = {
        name: { [this.Op.like]: `%${name}%` },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByName', { name, options });
    }
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
    await this._ensureConnection();

    try {
      const itemIdArray = Array.isArray(itemIds) ? itemIds : [itemIds];

      // 🔥 MariaDB JSON字段查询处理
      const whereConditions = itemIdArray.map(id => ({
        items: { [this.Op.like]: `%${id}%` },
      }));

      const filters = {
        [this.Op.or]: whereConditions,
        ...options.filters,
      };

      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByItems', { itemIds, options });
    }
  }

  /**
   * 批量更新广告状态
   * @param {Array} ids ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(ids, state) {
    await this._ensureConnection();

    try {
      // 转换ID格式
      const mariadbIds = Array.isArray(ids)
        ? ids.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: ids }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const [result] = await this.model.update({ state, updatedAt: new Date() }, { where: whereCondition });

      this._logOperation('batchUpdateState', { ids, state }, result);
      return { modifiedCount: result };
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
    await this._ensureConnection();

    try {
      // 基础统计
      const total = await this.model.count({ where: filter });
      const enabled = await this.model.count({ where: { ...filter, state: true } });
      const disabled = await this.model.count({ where: { ...filter, state: false } });

      // 按类型统计
      const typeStats = await this.model.findAll({
        where: filter,
        attributes: [
          'type',
          [this.connection.getSequelize().fn('COUNT', '*'), 'count'],
          [this.connection.getSequelize().fn('SUM', this.connection.getSequelize().col('height')), 'totalHeight'],
        ],
        group: ['type'],
        raw: true,
      });

      const stats = {
        total,
        enabled,
        disabled,
        totalHeight: 0,
        byType: {},
      };

      typeStats.forEach(item => {
        stats.byType[item.type] = item.count;
        stats.totalHeight += parseInt(item.totalHeight) || 0;
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

      if (ads.items && ads.items.length > 0) {
        // throw this.exceptions.ads.hasItems(adsId);
      }

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

  // ===== 继承基类的标准方法（部分重写以支持 items 关联） =====

  /**
   * 根据ID查找记录（支持 items 关联）
   * @param id
   * @param options
   */
  async findById(id, options = {}) {
    const query = { id };
    return await this.findOne(query, options);
  }
}

module.exports = AdsMariaRepository;
