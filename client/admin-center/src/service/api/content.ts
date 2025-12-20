import { request } from '../request';
import { deleteRequest } from './deleteHelper';

/** get content list */
export function fetchGetContentList(params?: any) {
  return request<any>({
    url: '/manage/content/getList',
    method: 'get',
    params
  });
}

/** get content category list */
export function fetchGetContentCategoryList() {
  return request<any>({
    url: '/manage/contentCategory/getList',
    method: 'get'
  });
}

/** get content tag list */
export function fetchGetContentTagList(params?: any) {
  return request<any>({
    url: '/manage/contentTag/getList',
    method: 'get',
    params
  });
}

/** get content type list */
export function fetchGetContentTypeList() {
  return request<any>({
    url: '/manage/content/getTypeList',
    method: 'get'
  });
}

/** get one content */
export function fetchGetOneContent(id: string) {
  return request<any>({
    url: `/manage/content/getContent?id=${id}`,
    method: 'get'
  });
}

/** update content */
export function updateContent(params: any) {
  return request<any>({
    url: '/manage/content/updateOne',
    method: 'post',
    data: { ...params }
  });
}

export function updateManyContent(params: any) {
  return request({
    url: '/manage/content/updateContents',
    method: 'post',
    data: { ...params }
  });
}

/** create content */
export function createContent(params: any) {
  return request<any>({
    url: '/manage/content/addOne',
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

  return deleteRequest<any>('/manage/content/deleteContent', ids, extraData);
}

/** get nearby content */
export function fetchGetNearbyContent(id: string) {
  return request<any>({
    url: `/api/content/getNearbyContent?id=${id}`,
    method: 'get'
  });
}


/** upload cover */
export function uploadCover(params: any) {
  return request<any>({
    url: '/api/content/uploadCover',
    method: 'post',
    data: { ...params }
  });
}

/** get content counts by category id */
export function fetchGetContentCountsByCateId(cateId: string) {
  return request<any>({
    url: `/api/content/getContentCountsByCateId?cateId=${cateId}`,
    method: 'get'
  });
}

/** get hot tag ids */
export function fetchGetHotTagIds() {
  return request<any>({
    url: '/api/content/getHotTagIds',
    method: 'get'
  });
}

/** move content to category */
export function moveContentToCategory(params: any) {
  return request<any>({
    url: '/manage/content/moveCate',
    method: 'post',
    data: { ...params }
  });
}
