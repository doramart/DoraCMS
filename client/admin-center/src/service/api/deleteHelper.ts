/**
 * 删除操作前端工具函数
 * 🔥 统一处理单个删除和批量删除的参数格式
 */

import { request } from '../request';

/**
 * 通用删除函数
 * @param url 删除接口URL
 * @param ids 要删除的ID（单个ID字符串、逗号分隔的ID字符串、或ID数组）
 * @param extraData 额外的参数数据
 * @returns Promise
 */
export function deleteRequest<T = any>(
  url: string,
  ids: string | string[] | number,
  extraData: Record<string, any> = {}
): any {
  // 🔥 支持单个删除和批量删除
  const data: any = { ...extraData };
  
  if (Array.isArray(ids)) {
    // 数组格式：批量删除
    data.ids = ids;
  } else if (typeof ids === 'string' && ids.includes(',')) {
    // 逗号分隔字符串：批量删除
    data.ids = ids.split(',').map(id => id.trim()).filter(id => id);
  } else if (typeof ids === 'number') {
    // 数字：单个删除
    data.id = ids;
  } else {
    // 单个ID：单个删除
    data.id = ids;
  }

  return request<T>({
    url,
    method: 'post',
    data
  });
}

/**
 * 标准删除函数（适用于大多数删除接口）
 * @param moduleName 模块名称（如 'v1/ads', 'v1/content', 'v1/users' 等）
 * @param ids 要删除的ID（单个或数组）
 * @param extraData 额外参数（通过 query 传递）
 * @returns Promise
 * 
 * 🔥 RESTful 风格：DELETE /manage/v1/{resource}/{id}
 * 
 * 使用示例：
 * - standardDelete('v1/ads', '123')  → DELETE /manage/v1/ads/123
 * - standardDelete('v1/content', ['1', '2'])  → DELETE /manage/v1/content/1,2
 * - standardDelete('v1/content', '123', { draft: true })  → DELETE /manage/v1/content/123?draft=true
 * 
 * 注意：
 * - 后端通过 ctx.params.id 获取路径参数（支持逗号分隔的批量删除）
 * - 额外参数通过 query 传递（DELETE 请求不应该有 body）
 */
export function standardDelete<T = any>(
  moduleName: string,
  ids: string | string[] | number,
  extraData: Record<string, any> = {}
): any {
  // 🔥 RESTful 路由：使用路径参数
  let url: string;
  let idsParam: string;
  
  if (Array.isArray(ids)) {
    // 批量删除：使用逗号分隔的 ID
    // 后端会通过 ctx.params.id 获取 "1,2,3"，然后 split(',') 分割
    idsParam = ids.join(',');
  } else {
    // 单个删除
    idsParam = String(ids);
  }
  
  url = `/manage/${moduleName}/${idsParam}`;

  // 🔥 RESTful DELETE 请求：额外参数通过 query 传递
  return request<T>({
    url,
    method: 'delete',
    params: extraData  // 使用 params（query 参数）而不是 data（body）
  });
}

export default {
  deleteRequest,
  standardDelete,
};
