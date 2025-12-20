import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get content tag list */
export function getContentTagList(params: Api.SystemManage.ContentTagSearchParams) {
  return request<Api.SystemManage.ContentTagList>({
    url: '/manage/contentTag/getList',
    method: 'get',
    params
  });
}

/** Get single content tag */
export function getContentTag(id: string) {
  return request<Api.SystemManage.ContentTag>({
    url: '/manage/contentTag/getOne',
    method: 'get',
    params: { id: id }
  });
}

/** Create content tag */
export function createContentTag(tag: Api.SystemManage.ContentTag) {
  return request({
    url: '/manage/contentTag/addOne',
    method: 'post',
    data: tag
  });
}

/** Update content tag */
export function updateContentTag(tag: any) {
  return request({
    url: '/manage/contentTag/updateOne',
    method: 'post',
    data: tag
  });
}

/** Delete content tag */
export function deleteContentTag(ids: string | string[]) {
  return standardDelete('contentTag', ids);
}
