import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get content tag list */
export function getContentTagList(params: Api.SystemManage.ContentTagSearchParams) {
  return request<Api.SystemManage.ContentTagList>({
    url: '/manage/v1/tags',
    method: 'get',
    params
  });
}

/** Get single content tag */
export function getContentTag(id: string) {
  return request<Api.SystemManage.ContentTag>({
    url: `/manage/v1/tags/${id}`,
    method: 'get'
  });
}

/** Create content tag */
export function createContentTag(tag: Api.SystemManage.ContentTag) {
  return request({
    url: '/manage/v1/tags',
    method: 'post',
    data: tag
  });
}

/** Update content tag */
export function updateContentTag(tag: any) {
  return request({
    url: `/manage/v1/tags/${tag.id}`,
    method: 'put',
    data: tag
  });
}

/** Delete content tag */
export function deleteContentTag(ids: string | string[]) {
  return standardDelete('v1/tags', ids);
}
