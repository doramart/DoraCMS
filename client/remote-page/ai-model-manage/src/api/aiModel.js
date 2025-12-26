/**
 * AI 模型管理 API
 * @author DoraCMS Team
 */
import { get, post, put, del } from '@/utils/request';

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

/**
 * 获取单个模型配置
 * @param {string} id - 模型ID
 */
export function getModel(id) {
  return get(`/manage/v1/ai/models/${id}`);
}

/**
 * 创建模型配置
 * @param {Object} data - 模型数据
 */
export function createModel(data) {
  return post('/manage/v1/ai/models', data);
}

/**
 * 更新模型配置
 * @param {string} id - 模型ID
 * @param {Object} data - 更新数据
 */
export function updateModel(id, data) {
  return put(`/manage/v1/ai/models/${id}`, data);
}

/**
 * 删除模型配置
 * @param {string} id - 模型ID
 */
export function deleteModel(id) {
  return del(`/manage/v1/ai/models/${id}`);
}

/**
 * 测试 API Key
 * @param {Object} data - 测试数据
 * @param {string} data.provider - 提供商
 * @param {string} data.apiKey - API Key
 * @param {string} data.apiEndpoint - API 端点
 */
export function testApiKey(data) {
  return post('/manage/v1/ai/test-api-key', data);
}

/**
 * 获取可用的提供商列表
 */
export function getProviders() {
  return get('/manage/v1/ai/providers');
}

/**
 * 切换模型启用状态
 * @param {string} id - 模型ID
 * @param {boolean} isEnabled - 启用状态
 */
export function toggleModel(id, isEnabled) {
  return put(`/manage/v1/ai/models/${id}/toggle`, { isEnabled });
}

/**
 * 批量删除模型
 * @param {Array<string>} ids - 模型ID数组
 */
export function batchDelete(ids) {
  return post('/manage/v1/ai/models/batch-delete', { ids });
}

/**
 * 健康检查
 * @param {string} id - 模型ID（可选）
 */
export function healthCheck(id = null) {
  return get('/manage/v1/ai/health-check', id ? { id } : {});
}
