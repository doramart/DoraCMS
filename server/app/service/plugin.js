/**
 * Plugin Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class PluginService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Plugin Repository
    this.repository = this.repositoryFactory.createPluginRepository(ctx);
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
    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
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
   * 删除记录（兼容旧版本方法名）
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async removes(ids, key = 'id') {
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

  /**
   * 获取单条记录（兼容旧版本方法名）
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async item(options = {}) {
    const { query = {} } = options;
    return await this.repository.findOne(query, options);
  }

  // ===== 🔥 Plugin 特有的业务方法 =====

  /**
   * 根据插件ID查找插件
   * @param {String} pluginId 插件源ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByPluginId(pluginId, options = {}) {
    return await this.repository.findByPluginId(pluginId, options);
  }

  /**
   * 根据包名查找插件
   * @param {String} pkgName 包名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByPkgName(pkgName, options = {}) {
    return await this.repository.findByPkgName(pkgName, options);
  }

  /**
   * 根据插件别名查找插件
   * @param {String} alias 插件别名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByAlias(alias, options = {}) {
    return await this.repository.findByAlias(alias, options);
  }

  /**
   * 检查插件是否已安装
   * @param {String} pluginId 插件源ID
   * @return {Promise<Boolean>} 是否已安装
   */
  async checkPluginInstalled(pluginId) {
    return await this.repository.checkPluginInstalled(pluginId);
  }

  /**
   * 检查插件别名是否唯一
   * @param {String} alias 插件别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkAliasUnique(alias, excludeId = null) {
    return await this.repository.checkAliasUnique(alias, excludeId);
  }

  /**
   * 检查包名是否唯一
   * @param {String} pkgName 包名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkPkgNameUnique(pkgName, excludeId = null) {
    return await this.repository.checkPkgNameUnique(pkgName, excludeId);
  }

  /**
   * 根据安装者查找插件
   * @param {String} installorId 安装者ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 插件列表
   */
  async findByInstallor(installorId, options = {}) {
    return await this.repository.findByInstallor(installorId, options);
  }

  /**
   * 根据插件类型查找插件
   * @param {String} type 插件类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 插件列表
   */
  async findByType(type, options = {}) {
    return await this.repository.findByType(type, options);
  }

  /**
   * 获取启用的插件列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的插件列表
   */
  async findEnabledPlugins(options = {}) {
    return await this.repository.findEnabledPlugins(options);
  }

  /**
   * 批量更新插件状态
   * @param {Array} pluginIds 插件ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(pluginIds, state) {
    return await this.repository.batchUpdateState(pluginIds, state);
  }

  /**
   * 获取插件统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getPluginStats(filter = {}) {
    return await this.repository.getPluginStats(filter);
  }

  /**
   * 根据插件类型获取统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 类型统计信息
   */
  async getPluginTypeStats(filter = {}) {
    return await this.repository.getPluginTypeStats(filter);
  }

  // ===== 🔥 插件生命周期管理方法 =====

  /**
   * 启用插件
   * @param {String} pluginId 插件ID
   * @return {Promise<Object>} 更新结果
   */
  async enablePlugin(pluginId) {
    return await this.repository.update(pluginId, { state: true });
  }

  /**
   * 禁用插件
   * @param {String} pluginId 插件ID
   * @return {Promise<Object>} 更新结果
   */
  async disablePlugin(pluginId) {
    return await this.repository.update(pluginId, { state: false });
  }

  /**
   * 切换插件状态
   * @param {String} pluginId 插件ID
   * @return {Promise<Object>} 更新结果
   */
  async togglePluginState(pluginId) {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw this.app.exceptions.plugin.notFound(pluginId);
    }

    const newState = !plugin.state;
    return await this.repository.update(pluginId, { state: newState });
  }

  // ===== 🔥 插件查询辅助方法 =====

  /**
   * 获取管理后台插件列表（有isadm='1'的插件）
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 管理后台插件列表
   */
  async findAdminPlugins(options = {}) {
    const filters = {
      isadm: { $eq: '1' },
      state: { $eq: true },
      ...options.filters,
    };
    return await this.repository.find({}, { ...options, filters });
  }

  /**
   * 获取前台插件列表（有isindex='1'的插件）
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 前台插件列表
   */
  async findIndexPlugins(options = {}) {
    const filters = {
      isindex: { $eq: '1' },
      state: { $eq: true },
      ...options.filters,
    };
    return await this.repository.find({}, { ...options, filters });
  }

  /**
   * 获取需要用户认证的插件列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 需要认证的插件列表
   */
  async findAuthRequiredPlugins(options = {}) {
    const filters = {
      authUser: { $eq: true },
      state: { $eq: true },
      ...options.filters,
    };
    return await this.repository.find({}, { ...options, filters });
  }

  /**
   * 根据钩子类型查找插件
   * @param {String} hookType 钩子类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 包含指定钩子的插件列表
   */
  async findPluginsByHook(hookType, options = {}) {
    const filters = {
      hooks: { $in: [hookType] },
      state: { $eq: true },
      ...options.filters,
    };
    return await this.repository.find({}, { ...options, filters });
  }

  // ===== 🔥 插件验证方法 =====

  /**
   * 验证插件数据
   * @param {Object} pluginData 插件数据
   * @param {String} operation 操作类型 ('create' | 'update')
   * @return {Promise<Boolean>} 验证结果
   */
  async validatePluginData(pluginData, operation = 'create') {
    // 基础验证
    if (!pluginData.name && !pluginData.alias) {
      throw this.app.exceptions.plugin.nameRequired();
    }

    if (pluginData.alias) {
      await this.checkAliasUnique(pluginData.alias, operation === 'update' ? pluginData.id : null);
    }

    if (pluginData.pkgName) {
      await this.checkPkgNameUnique(pluginData.pkgName, operation === 'update' ? pluginData.id : null);
    }

    // 类型验证
    if (pluginData.type && !['1', '2', '3'].includes(pluginData.type)) {
      throw this.app.exceptions.plugin.typeInvalid(pluginData.type);
    }

    // 价格验证
    if (pluginData.amount !== undefined && pluginData.amount < 0) {
      throw this.app.exceptions.plugin.amountInvalid(pluginData.amount);
    }

    return true;
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

module.exports = PluginService;
