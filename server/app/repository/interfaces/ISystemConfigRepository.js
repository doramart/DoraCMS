/**
 * SystemConfig Repository 接口定义
 * 定义 SystemConfig 相关的数据操作接口
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

/**
 * SystemConfig Repository 接口
 * 继承基础 Repository 接口，并扩展 SystemConfig 特有的方法
 */
class ISystemConfigRepository extends IBaseRepository {
  /**
   * 检查配置键是否存在
   * @param {String} key 配置键
   * @param {String} excludeId 排除的记录ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   * @abstract
   */
  async checkKeyExists(key, excludeId = null) {
    throw new Error('Method checkKeyExists must be implemented');
  }

  /**
   * 根据配置键批量查询配置值
   * @param {Array} keys 配置键数组
   * @return {Promise<Object>} 键值对对象
   * @abstract
   */
  async findByKeys(keys) {
    throw new Error('Method findByKeys must be implemented');
  }

  /**
   * 根据配置键查找单个配置
   * @param {String} key 配置键
   * @return {Promise<Object|null>} 配置对象
   * @abstract
   */
  async findByKey(key) {
    throw new Error('Method findByKey must be implemented');
  }

  /**
   * 获取所有公开的配置
   * @return {Promise<Array>} 公开配置列表
   * @abstract
   */
  async getPublicConfigs() {
    throw new Error('Method getPublicConfigs must be implemented');
  }

  /**
   * 根据键设置配置值（如果不存在则创建，存在则更新）
   * @param {String} key 配置键
   * @param {*} value 配置值
   * @param {String} type 配置类型
   * @param {Boolean} isPublic 是否公开
   * @return {Promise<Object>} 配置对象
   * @abstract
   */
  async upsertByKey(key, value, type = 'string', isPublic = false) {
    throw new Error('Method upsertByKey must be implemented');
  }

  /**
   * 批量设置配置
   * @param {Array} configs 配置数组 [{key, value, type, public}]
   * @return {Promise<Array>} 处理结果数组
   * @abstract
   */
  async setBatchConfigs(configs) {
    throw new Error('Method setBatchConfigs must be implemented');
  }

  /**
   * 简化的设置配置值方法
   * @param {String} key 配置键
   * @param {*} value 配置值
   * @param {String} type 配置类型
   * @return {Promise<Object>} 配置对象
   * @abstract
   */
  async setValue(key, value, type = 'string') {
    throw new Error('Method setValue must be implemented');
  }

  /**
   * 简化的获取配置值方法
   * @param {String} key 配置键
   * @param {*} defaultValue 默认值
   * @return {Promise<*>} 配置值
   * @abstract
   */
  async getValue(key, defaultValue = null) {
    throw new Error('Method getValue must be implemented');
  }

  /**
   * 批量获取配置值
   * @param {Array} keys 配置键数组
   * @param {Object} defaults 默认值对象
   * @return {Promise<Object>} 配置值对象
   * @abstract
   */
  async getValues(keys, defaults = {}) {
    throw new Error('Method getValues must be implemented');
  }

  /**
   * 根据键删除配置
   * @param {String} key 配置键
   * @return {Promise<Object>} 删除结果
   * @abstract
   */
  async deleteByKey(key) {
    throw new Error('Method deleteByKey must be implemented');
  }

  /**
   * 根据类型查找配置
   * @param {String} type 配置类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 配置列表
   * @abstract
   */
  async findByType(type, options = {}) {
    throw new Error('Method findByType must be implemented');
  }
}

module.exports = ISystemConfigRepository;
