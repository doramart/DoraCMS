import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request({
    url: '/manage/role/getList',
    method: 'get',
    params
  });
}

/** create role item */
export function createRoleItem(params: Api.SystemManage.Role) {
  return request<Api.SystemManage.Role>({
    url: '/manage/role/addOne',
    method: 'post',
    data: { ...params }
  });
}

/** update role item */
export function updateRoleItem(params: Api.SystemManage.Role) {
  return request<Api.SystemManage.Role>({
    url: '/manage/role/updateOne',
    method: 'post',
    data: { ...params }
  });
}

/** delete role item */
export function deleteRoleList(ids: string | string[]) {
  return standardDelete<Api.SystemManage.RoleList>('role', ids);
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  return request({
    url: '/manage/role/getAllList',
    method: 'get'
  });
}
