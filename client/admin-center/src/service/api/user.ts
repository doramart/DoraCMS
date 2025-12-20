import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/manage/admin/getList',
    method: 'get',
    params
  });
}

/** create admin item */
export function createUserItem(params: Api.SystemManage.User) {
  return request<Api.SystemManage.User>({
    url: '/manage/admin/addOne',
    method: 'post',
    data: { ...params }
  });
}

/** update admin item */
export function updateUserItem(params: Api.SystemManage.User) {
  return request<Api.SystemManage.User>({
    url: '/manage/admin/updateOne',
    method: 'post',
    data: { ...params }
  });
}

/** delete admin item */
export function deleteUserList(ids: string | string[]) {
  return standardDelete<Api.SystemManage.UserList>('user', ids);
}
