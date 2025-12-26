import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get registered user list */
export function getRegUserList(params: any) {
  return request({
    url: '/manage/v1/users',
    method: 'get',
    params
  });
}

/** Get registered user detail */
export function getRegUserDetail(id: string) {
  return request<Api.SystemManage.RegUser>({
    url: `/manage/v1/users/${id}`,
    method: 'get'
  });
}

/** Update registered user */
export function updateRegUser(data: Record<string, any>) {
  return request<Api.Common.CommonRecord>({
    url: `/manage/v1/users/${data.id}`,
    method: 'put',
    data
  });
}

/** Delete registered user */
export function deleteRegUser(ids: string) {
  return standardDelete('v1/users', ids);
}
