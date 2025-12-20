/**
 * SystemOptionLog Repository 接口定义
 * 定义系统操作日志相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class ISystemOptionLogRepository extends IBaseRepository {
  /**
   * 根据操作类型查找日志
   * @param {String} type 操作类型 ('login', 'exception', 'operation', etc.)
   * @param {Object} payload 查询参数 { current, pageSize, etc. }
   * @param {Object} options 查询选项 { sort, dateRange }
   * @param _type
   * @param _payload
   * @param _options
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByType(_type, _payload = {}, _options = {}) {
    throw new Error('Method findByType() must be implemented');
  }

  /**
   * 根据时间范围查找日志
   * @param {Date} startDate 开始时间
   * @param {Date} endDate 结束时间
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @param _startDate
   * @param _endDate
   * @param _payload
   * @param _options
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByDateRange(_startDate, _endDate, _payload = {}, _options = {}) {
    throw new Error('Method findByDateRange() must be implemented');
  }

  /**
   * 根据日志内容关键词搜索
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @param _keyword
   * @param _payload
   * @param _options
   * @return {Promise<Object|Array>} 查询结果
   */
  async searchByLogs(_keyword, _payload = {}, _options = {}) {
    throw new Error('Method searchByLogs() must be implemented');
  }

  /**
   * 清空所有日志
   * @return {Promise<Object>} 删除结果
   */
  async removeAll() {
    throw new Error('Method removeAll() must be implemented');
  }

  /**
   * 清空指定时间范围的日志
   * @param {Date} beforeDate 清空此时间之前的日志
   * @param _beforeDate
   * @return {Promise<Object>} 删除结果
   */
  async removeByDate(_beforeDate) {
    throw new Error('Method removeByDate() must be implemented');
  }

  /**
   * 清空指定类型的日志
   * @param {String} type 日志类型
   * @param _type
   * @return {Promise<Object>} 删除结果
   */
  async removeByType(_type) {
    throw new Error('Method removeByType() must be implemented');
  }

  /**
   * 获取日志统计信息
   * @param {Object} options 统计选项 { groupBy, dateRange }
   * @param _options
   * @return {Promise<Object>} 统计结果
   */
  async getLogStats(_options = {}) {
    throw new Error('Method getLogStats() must be implemented');
  }

  /**
   * 批量创建日志记录
   * @param {Array} logs 日志记录数组
   * @param _logs
   * @return {Promise<Object>} 创建结果
   */
  async createBatch(_logs) {
    throw new Error('Method createBatch() must be implemented');
  }

  /**
   * 获取最近的日志记录
   * @param {Number} limit 限制数量
   * @param {String} type 日志类型（可选）
   * @param _limit
   * @param _type
   * @return {Promise<Array>} 最近的日志记录
   */
  async getRecentLogs(_limit = 100, _type = null) {
    throw new Error('Method getRecentLogs() must be implemented');
  }

  /**
   * 获取异常日志统计
   * @param {Object} options 查询选项
   * @param _options
   * @return {Promise<Object>} 异常统计结果
   */
  async getExceptionStats(_options = {}) {
    throw new Error('Method getExceptionStats() must be implemented');
  }
}

module.exports = ISystemOptionLogRepository;
