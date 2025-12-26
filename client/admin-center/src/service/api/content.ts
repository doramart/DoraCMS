import { request } from '../request';
import { deleteRequest } from './deleteHelper';

/** get content list */
export function fetchGetContentList(params?: any) {
  return request<any>({
    url: '/manage/v1/content',
    method: 'get',
    params
  });
}

/** get content category list */
export function fetchGetContentCategoryList() {
  return request<any>({
    url: '/manage/v1/categories',
    method: 'get'
  });
}

/** get content tag list */
export function fetchGetContentTagList(params?: any) {
  return request<any>({
    url: '/manage/v1/tags',
    method: 'get',
    params
  });
}

/** get content type list */
export function fetchGetContentTypeList() {
  return request<any>({
    url: '/manage/v1/content/types',
    method: 'get'
  });
}

/** get one content */
export function fetchGetOneContent(id: string) {
  return request<any>({
    url: `/manage/v1/content/${id}`,
    method: 'get'
  });
}

/** update content */
export function updateContent(params: any) {
  return request<any>({
    url: `/manage/v1/content/${params.id}`,
    method: 'put',
    data: { ...params }
  });
}

export function updateManyContent(params: any) {
  return request({
    url: '/manage/v1/content/batch',
    method: 'put',
    data: { ...params }
  });
}

/** create content */
export function createContent(params: any) {
  return request<any>({
    url: '/manage/v1/content',
    method: 'post',
    data: { ...params }
  });
}

/** delete content */
export function deleteContent(params: any) {
  // 🔥 使用通用删除工具，支持额外参数
  const ids = params.ids || params.id;
  const extraData: any = {};

  // 保留额外参数（如 draft）
  if (params.draft !== undefined) {
    extraData.draft = params.draft;
  }

  return deleteRequest<any>('/manage/v1/content', ids, extraData);
}

/** get nearby content */
export function fetchGetNearbyContent(id: string) {
  return request<any>({
    url: `/api/v1/content/${id}/nearby`,
    method: 'get'
  });
}


/** upload cover */
export function uploadCover(params: any) {
  return request<any>({
    url: `/api/v1/content/${params.id}/cover`,
    method: 'post',
    data: { ...params }
  });
}

/** get content counts by category id */
export function fetchGetContentCountsByCateId(cateId: string) {
  return request<any>({
    url: `/api/v1/categories/${cateId}/content-count`,
    method: 'get'
  });
}

/** get hot tag ids */
export function fetchGetHotTagIds() {
  return request<any>({
    url: '/api/v1/content/hot-tag-ids',
    method: 'get'
  });
}

/** move content to category */
export function moveContentToCategory(params: any) {
  return request<any>({
    url: `/manage/v1/content/${params.id}/category`,
    method: 'put',
    data: { ...params }
  });
}
