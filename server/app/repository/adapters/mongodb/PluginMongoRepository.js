/**
 * 标准化的 Plugin MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class PluginMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Plugin');

    // 设置 MongoDB 模型
    this.model = this.app.model.Plugin;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // 定义关联关系 - installor 与 admin 的关联
        installor: {
          model: this.app.model.Admin,
          path: 'installor',
          select: ['userName', 'nickName', '_id', 'enable', 'date', 'logo'],
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
    return [{ path: 'installor', select: ['userName', 'nickName', '_id', 'enable', 'date', 'logo'] }];
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
   * 重写状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.BOOLEAN_STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加业务特定的数据处理
    // 处理插件状态文本
    if (typeof item.state === 'boolean') {
      item.stateText = item.state ? '启用' : '禁用';
    }

    // 处理插件类型文本
    if (item.type) {
      const typeMap = {
        1: '内置插件',
        2: '扩展插件',
        3: '第三方插件',
      };
      item.typeText = typeMap[item.type] || '未知类型';
    }

    // 处理JSON字段
    if (item.adminUrl && typeof item.adminUrl === 'string') {
      try {
        item.adminUrl = JSON.parse(item.adminUrl);
      } catch (e) {
        item.adminUrl = null;
      }
    }

    if (item.adminApi && typeof item.adminApi === 'string') {
      try {
        item.adminApi = JSON.parse(item.adminApi);
      } catch (e) {
        item.adminApi = null;
      }
    }

    if (item.fontApi && typeof item.fontApi === 'string') {
      try {
        item.fontApi = JSON.parse(item.fontApi);
      } catch (e) {
        item.fontApi = null;
      }
    }

    // 处理钩子数组
    item.hooks = item.hooks || [];

    // 添加是否已安装标识
    item.installed = true; // 在数据库中的都是已安装的

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加业务特定的创建前处理
    // 设置默认值
    if (typeof data.state === 'undefined') data.state = false;
    if (!data.amount) data.amount = 0;
    if (!data.isadm) data.isadm = '1';
    if (!data.isindex) data.isindex = '0';
    if (!data.type) data.type = '2'; // 默认为扩展插件
    if (!data.authUser) data.authUser = false;
    if (!data.hooks) data.hooks = [];

    // 确保JSON字段格式正确
    if (data.adminUrl && typeof data.adminUrl === 'object') {
      data.adminUrl = data.adminUrl;
    }
    if (data.adminApi && typeof data.adminApi === 'object') {
      data.adminApi = data.adminApi;
    }
    if (data.fontApi && typeof data.fontApi === 'object') {
      data.fontApi = data.fontApi;
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加业务特定的更新前处理
    // 确保JSON字段格式正确
    if (data.adminUrl && typeof data.adminUrl === 'object') {
      data.adminUrl = data.adminUrl;
    }
    if (data.adminApi && typeof data.adminApi === 'object') {
      data.adminApi = data.adminApi;
    }
    if (data.fontApi && typeof data.fontApi === 'object') {
      data.fontApi = data.fontApi;
    }

    return data;
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
      const plugin = await this.findByPluginId(pluginId);
      return !!plugin;
    } catch (error) {
      this._handleError(error, 'checkPluginInstalled', { pluginId });
      return false;
    }
  }

  /**
   * 检查插件别名是否唯一 - 统一异常处理版本
   * @param {String} alias 插件别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当别名已存在时抛出异常
   */
  async checkAliasUnique(alias, excludeId = null) {
    try {
      // 🔥 使用UniqueChecker统一处理唯一性验证
      const isUnique = await this._checkFieldUnique('alias', alias, excludeId);
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
   * 检查包名是否唯一 - 统一异常处理版本
   * @param {String} pkgName 包名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当包名已存在时抛出异常
   */
  async checkPkgNameUnique(pkgName, excludeId = null) {
    try {
      // 🔥 使用UniqueChecker统一处理唯一性验证
      const isUnique = await this._checkFieldUnique('pkgName', pkgName, excludeId);
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
      const idArray = Array.isArray(pluginIds) ? pluginIds : [pluginIds];
      const result = await this.model.updateMany({ _id: { $in: idArray } }, { $set: { state, updatedAt: new Date() } });
      this._logOperation('batchUpdateState', { pluginIds, state }, result);
      return { modifiedCount: result.modifiedCount };
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
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
          },
        },
      ];
      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, enabled: 0, disabled: 0 };
      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        if (item._id === true) {
          stats.enabled = count;
        } else if (item._id === false) {
          stats.disabled = count;
        }
      });
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
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ];
      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, builtin: 0, extension: 0, thirdParty: 0 };
      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        switch (item._id) {
          case '1':
            stats.builtin = count;
            break;
          case '2':
            stats.extension = count;
            break;
          case '3':
            stats.thirdParty = count;
            break;
        }
      });
      this._logOperation('getPluginTypeStats', { filter }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getPluginTypeStats', { filter });
      return { total: 0, builtin: 0, extension: 0, thirdParty: 0 };
    }
  }

  /**
   * 私有方法：检查字段唯一性
   * @param {String} field 字段名
   * @param {*} value 字段值
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   * @private
   */
  async _checkFieldUnique(field, value, excludeId = null) {
    const query = { [field]: { $eq: value } };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const result = await this.findOne(query);
    return !result;
  }
}

module.exports = PluginMongoRepository;
