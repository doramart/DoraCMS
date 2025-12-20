/**
 * 基础 Repository 接口定义
 * 所有具体的 Repository 都应该实现这个接口
 */
'use strict';

class IBaseRepository {
  /**
   * 查找多条记录
   * @param {Object} payload 查询参数 { current, pageSize, searchkey, isPaging, etc... }
   * @param {Object} options 查询选项 { query, searchKeys, populate, files, sort }
   * @return {Promise<Object|Array>} 查询结果，如果启用分页则返回 { docs, pageInfo }，否则返回数组
   */
  async find(payload, options = {}) {
    throw new Error('Method find() must be implemented');
  }

  /**
   * 查找单条记录
   * @param {Object} params 查询参数 { query, populate, files }
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(params = {}) {
    throw new Error('Method findOne() must be implemented');
  }

  /**
   * 根据ID查找单条记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项 { populate, files }
   * @return {Promise<Object|null>} 查询结果
   */
  async findById(id, options = {}) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * 统计记录数量
   * @param {Object} query 查询条件
   * @return {Promise<Number>} 记录数量
   */
  async count(query = {}) {
    throw new Error('Method count() must be implemented');
  }

  /**
   * 创建记录
   * @param {Object} data 要创建的数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    throw new Error('Method create() must be implemented');
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * 删除记录
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {String} key 主键字段名，默认为 'id'
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    throw new Error('Method remove() must be implemented');
  }

  /**
   * 软删除记录（标记删除）
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {Object} updateObj 更新对象，默认 { state: '0' }
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = {}) {
    throw new Error('Method safeDelete() must be implemented');
  }

  /**
   * 批量更新记录
   * @param {String|Array} ids 要更新的记录ID或ID数组
   * @param {Object} data 要更新的数据
   * @param {Object} query 额外的查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    throw new Error('Method updateMany() must be implemented');
  }
}

module.exports = IBaseRepository;
