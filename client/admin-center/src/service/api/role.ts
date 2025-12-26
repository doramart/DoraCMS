import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request({
    url: '/manage/v1/roles',
    method: 'get',
    params
  });
}

/** create role item */
export function createRoleItem(params: Api.SystemManage.Role) {
  return request<Api.SystemManage.Role>({
    url: '/manage/v1/roles',
    method: 'post',
    data: { ...params }
  });
}

/** update role item */
export function updateRoleItem(params: Api.SystemManage.Role) {
  return request<Api.SystemManage.Role>({
    url: `/manage/v1/roles/${params.id}`,
    method: 'put',
    data: { ...params }
  });
}

/** delete role item */
export function deleteRoleList(ids: string | string[]) {
  return standardDelete<Api.SystemManage.RoleList>('v1/roles', ids);
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  return request({
    url: '/manage/v1/roles/all',
    method: 'get'
  });
}
