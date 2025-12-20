import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get content category list */
export function getContentCategoryList(params: Api.SystemManage.ContentCategorySearchParams) {
  return request({
    url: '/manage/contentCategory/getList',
    method: 'get',
    params
  });
}

/** Get one content category */
export function getOneContentCategory(id: string) {
  return request<Api.SystemManage.ContentCategory>({
    url: '/manage/contentCategory/getOne',
    method: 'get',
    params: { id }
  });
}

/** Add content category */
export function addContentCategory(data: Api.SystemManage.ContentCategory) {
  return request<Api.SystemManage.ContentCategory>({
    url: '/manage/contentCategory/addOne',
    method: 'post',
    data
  });
}

/** Update content category */
export function updateContentCategory(data: Api.SystemManage.ContentCategory) {
  return request<Api.SystemManage.ContentCategory>({
    url: '/manage/contentCategory/updateOne',
    method: 'post',
    data
  });
}

/** Delete content category */
export function deleteContentCategory(ids: string | string[]) {
  return standardDelete<Api.SystemManage.ContentCategory>('contentCategory', ids);
}

/** Get my template list */
export function getMyTemplateList() {
  return request<Api.SystemManage.TemplateList>({
    url: '/manage/template/getDefaultCustomTemplateList',
    method: 'get'
  });
}
