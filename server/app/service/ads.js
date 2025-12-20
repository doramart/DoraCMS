/**
 * Ads Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class AdsService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Ads Repository
    this.repository = this.repositoryFactory.createAdsRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    return await this.repository.find(payload, options);
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
    // 🔥 业务验证：检查广告名称唯一性（自动抛出异常）
    if (data.name) {
      await this.repository.checkNameUnique(data.name);
    }

    // 🔥 业务验证：检查广告类型有效性
    if (data.type) {
      await this.repository.checkTypeValid(data.type);
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
    // 🔥 业务验证：检查广告名称唯一性（更新时排除当前记录）
    if (data.name) {
      await this.repository.checkNameUnique(data.name, id);
    }

    // 🔥 业务验证：检查广告类型有效性
    if (data.type) {
      await this.repository.checkTypeValid(data.type);
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
    // 🔥 业务验证：检查广告是否可以删除
    const idArray = Array.isArray(ids) ? ids : [ids];
    for (const id of idArray) {
      await this.repository.checkCanDelete(id);
    }

    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { state: false }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // 🔥 业务特有方法

  /**
   * 检查广告名称唯一性
   * @param {String} name 广告名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkNameUnique(name, excludeId = null) {
    return await this.repository.checkNameUnique(name, excludeId);
  }

  /**
   * 根据状态查找广告
   * @param {Boolean} state 广告状态
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByState(state, options = {}) {
    return await this.repository.findByState(state, options);
  }

  /**
   * 根据类型查找广告
   * @param {String} type 广告类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByType(type, options = {}) {
    return await this.repository.findByType(type, options);
  }

  /**
   * 获取启用的广告
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的广告列表
   */
  async findEnabledAds(options = {}) {
    return await this.repository.findEnabledAds(options);
  }

  /**
   * 根据广告单元ID查找包含该单元的广告
   * @param {String|Array} itemIds 广告单元ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告列表
   */
  async findByItems(itemIds, options = {}) {
    return await this.repository.findByItems(itemIds, options);
  }

  /**
   * 批量更新广告状态
   * @param {Array} ids ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(ids, state) {
    return await this.repository.batchUpdateState(ids, state);
  }

  /**
   * 获取广告统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdsStats(filter = {}) {
    return await this.repository.getAdsStats(filter);
  }

  /**
   * 兼容旧的 API 方法 - item 方法
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async item(options = {}) {
    const { query = {}, populate = [], files = null } = options;
    return await this.repository.findOne(query, { populate, fields: files });
  }

  /**
   * 兼容旧的 API 方法 - removes 方法
   * @param {String} ids 要删除的ID字符串（逗号分隔）
   * @return {Promise<Object>} 删除结果
   */
  async removes(ids) {
    return await this.repository.remove(ids);
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  /**
   * 🚀 模板标签专用：根据名称获取广告
   * @param {String} name 广告名称
   * @return {Promise<Object|null>} 广告信息
   */
  async getAdsByNameForTemplate(name) {
    if (!name) {
      return null;
    }

    const cacheKey = `ads_by_name:${name}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          name: { $eq: name },
          state: { $eq: true },
        };

        const options = {
          filters,
          populate: [
            {
              path: 'items',
              select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
            },
          ],
        };

        return await this.findOne(filters, options);
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 获取广告位列表（按类型）
   * @param {String} type 广告类型
   * @return {Promise<Array>} 广告列表
   */
  async getAdsByTypeForTemplate(type) {
    if (!type) {
      return [];
    }

    const cacheKey = `ads_by_type:${type}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          type: { $eq: type },
          state: { $eq: true },
        };

        const options = {
          filters,
          populate: [
            {
              path: 'items',
              select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
            },
          ],
          sort: [{ field: 'sortId', order: 'asc' }],
        };

        const result = await this.find({ isPaging: '0' }, options);
        return Array.isArray(result) ? result : result.docs || [];
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 获取随机广告
   * @param {Number} limit 数量限制
   * @param {String} type 广告类型（可选）
   * @return {Promise<Array>} 随机广告列表
   */
  async getRandomAdsForTemplate(limit = 5, type = null) {
    const cacheKey = `random_ads:${limit}:${type || 'all'}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          state: { $eq: true },
        };

        if (type) {
          filters.type = { $eq: type };
        }

        const options = {
          filters,
          populate: [
            {
              path: 'items',
              select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
            },
          ],
        };

        const result = await this.find({ isPaging: '0' }, options);
        const allAds = Array.isArray(result) ? result : result.docs || [];

        // 随机排序并取指定数量
        const shuffled = allAds.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);
      },
      300
    ); // 5分钟缓存（随机广告缓存时间较短）
  }

  /**
   * 🚀 批量获取广告信息
   * @param {Array} adsIds 广告ID数组
   * @return {Promise<Array>} 广告信息数组
   */
  async batchGetAdsByIds(adsIds = []) {
    if (!Array.isArray(adsIds) || adsIds.length === 0) {
      return [];
    }

    const cacheKey = `batch_ads:${adsIds.sort().join(',')}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          id: { $in: adsIds },
          state: { $eq: true },
        };

        const options = {
          filters,
          populate: [
            {
              path: 'items',
              select: ['title', 'link', 'sImg', 'alt', 'width', 'height', 'target', 'appLink', 'appLinkType'],
            },
          ],
        };

        const result = await this.find({ isPaging: '0' }, options);
        return Array.isArray(result) ? result : result.docs || [];
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 获取广告统计信息（包含展示和点击数据）
   * @param {String} adsId 广告ID
   * @return {Promise<Object|null>} 统计信息
   */
  async getAdsStatsForTemplate(adsId) {
    if (!adsId) {
      return null;
    }

    const cacheKey = `ads_stats:${adsId}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const ads = await this.findOne({ id: { $eq: adsId } });

        if (!ads) {
          return null;
        }

        // 这里可以添加统计逻辑，比如展示次数、点击次数等
        // 目前返回基本信息
        return {
          ...ads,
          viewCount: 0, // 可以从统计表获取
          clickCount: 0, // 可以从统计表获取
          ctr: 0, // 点击率
        };
      },
      600
    ); // 10分钟缓存
  }

  /**
   * 🚀 清除广告相关缓存
   * @param {String} adsId 广告ID（可选）
   * @param {String} name 广告名称（可选）
   * @return {Promise<boolean>} 是否成功
   */
  async clearAdsCache(adsId = null, name = null) {
    try {
      const cacheKeys = ['template:ads'];

      if (adsId) {
        cacheKeys.push(`ads_stats:${adsId}`);
        cacheKeys.push(`batch_ads:*${adsId}*`);
      }

      if (name) {
        cacheKeys.push(`ads_by_name:${name}`);
      }

      // 清除类型相关的缓存（这里简化处理）
      cacheKeys.push('ads_by_type:*');
      cacheKeys.push('random_ads:*');

      const deletePromises = cacheKeys.map(key => {
        if (key.includes('*')) {
          // 对于包含通配符的键，需要特殊处理
          return Promise.resolve();
        }
        return this.ctx.app.cache.delete(key);
      });

      await Promise.all(deletePromises);

      this.ctx.logger.info(`[AdsService] Cleared ads cache for: ${adsId || name || 'all'}`);
      return true;
    } catch (error) {
      this.ctx.logger.error('[AdsService] clearAdsCache error:', error);
      return false;
    }
  }

  /**
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }
}

module.exports = AdsService;
