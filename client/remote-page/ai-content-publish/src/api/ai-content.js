/**
 * AI 辅助内容发布 API
 * @description 基于 egg-ai-assistant 插件的 AI 内容发布接口
 * @author DoraCMS Team
 */
import request from '@/utils/request';

/**
 * AI 辅助创建内容
 * @param {Object} data - 发布数据
 * @param {string} data.publishMode - 发布模式: 'manual' | 'ai_smart' | 'ai_full'
 * @param {string} data.title - 标题（手动模式必填）
 * @param {string} data.discription - 摘要
 * @param {string} data.comments - 富文本内容
 * @param {string} data.simpleComments - 纯文本内容
 * @param {Array<string>} data.tags - 标签ID数组
 * @param {string} data.categories - 分类ID
 * @param {string} data.sImg - 封面图
 * @param {string} data.state - 状态: '0'=草稿, '1'=已发布
 * @param {string} data.type - 内容类型ID
 * @param {boolean} data.regenerateTitle - 是否重新生成标题（AI模式）
 * @param {boolean} data.regenerateSummary - 是否重新生成摘要（AI模式）
 * @param {boolean} data.regenerateTags - 是否重新生成标签（AI模式）
 * @param {boolean} data.autoCategory - 是否自动匹配分类（AI模式）
 * @param {string} data.titleStyle - 标题风格: 'engaging'|'professional'|'casual'
 * @param {string} data.language - 语言代码，默认 'zh-CN'
 */
export function createContentWithAI(data) {
  return request({
    url: '/manage/v1/ai/content/publish',
    method: 'post',
    data,
    timeout: 60000 * 10, // 60秒超时，AI 生成需要更长时间
  });
}

/**
 * AI 辅助更新内容
 * @param {Object} data - 更新数据（包含id）
 */
export function updateContentWithAI(data) {
  return request({
    url: '/manage/v1/ai/content/updateWithAI',
    method: 'post',
    data,
    timeout: 60000 * 10, // 60秒超时，AI 生成需要更长时间
  });
}

/**
 * 预览 AI 增强效果
 * @param {Object} data - 预览数据
 * @param {string} data.comments - 内容（必填）
 * @param {string} data.title - 当前标题（可选）
 * @param {string} data.discription - 当前摘要（可选）
 * @param {Array<string>} data.tags - 当前标签（可选）
 * @param {boolean} data.regenerateTitle - 是否生成标题
 * @param {boolean} data.regenerateSummary - 是否生成摘要
 * @param {boolean} data.regenerateTags - 是否生成标签
 * @param {boolean} data.autoCategory - 是否自动匹配分类
 * @param {string} data.language - 语言代码
 */
export function previewAIEnhancements(data) {
  return request({
    url: '/manage/v1/ai/content/preview',
    method: 'post',
    data,
    timeout: 60000 * 10, // 60秒超时，AI 生成需要更长时间
  });
}

/**
 * 批量 AI 增强发布
 * @param {Object} data - 批量数据
 * @param {Array<Object>} data.contents - 内容数组
 * @param {string} data.publishMode - 发布模式
 */
export function batchPublishWithAI(data) {
  return request({
    url: '/manage/v1/ai/content/batch-publish',
    method: 'post',
    data,
    timeout: 120000 * 10, // 120秒超时，批量处理需要更长时间
  });
}

/**
 * 单独生成标题
 * @param {Object} data - 请求数据
 * @param {string} data.comments - 内容
 * @param {string} data.titleStyle - 标题风格
 * @param {string} data.language - 语言代码
 */
export function generateTitle(data) {
  return request({
    url: '/manage/v1/ai/content/generate-title',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时，单次生成较快
  });
}

/**
 * 单独生成摘要
 * @param {Object} data - 请求数据
 * @param {string} data.comments - 内容
 * @param {string} data.language - 语言代码
 */
export function generateSummary(data) {
  return request({
    url: '/manage/v1/ai/content/generate-summary',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时，单次生成较快
  });
}

/**
 * 单独生成标签
 * @param {Object} data - 请求数据
 * @param {string} data.comments - 内容
 * @param {string} data.language - 语言代码
 */
export function generateTags(data) {
  return request({
    url: '/manage/v1/ai/content/extract-tags',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时，单次生成较快
  });
}

/**
 * 单独生成关键词
 * @param {Object} data - 请求数据
 * @param {string} data.content - 内容
 * @param {string} data.title - 标题（可选）
 * @param {number} data.maxKeywords - 最多关键词数量，默认8
 * @param {string} data.language - 语言代码
 */
export function generateKeywords(data) {
  return request({
    url: '/manage/v1/ai/content/extract-keywords',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时，单次生成较快
  });
}

/**
 * 检查 AI 服务状态
 */
export function checkAIStatus() {
  return request({
    url: '/manage/v1/ai/status',
    method: 'get',
  });
}

/**
 * 获取 AI 使用统计
 */
export function getAIUsageStats() {
  return request({
    url: '/manage/v1/ai/usage-stats',
    method: 'get',
  });
}

/**
 * 根据标签名查找或创建标签（AI智能处理）
 * @param {Array<string>} tagNames - 标签名数组
 * @description 批量处理AI生成的标签名，已存在的直接返回，不存在的自动创建
 */
export function findOrCreateTagsByNames(tagNames) {
  return request({
    url: '/api/v1/tags/findOrCreate',
    method: 'post',
    data: { tagNames },
  });
}

/**
 * 智能匹配文章分类
 * @param {Object} data - 请求数据
 * @param {string} data.content - 文章内容（必填）
 * @param {string} data.title - 文章标题（可选）
 * @param {Array<string>} data.tags - 文章标签（可选）
 * @param {string} data.language - 语言代码，默认 'zh-CN'
 */
export function matchCategory(data) {
  return request({
    url: '/manage/v1/ai/content/match-category',
    method: 'post',
    data,
    timeout: 30000, // 30秒超时，分类匹配较快
  });
}

/**
 * AI 生成图片（封面图）
 * @param {Object} data - 请求数据
 * @param {string} data.prompt - 图片生成提示词（必填）
 * @param {string} data.modelId - 模型ID（可选，不传则使用默认模型）
 * @param {string} data.size - 图片尺寸（可选，如 '1024x1024'）
 * @param {number} data.n - 生成数量（可选，默认1）
 * @param {string} data.responseFormat - 响应格式（可选，'url'或'b64_json'）
 * @param {boolean} data.optimizePrompt - 是否优化提示词（可选，默认false）
 * @param {string} data.language - 语言代码（可选，默认 'zh-CN'）
 */
export function generateImage(data) {
  return request({
    url: '/manage/v1/ai/image/generate',
    method: 'post',
    data,
    timeout: 60000, // 60秒超时，图片生成需要较长时间
  });
}

/**
 * 获取支持图片生成的模型列表
 * @description 检查是否配置了文生图模型
 */
export function getImageGenerationModels() {
  return request({
    url: '/manage/v1/ai/image/models',
    method: 'get',
  });
}
