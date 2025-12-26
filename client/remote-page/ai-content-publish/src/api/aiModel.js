/**
 * AI 模型管理 API
 * @author DoraCMS Team
 */
import { get } from '@/utils/request';

/**
 * 获取 AI 模型列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.provider - 提供商筛选
 * @param {boolean} params.isEnabled - 启用状态筛选
 */
export function getModels(params) {
  return get('/manage/v1/ai/models', params);
}
