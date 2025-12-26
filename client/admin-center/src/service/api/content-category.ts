import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get content category list */
export function getContentCategoryList(params: Api.SystemManage.ContentCategorySearchParams) {
  return request({
    url: '/manage/v1/categories',
    method: 'get',
    params
  });
}

/** Get one content category */
export function getOneContentCategory(id: string) {
  return request<Api.SystemManage.ContentCategory>({
    url: `/manage/v1/categories/${id}`,
    method: 'get'
  });
}

/** Add content category */
export function addContentCategory(data: Api.SystemManage.ContentCategory) {
  return request<Api.SystemManage.ContentCategory>({
    url: '/manage/v1/categories',
    method: 'post',
    data
  });
}

/** Update content category */
export function updateContentCategory(data: Api.SystemManage.ContentCategory) {
  return request<Api.SystemManage.ContentCategory>({
    url: `/manage/v1/categories/${data.id}`,
    method: 'put',
    data
  });
}

/** Delete content category */
export function deleteContentCategory(ids: string | string[]) {
  return standardDelete<Api.SystemManage.ContentCategory>('v1/categories', ids);
}

/** Get my template list */
export function getMyTemplateList() {
  return request<Api.SystemManage.TemplateList>({
    url: '/manage/v1/templates',
    method: 'get',
    params: { type: 'custom' }  // 🔥 使用查询参数过滤自定义模板
  });
}
