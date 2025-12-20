/**
 * AI Model Repository 接口
 * 定义 AI 模型管理的业务方法
 *
 * 注意：此接口仅用于文档和类型提示，不在运行时使用
 * 实际的 Repository 实现继承自 BaseMongoRepository 或 BaseMariaRepository
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

/**
 * AI 模型 Repository 接口
 * 定义 AI 模型特有的方法
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
class IAIModelRepository {
  /**
   * 根据提供商和模型名查找
   * @param {String} provider 提供商（openai/deepseek/ollama）
   * @param {String} modelName 模型名称
   * @return {Promise<Object|null>} AI模型对象
   */
  async findByProviderAndModel(provider, modelName) {
    throw new Error('Method findByProviderAndModel() must be implemented');
  }

  /**
   * 获取启用的模型列表
   * @param {String} taskType 任务类型（可选，如果指定则筛选支持该任务的模型）
   * @return {Promise<Array>} 模型列表
   */
  async findEnabledModels(taskType = null) {
    throw new Error('Method findEnabledModels() must be implemented');
  }

  /**
   * 根据任务类型获取最优模型
   * 按优先级和成本排序，返回第一个可用模型
   * @param {String} taskType 任务类型
   * @return {Promise<Object|null>} 最优模型
   */
  async findOptimalModel(taskType) {
    throw new Error('Method findOptimalModel() must be implemented');
  }

  /**
   * 更新模型统计信息
   * 使用原子操作递增统计字段
   * @param {String} id 模型ID
   * @param {Object} stats 统计数据 {calls, tokens, cost, averageResponseTime}
   * @return {Promise<Object>} 更新后的模型
   */
  async updateStats(id, stats) {
    throw new Error('Method updateStats() must be implemented');
  }

  /**
   * 更新模型健康状态
   * @param {String} id 模型ID
   * @param {Object} healthData 健康数据 {isHealthy, lastCheckTime, errorCount}
   * @return {Promise<Object>} 更新后的模型
   */
  async updateHealthStatus(id, healthData) {
    throw new Error('Method updateHealthStatus() must be implemented');
  }

  /**
   * 批量启用/禁用模型
   * @param {Array} modelIds 模型ID数组
   * @param {Boolean} isEnabled 是否启用
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(modelIds, isEnabled) {
    throw new Error('Method batchUpdateStatus() must be implemented');
  }

  /**
   * 根据提供商查找所有模型
   * @param {String} provider 提供商
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 模型列表
   */
  async findByProvider(provider, options = {}) {
    throw new Error('Method findByProvider() must be implemented');
  }

  /**
   * 获取模型统计摘要
   * 包含总调用次数、总成本、平均响应时间等
   * @param {String} modelId 模型ID（可选，不传则统计所有模型）
   * @param {Date} startDate 开始日期（可选）
   * @param {Date} endDate 结束日期（可选）
   * @return {Promise<Object>} 统计摘要
   */
  async getStatsSummary(modelId = null, startDate = null, endDate = null) {
    throw new Error('Method getStatsSummary() must be implemented');
  }

  /**
   * 检查模型配置完整性
   * 验证 API Key、端点等必要配置是否存在
   * @param {String} id 模型ID
   * @return {Promise<Object>} 检查结果 {isValid, missingFields}
   */
  async validateModelConfig(id) {
    throw new Error('Method validateModelConfig() must be implemented');
  }

  /**
   * 获取降级链
   * 返回包含主模型和降级模型的完整链条
   * @param {String} modelId 主模型ID
   * @return {Promise<Array>} 降级链 [主模型, 降级模型1, 降级模型2, ...]
   */
  async getFallbackChain(modelId) {
    throw new Error('Method getFallbackChain() must be implemented');
  }

  /**
   * 根据成本范围查找模型
   * @param {Number} minCost 最小成本
   * @param {Number} maxCost 最大成本
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 模型列表
   */
  async findByCostRange(minCost, maxCost, options = {}) {
    throw new Error('Method findByCostRange() must be implemented');
  }
}

module.exports = IAIModelRepository;
