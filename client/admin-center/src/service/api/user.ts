import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/manage/v1/admins',
    method: 'get',
    params
  });
}

/** create admin item */
export function createUserItem(params: Api.SystemManage.User) {
  return request<Api.SystemManage.User>({
    url: '/manage/v1/admins',
    method: 'post',
    data: { ...params }
  });
}

/** update admin item */
export function updateUserItem(params: Api.SystemManage.User) {
  return request<Api.SystemManage.User>({
    url: `/manage/v1/admins/${params.id}`,
    method: 'put',
    data: { ...params }
  });
}

/** delete admin item */
export function deleteUserList(ids: string | string[]) {
  return standardDelete<Api.SystemManage.UserList>('v1/admins', ids);
}
