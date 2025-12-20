/**
 * ApiKey Repository 接口定义
 * 定义 API Key 相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IApiKeyRepository extends IBaseRepository {
  /**
   * 根据 key 查找 ApiKey
   * @param {String} key
   * @param _key
   * @return {Promise<Object|null>}
   */
  async findByKey(_key) {
    throw new Error('Method findByKey() must be implemented');
  }

  /**
   * 根据 userId 查找 ApiKey 列表
   * @param {String} userId
   * @param _userId
   * @return {Promise<Array>}
   */
  async findByUserId(_userId) {
    throw new Error('Method findByUserId() must be implemented');
  }

  /**
   * 检查 key 是否唯一
   * @param {String} key
   * @param _key
   * @return {Promise<Boolean>}
   */
  async checkKeyUnique(_key) {
    throw new Error('Method checkKeyUnique() must be implemented');
  }

  /**
   * 更新 ApiKey 的 lastUsedAt 字段
   * @param {String} key
   * @param {Date} lastUsedAt
   * @param _key
   * @param _lastUsedAt
   * @return {Promise<Object>}
   */
  async updateLastUsedAt(_key, _lastUsedAt) {
    throw new Error('Method updateLastUsedAt() must be implemented');
  }
}

module.exports = IApiKeyRepository;
