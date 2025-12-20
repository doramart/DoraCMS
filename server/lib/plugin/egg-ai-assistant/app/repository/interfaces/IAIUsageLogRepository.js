/**
 * AI Usage Log Repository 接口
 * 定义 AI 使用日志管理的业务方法
 *
 * 注意：此接口仅用于文档和类型提示，不在运行时使用
 * 实际的 Repository 实现继承自 BaseMongoRepository 或 BaseMariaRepository
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

/**
 * AI 使用日志 Repository 接口
 * 定义使用日志特有的方法
 *
 * 基础方法（继承自 IBaseRepository）：
 * - create(data, options)
 * - update(id, updates, options)
 * - delete(id, options)
 * - findById(id, options)
 * - find(payload, queryOptions)
 * - count(filters)
 * - exists(filters)
 * - deleteMany(filters, options)
 */
class IAIUsageLogRepository {
  /**
   * 根据用户ID查找使用记录
   * @param {String} userId 用户ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByUser(userId, payload = {}, options = {}) {
    throw new Error('Method findByUser() must be implemented');
  }

  /**
   * 根据模型ID查找使用记录
   * @param {String} modelId 模型ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByModel(modelId, payload = {}, options = {}) {
    throw new Error('Method findByModel() must be implemented');
  }

  /**
   * 根据任务类型查找使用记录
   * @param {String} taskType 任务类型
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByTaskType(taskType, payload = {}, options = {}) {
    throw new Error('Method findByTaskType() must be implemented');
  }

  /**
   * 获取用户使用统计
   * @param {String} userId 用户ID
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 统计结果 {totalCalls, totalTokens, totalCost, ...}
   */
  async getUserStats(userId, startDate = null, endDate = null) {
    throw new Error('Method getUserStats() must be implemented');
  }

  /**
   * 获取模型使用统计
   * @param {String} modelId 模型ID
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 统计结果
   */
  async getModelStats(modelId, startDate = null, endDate = null) {
    throw new Error('Method getModelStats() must be implemented');
  }

  /**
   * 获取任务类型统计
   * @param {String} taskType 任务类型（可选，不传则统计所有任务）
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 统计结果
   */
  async getTaskTypeStats(taskType = null, startDate = null, endDate = null) {
    throw new Error('Method getTaskTypeStats() must be implemented');
  }

  /**
   * 按时间范围统计使用情况
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @param {String} groupBy 分组方式 ('hour'/'day'/'week'/'month')
   * @return {Promise<Array>} 时间序列统计数据
   */
  async getUsageByTimeRange(startDate, endDate, groupBy = 'day') {
    throw new Error('Method getUsageByTimeRange() must be implemented');
  }

  /**
   * 获取失败的使用记录
   * @param {Object} payload 分页参数
   * @param {Object} filter 过滤条件 {userId, modelId, taskType}
   * @return {Promise<Object>} 分页结果
   */
  async findFailedLogs(payload = {}, filter = {}) {
    throw new Error('Method findFailedLogs() must be implemented');
  }

  /**
   * 获取成功率统计
   * @param {Object} filter 过滤条件 {userId, modelId, taskType}
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 成功率数据 {successRate, totalCalls, successCalls, failedCalls}
   */
  async getSuccessRate(filter = {}, startDate = null, endDate = null) {
    throw new Error('Method getSuccessRate() must be implemented');
  }

  /**
   * 获取平均响应时间
   * @param {Object} filter 过滤条件
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Number>} 平均响应时间（毫秒）
   */
  async getAverageResponseTime(filter = {}, startDate = null, endDate = null) {
    throw new Error('Method getAverageResponseTime() must be implemented');
  }

  /**
   * 获取成本统计
   * @param {Object} filter 过滤条件
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 成本统计 {totalCost, averageCost, costByModel}
   */
  async getCostStats(filter = {}, startDate = null, endDate = null) {
    throw new Error('Method getCostStats() must be implemented');
  }

  /**
   * 批量创建日志（用于批量导入）
   * @param {Array} logs 日志数组
   * @return {Promise<Array>} 创建的日志列表
   */
  async batchCreate(logs) {
    throw new Error('Method batchCreate() must be implemented');
  }

  /**
   * 清理过期日志
   * 删除指定天数之前的日志
   * @param {Number} days 保留天数
   * @return {Promise<Object>} 删除结果 {deletedCount}
   */
  async cleanupOldLogs(days = 90) {
    throw new Error('Method cleanupOldLogs() must be implemented');
  }

  /**
   * 导出使用日志
   * @param {Object} filter 过滤条件
   * @param {String} format 导出格式 ('json'/'csv')
   * @return {Promise<String|Object>} 导出数据
   */
  async exportLogs(filter = {}, format = 'json') {
    throw new Error('Method exportLogs() must be implemented');
  }

  /**
   * 获取Token使用趋势
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @param {String} groupBy 分组方式
   * @return {Promise<Array>} 趋势数据
   */
  async getTokenUsageTrend(startDate, endDate, groupBy = 'day') {
    throw new Error('Method getTokenUsageTrend() must be implemented');
  }
}

module.exports = IAIUsageLogRepository;
