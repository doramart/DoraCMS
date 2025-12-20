/**
 * Prompt Template Repository 接口
 * 定义提示词模板管理的业务方法
 *
 * 注意：此接口仅用于文档和类型提示，不在运行时使用
 * 实际的 Repository 实现继承自 BaseMongoRepository 或 BaseMariaRepository
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

/**
 * 提示词模板 Repository 接口
 * 定义提示词模板特有的方法
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
class IPromptTemplateRepository {
  /**
   * 根据任务类型和语言查找模板
   * @param {String} taskType 任务类型 (title_generation/tag_extraction等)
   * @param {String} language 语言代码 (zh-CN/en-US/ja-JP)
   * @return {Promise<Object|null>} 提示词模板对象
   */
  async findByTaskTypeAndLanguage(taskType, language) {
    throw new Error('Method findByTaskTypeAndLanguage() must be implemented');
  }

  /**
   * 获取所有任务类型
   * @return {Promise<Array>} 任务类型列表 ['title_generation', 'tag_extraction', ...]
   */
  async getTaskTypes() {
    throw new Error('Method getTaskTypes() must be implemented');
  }

  /**
   * 获取支持的语言列表
   * @return {Promise<Array>} 语言代码列表 ['zh-CN', 'en-US', ...]
   */
  async getSupportedLanguages() {
    throw new Error('Method getSupportedLanguages() must be implemented');
  }

  /**
   * 递增模板使用次数
   * 使用原子操作
   * @param {String} id 模板ID
   * @return {Promise<Object>} 更新后的模板
   */
  async incrementUsageCount(id) {
    throw new Error('Method incrementUsageCount() must be implemented');
  }

  /**
   * 根据任务类型查找所有版本
   * 用于A/B测试和版本管理
   * @param {String} taskType 任务类型
   * @param {String} language 语言代码
   * @return {Promise<Array>} 模板版本列表
   */
  async findVersionsByTaskType(taskType, language) {
    throw new Error('Method findVersionsByTaskType() must be implemented');
  }

  /**
   * 获取最新版本的模板
   * @param {String} taskType 任务类型
   * @param {String} language 语言代码
   * @return {Promise<Object|null>} 最新版本的模板
   */
  async findLatestVersion(taskType, language) {
    throw new Error('Method findLatestVersion() must be implemented');
  }

  /**
   * 批量创建多语言模板
   * @param {String} taskType 任务类型
   * @param {Object} templates 多语言模板 {'zh-CN': {...}, 'en-US': {...}}
   * @return {Promise<Array>} 创建的模板列表
   */
  async createMultiLanguageTemplates(taskType, templates) {
    throw new Error('Method createMultiLanguageTemplates() must be implemented');
  }

  /**
   * 更新模板效果统计
   * 记录模板生成结果的质量评分
   * @param {String} id 模板ID
   * @param {Object} effectStats 效果统计 {successRate, averageScore, totalUsage}
   * @return {Promise<Object>} 更新后的模板
   */
  async updateEffectStats(id, effectStats) {
    throw new Error('Method updateEffectStats() must be implemented');
  }

  /**
   * 查找启用的模板
   * @param {String} taskType 任务类型（可选）
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的模板列表
   */
  async findEnabledTemplates(taskType = null, options = {}) {
    throw new Error('Method findEnabledTemplates() must be implemented');
  }

  /**
   * 根据标签查找模板
   * @param {Array} tags 标签数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 模板列表
   */
  async findByTags(tags, options = {}) {
    throw new Error('Method findByTags() must be implemented');
  }

  /**
   * 克隆模板（用于创建新版本）
   * @param {String} templateId 原模板ID
   * @param {Object} newData 新模板数据
   * @return {Promise<Object>} 新模板
   */
  async cloneTemplate(templateId, newData = {}) {
    throw new Error('Method cloneTemplate() must be implemented');
  }

  /**
   * 批量启用/禁用模板
   * @param {Array} templateIds 模板ID数组
   * @param {Boolean} isEnabled 是否启用
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(templateIds, isEnabled) {
    throw new Error('Method batchUpdateStatus() must be implemented');
  }

  /**
   * 获取热门模板（使用次数最多）
   * @param {Number} limit 返回数量限制
   * @param {String} taskType 任务类型（可选）
   * @return {Promise<Array>} 热门模板列表
   */
  async getPopularTemplates(limit = 10, taskType = null) {
    throw new Error('Method getPopularTemplates() must be implemented');
  }

  /**
   * 验证模板语法
   * 检查模板变量、格式等是否正确
   * @param {String} templateContent 模板内容
   * @return {Promise<Object>} 验证结果 {isValid, errors}
   */
  async validateTemplateSyntax(templateContent) {
    throw new Error('Method validateTemplateSyntax() must be implemented');
  }
}

module.exports = IPromptTemplateRepository;
