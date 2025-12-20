'use strict';

const IBaseRepository = require('./IBaseRepository');

/**
 * 权限定义 Repository 接口
 */
class IPermissionDefinitionRepository extends IBaseRepository {
  /**
   * 获取启用状态的权限定义
   * @param {Object} options 查询选项
   * @return {Promise<Array>}
   */
  async findActiveDefinitions(options = {}) {
    throw new Error('Method findActiveDefinitions() must be implemented');
  }

  /**
   * 批量 upsert 权限定义
   * @param {Array} definitions 权限定义
   * @param {Object} operator 操作人信息
   * @return {Promise<Object>} 统计信息
   */
  async bulkUpsert(definitions = [], operator = {}) {
    throw new Error('Method bulkUpsert() must be implemented');
  }

  /**
   * 根据 code 批量禁用权限定义
   * @param {Array<String>} codes 权限 code
   * @param {Object} operator 操作人信息
   * @return {Promise<Object>} 更新结果
   */
  async markDisabledByCodes(codes = [], operator = {}) {
    throw new Error('Method markDisabledByCodes() must be implemented');
  }

  /**
   * 获取最新修订号
   * @return {Promise<Number>}
   */
  async getLatestRevision() {
    throw new Error('Method getLatestRevision() must be implemented');
  }
}

module.exports = IPermissionDefinitionRepository;
