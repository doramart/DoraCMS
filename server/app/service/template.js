/**
 * Template Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class TemplateService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Template Repository
    this.repository = this.repositoryFactory.createTemplateRepository(ctx);
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
    // 🔥 Phase2扩展：Repository层会自动验证唯一性并抛出UniqueConstraintError
    // 无需在Service层重复检查
    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    // 🔥 Phase2扩展：Repository层会自动验证唯一性（排除当前ID）并抛出UniqueConstraintError
    // 无需在Service层重复检查
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

  // ===== Template 特有的业务方法 =====

  /**
   * 检查主题标识符唯一性
   * @param {String} slug 主题标识符
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkSlugUnique(slug, excludeId = null) {
    return await this.repository.checkSlugUnique(slug, excludeId);
  }

  /**
   * 检查主题名称是否唯一
   * @param {String} name 主题名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkNameUnique(name, excludeId = null) {
    return await this.repository.checkNameUnique(name, excludeId);
  }

  /**
   * 获取当前激活的主题
   * @return {Promise<Object|null>} 激活的主题
   */
  async getActiveTheme() {
    return await this.repository.getActiveTheme();
  }

  /**
   * 激活指定主题
   * @param {String} themeId 主题ID
   * @param {String} operatorId 操作用户ID
   * @return {Promise<Object>} 激活的主题
   */
  async activateTheme(themeId, operatorId = null) {
    return await this.repository.activateTheme(themeId, operatorId);
  }

  /**
   * 停用指定主题
   * @param {String} themeId 主题ID
   * @param {String} operatorId 操作用户ID
   * @return {Promise<Object>} 停用的主题
   */
  async deactivateTheme(themeId, operatorId = null) {
    return await this.repository.deactivateTheme(themeId, operatorId);
  }

  /**
   * 根据slug查找主题
   * @param {String} slug 主题标识符
   * @return {Promise<Object|null>} 主题对象
   */
  async findBySlug(slug) {
    return await this.repository.findBySlug(slug);
  }

  /**
   * 获取已安装的主题列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 已安装的主题列表
   */
  async getInstalledThemes(options = {}) {
    return await this.repository.getInstalledThemes(options);
  }

  /**
   * 检查主题文件是否存在
   * @param {String} slug 主题标识符
   * @return {Promise<Object>} 文件检查结果
   */
  async checkThemeFiles(slug) {
    return await this.repository.checkThemeFiles(slug);
  }

  /**
   * 获取主题的模板文件列表
   * @param {String} slug 主题标识符
   * @return {Promise<Object>} 模板文件列表
   */
  async getThemeTemplates(slug) {
    return await this.repository.getThemeTemplates(slug);
  }

  /**
   * 更新主题统计信息
   * @param {String} themeId 主题ID
   * @param {Object} statsUpdate 统计信息更新
   * @return {Promise<Object>} 更新后的主题
   */
  async updateStats(themeId, statsUpdate) {
    return await this.repository.updateStats(themeId, statsUpdate);
  }

  /**
   * 批量更新主题状态
   * @param {Array} themeIds 主题ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(themeIds, status) {
    return await this.repository.batchUpdateStatus(themeIds, status);
  }

  /**
   * 获取主题统计信息
   * @param {Object} filters 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getTemplateStats(filters = {}) {
    return await this.repository.getTemplateStats(filters);
  }

  /**
   * 根据商店模板ID列表查询已安装的模板
   * @param {Array} marketIds 商店模板ID数组
   * @return {Promise<Array>} 已安装模板的 marketId 列表
   */
  async getInstalledMarketIds(marketIds) {
    if (!marketIds || marketIds.length === 0) {
      return [];
    }

    // 使用 find 方法查询，不分页获取所有匹配记录
    const result = await this.repository.find(
      {
        isPaging: '0', // 不分页
        marketId: { $in: marketIds },
      },
      {
        fields: 'marketId',
      }
    );

    // find 方法可能返回分页对象或数组，需要处理
    const templates = Array.isArray(result) ? result : result.list || result.docs || [];

    return templates.map(t => t.marketId).filter(Boolean);
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

module.exports = TemplateService;
