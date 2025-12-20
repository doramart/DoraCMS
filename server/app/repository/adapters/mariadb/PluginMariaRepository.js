/**
 * 优化后的 Plugin MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 Plugin 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 Plugin 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 Plugin 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const PluginSchema = require('../../schemas/mariadb/PluginSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class PluginMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Plugin');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
    this.adminModel = null;

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

      // 🔥 修复：使用连接管理器中已建立关联关系的模型
      this.model = this.connection.getModel('Plugin');
      this.adminModel = this.connection.getModel('Admin');

      if (!this.model || !this.adminModel) {
        throw new Error('Plugin 或 Admin 模型未找到，请检查模型加载顺序');
      }

      // 🔥 关联关系现在在Schema中定义，无需手动建立

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          installorInfo: {
            // 关联映射使用实际的别名
            model: this.adminModel,
            type: 'belongsTo',
            foreignKey: 'installor',
            as: 'installorInfo', // 修复命名冲突：使用不同的别名
            select: ['id', 'userName', 'nickName', 'enable', 'date', 'logo'],
          },
        },
      });

      // console.log('✅ PluginMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ PluginMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - Plugin 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.adminModel,
        as: 'installorInfo', // 修复命名冲突：使用不同的别名
        attributes: ['id', 'userName', 'nickName', 'enable', 'date', 'logo'],
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['alias', 'enName', 'name', 'description', 'author'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' },
      { field: 'updatedAt', order: 'desc' },
    ];
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

    // Plugin模块特有的需要排除的字段
    const moduleExcludeFields = [
      'installor', // 关联字段 - 通过关联查询管理
      'stateText', // 虚拟字段 - 计算得出的字段
      'typeText', // 虚拟字段 - 计算得出的字段
      'installed', // 虚拟字段 - 计算得出的字段
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - Plugin 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 🔥 修复API兼容性：将installorInfo映射回installor
    if (item.installorInfo) {
      // 只有当installorInfo有值时才替换
      item.installor = item.installorInfo;
    }
    // 始终删除installorInfo字段，保持API清洁
    delete item.installorInfo;

    // 添加 Plugin 特有的数据处理
    // 处理插件类型文本
    if (item.type) {
      const typeMap = {
        1: '内置插件',
        2: '扩展插件',
        3: '第三方插件',
      };
      item.typeText = typeMap[item.type] || '未知类型';
    }

    // 添加已安装标识
    item.installed = true; // 在数据库中的都是已安装的

    // 处理JSON字段（基类的_deepToJSON已处理，这里做额外处理）
    if (item.hooks && typeof item.hooks === 'string') {
      try {
        item.hooks = JSON.parse(item.hooks);
      } catch (e) {
        item.hooks = [];
      }
    }
    item.hooks = item.hooks || [];

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - Plugin 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 Plugin 特有的创建前处理
    // 设置默认值
    if (typeof data.state === 'undefined') data.state = false;
    if (!data.amount) data.amount = 0;
    if (!data.isadm) data.isadm = '1';
    if (!data.isindex) data.isindex = '0';
    if (!data.type) data.type = '2'; // 默认为扩展插件
    if (!data.authUser) data.authUser = false;
    if (!data.hooks) data.hooks = [];

    // installor字段已经是正确的字段名，无需映射

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Plugin 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // installor字段已经是正确的字段名，无需映射

    return data;
  }

  // ===== 🔥 重写基类方法以处理特殊映射 =====

  /**
   * 🔥 重写find方法，处理installor路径映射
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async find(payload = {}, options = {}) {
    // 预处理populate配置，将installor路径映射到installorInfo
    if (options.populate) {
      options.populate = options.populate.map(config => {
        if (config.path === 'installor') {
          return {
            ...config,
            path: 'installorInfo', // 内部使用installorInfo别名
          };
        }
        return config;
      });
    }

    // 调用基类方法
    return await super.find(payload, options);
  }

  /**
   * 🔥 重写findOne方法，处理installor路径映射
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(query = {}, options = {}) {
    // 预处理populate配置，将installor路径映射到installorInfo
    if (options.populate) {
      options.populate = options.populate.map(config => {
        if (config.path === 'installor') {
          return {
            ...config,
            path: 'installorInfo', // 内部使用installorInfo别名
          };
        }
        return config;
      });
    }

    // 调用基类方法
    return await super.findOne(query, options);
  }

  /**
   * 🔥 重写findById方法，处理installor路径映射
   * @param {String|Number} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findById(id, options = {}) {
    // 预处理populate配置，将installor路径映射到installorInfo
    if (options.populate) {
      options.populate = options.populate.map(config => {
        if (config.path === 'installor') {
          return {
            ...config,
            path: 'installorInfo', // 内部使用installorInfo别名
          };
        }
        return config;
      });
    }

    // 调用基类方法
    return await super.findById(id, options);
  }

  // ===== 🔥 Plugin 特有的业务方法 =====

  /**
   * 根据插件ID查找插件 - 统一异常处理版本
   * @param {String} pluginId 插件源ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByPluginId(pluginId, options = {}) {
    try {
      await this._ensureConnection();
      const filters = { pluginId: { $eq: pluginId }, ...options.filters };
      return await this.findOne(filters, options);
    } catch (error) {
      this._handleError(error, 'findByPluginId', { pluginId, options });
    }
  }

  /**
   * 根据包名查找插件 - 统一异常处理版本
   * @param {String} pkgName 包名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByPkgName(pkgName, options = {}) {
    try {
      await this._ensureConnection();
      const filters = { pkgName: { $eq: pkgName }, ...options.filters };
      return await this.findOne(filters, options);
    } catch (error) {
      this._handleError(error, 'findByPkgName', { pkgName, options });
    }
  }

  /**
   * 根据插件别名查找插件 - 统一异常处理版本
   * @param {String} alias 插件别名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 插件信息
   */
  async findByAlias(alias, options = {}) {
    try {
      await this._ensureConnection();
      const filters = { alias: { $eq: alias }, ...options.filters };
      return await this.findOne(filters, options);
    } catch (error) {
      this._handleError(error, 'findByAlias', { alias, options });
    }
  }

  /**
   * 检查插件是否已安装 - 统一异常处理版本
   * @param {String} pluginId 插件源ID
   * @return {Promise<Boolean>} 是否已安装
   */
  async checkPluginInstalled(pluginId) {
    try {
      // 🔥 确保连接已建立
      await this._ensureConnection();

      // 直接使用简单查询，避免复杂的关联逻辑
      const count = await this.model.count({
        where: { pluginId },
      });

      return count > 0;
    } catch (error) {
      // 🔥 对于检查方法，不抛出错误，只返回false
      console.warn(`[PluginMariaRepository] checkPluginInstalled failed for ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * 🔥 统一异常处理版本：检查插件别名是否唯一 - 必须使用UniqueChecker
   * @param {String} alias 插件别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当别名已存在时抛出异常
   */
  async checkAliasUnique(alias, excludeId = null) {
    try {
      // 🔥 使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
      const isUnique = await UniqueChecker.checkPluginAliasUnique(this, alias, excludeId);
      if (!isUnique) {
        throw this.exceptions.plugin.aliasExists(alias);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkAliasUnique', { alias, excludeId });
    }
  }

  /**
   * 🔥 统一异常处理版本：检查包名是否唯一 - 必须使用UniqueChecker
   * @param {String} pkgName 包名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当包名已存在时抛出异常
   */
  async checkPkgNameUnique(pkgName, excludeId = null) {
    try {
      // 🔥 使用UniqueChecker统一处理唯一性验证，自动兼容MongoDB/MariaDB
      const isUnique = await UniqueChecker.checkPluginPkgNameUnique(this, pkgName, excludeId);
      if (!isUnique) {
        throw this.exceptions.plugin.pkgNameExists(pkgName);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkPkgNameUnique', { pkgName, excludeId });
    }
  }

  /**
   * 根据安装者查找插件
   * @param {String} installorId 安装者ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 插件列表
   */
  async findByInstallor(installorId, options = {}) {
    try {
      await this._ensureConnection();
      const filters = { installor: { $eq: installorId }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByInstallor', { installorId, options });
    }
  }

  /**
   * 根据插件类型查找插件
   * @param {String} type 插件类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 插件列表
   */
  async findByType(type, options = {}) {
    try {
      await this._ensureConnection();
      const filters = { type: { $eq: type }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByType', { type, options });
    }
  }

  /**
   * 获取启用的插件列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的插件列表
   */
  async findEnabledPlugins(options = {}) {
    try {
      await this._ensureConnection();
      const filters = { state: { $eq: true }, ...options.filters };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findEnabledPlugins', { options });
    }
  }

  /**
   * 批量更新插件状态
   * @param {Array} pluginIds 插件ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(pluginIds, state) {
    try {
      await this._ensureConnection();
      // 转换ID格式
      const mariadbIds = Array.isArray(pluginIds)
        ? pluginIds.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: pluginIds }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const [result] = await this.model.update({ state, updatedAt: new Date() }, { where: whereCondition });

      this._logOperation('batchUpdateState', { pluginIds, state }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'batchUpdateState', { pluginIds, state });
    }
  }

  /**
   * 获取插件统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getPluginStats(filter = {}) {
    try {
      await this._ensureConnection();
      const enabledCount = await this.model.count({ where: { ...filter, state: true } });
      const disabledCount = await this.model.count({ where: { ...filter, state: false } });
      const totalCount = enabledCount + disabledCount;

      const stats = {
        total: totalCount,
        enabled: enabledCount,
        disabled: disabledCount,
      };

      this._logOperation('getPluginStats', { filter }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getPluginStats', { filter });
      return { total: 0, enabled: 0, disabled: 0 };
    }
  }

  /**
   * 根据插件类型获取统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 类型统计信息
   */
  async getPluginTypeStats(filter = {}) {
    try {
      await this._ensureConnection();
      const builtinCount = await this.model.count({ where: { ...filter, type: '1' } });
      const extensionCount = await this.model.count({ where: { ...filter, type: '2' } });
      const thirdPartyCount = await this.model.count({ where: { ...filter, type: '3' } });
      const totalCount = builtinCount + extensionCount + thirdPartyCount;

      const stats = {
        total: totalCount,
        builtin: builtinCount,
        extension: extensionCount,
        thirdParty: thirdPartyCount,
      };

      this._logOperation('getPluginTypeStats', { filter }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getPluginTypeStats', { filter });
      return { total: 0, builtin: 0, extension: 0, thirdParty: 0 };
    }
  }

  // ===== 辅助方法 =====
}

module.exports = PluginMariaRepository;
