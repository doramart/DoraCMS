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
 * @param moduleName 模块名称（如 'ads', 'content', 'user' 等）
 * @param ids 要删除的ID
 * @param extraData 额外参数
 * @returns Promise
 */
export function standardDelete<T = any>(
  moduleName: string,
  ids: string | string[]|number,
  extraData: Record<string, any> = {}
): any {
  const urlMap: Record<string, string> = {
    ads: '/manage/ads/delete',
    content: '/manage/content/deleteContent',
    contentCategory: '/manage/contentCategory/deleteCategory',
    contentMessage: '/manage/contentMessage/deleteMessage',
    contentTag: '/manage/contentTag/deleteTag',
    mailTemplate: '/manage/mailTemplate/delete',
    menu: '/manage/menu/deleteMenu',
    regUser: '/manage/regUser/deleteUser',
    role: '/manage/role/deleteRole',
    systemConfig: '/manage/systemConfig/deleteConfig',
    systemOptionLog: '/manage/systemOptionLog/deleteLogItem',
    template: '/manage/template/deleteOne',
    templateItem: '/manage/template/delTemplateItem',
    uploadFile: '/manage/uploadFile/delete',
    user: '/manage/admin/deleteUser',
  };

  const url = urlMap[moduleName];
  if (!url) {
    throw new Error(`Unknown module name: ${moduleName}`);
  }

  return deleteRequest<T>(url, ids, extraData);
}

export default {
  deleteRequest,
  standardDelete,
};
