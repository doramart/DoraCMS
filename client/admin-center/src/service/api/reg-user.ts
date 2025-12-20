import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** Get registered user list */
export function getRegUserList(params: any) {
  return request({
    url: '/manage/regUser/getList',
    method: 'get',
    params
  });
}

/** Get registered user detail */
export function getRegUserDetail(id: string) {
  return request<Api.SystemManage.RegUser>({
    url: '/manage/regUser/getOne',
    method: 'get',
    params: { id }
  });
}

/** Update registered user */
export function updateRegUser(data: Record<string, any>) {
  return request<Api.Common.CommonRecord>({
    url: '/manage/regUser/updateOne',
    method: 'post',
    data
  });
}

/** Delete registered user */
export function deleteRegUser(ids: string) {
  return standardDelete('regUser', ids);
}
