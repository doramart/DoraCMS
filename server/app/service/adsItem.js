/**
 * AdsItems Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class AdsItemsService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 AdsItems Repository
    this.repository = this.repositoryFactory.createAdsItemsRepository(ctx);
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
    // 🔥 业务验证：检查链接格式
    if (data.link) {
      await this.repository.checkLinkValid(data.link);
    }

    // 🔥 业务验证：检查target值
    if (data.target) {
      await this.repository.checkTargetValid(data.target);
    }

    // 🔥 业务验证：检查尺寸
    if (data.width || data.height) {
      await this.repository.checkDimensionsValid(data.width, data.height);
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
    // 🔥 业务验证：检查链接格式
    if (data.link !== undefined) {
      await this.repository.checkLinkValid(data.link);
    }

    // 🔥 业务验证：检查target值
    if (data.target) {
      await this.repository.checkTargetValid(data.target);
    }

    // 🔥 业务验证：检查尺寸
    if (data.width !== undefined || data.height !== undefined) {
      await this.repository.checkDimensionsValid(data.width, data.height);
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
  async safeDelete(ids, updateObj = { status: 'disabled' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // 🔥 业务特有方法

  /**
   * 根据标题查找广告单元（模糊匹配）
   * @param {String} title 标题
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByTitle(title, options = {}) {
    return await this.repository.findByTitle(title, options);
  }

  /**
   * 根据链接查找广告单元
   * @param {String} link 链接
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByLink(link, options = {}) {
    return await this.repository.findByLink(link, options);
  }

  /**
   * 根据链接打开方式查找广告单元
   * @param {String} target 链接打开方式
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByTarget(target, options = {}) {
    return await this.repository.findByTarget(target, options);
  }

  /**
   * 查找有图片的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有图片的广告单元列表
   */
  async findWithImages(options = {}) {
    return await this.repository.findWithImages(options);
  }

  /**
   * 查找有链接的广告单元
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 有链接的广告单元列表
   */
  async findWithLinks(options = {}) {
    return await this.repository.findWithLinks(options);
  }

  /**
   * 根据APP链接类型查找广告单元
   * @param {String} appLinkType APP链接类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 广告单元列表
   */
  async findByAppLinkType(appLinkType, options = {}) {
    return await this.repository.findByAppLinkType(appLinkType, options);
  }

  /**
   * 获取广告单元统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getAdsItemsStats(filter = {}) {
    return await this.repository.getAdsItemsStats(filter);
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
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }
}

module.exports = AdsItemsService;
