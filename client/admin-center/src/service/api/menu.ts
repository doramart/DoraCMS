import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get menu list */
export function fetchGetMenuList(params?: any) {
  return request({
    url: '/manage/v1/menus',
    method: 'get',
    params
  });
}

/** create menu item */
export function createMenuItem(params: Api.SystemManage.Menu) {
  return request<Api.SystemManage.Menu>({
    url: '/manage/v1/menus',
    method: 'post',
    data: { ...params }
  });
}

/** update menu item */
export function updateMenuItem(params: Api.SystemManage.Menu) {
  return request<Api.SystemManage.Menu>({
    url: `/manage/v1/menus/${params.id}`,
    method: 'put',
    data: { ...params }
  });
}

/** delete menu item */
export function deleteMenuList(ids: string | string[]) {
  return standardDelete<Api.SystemManage.MenuList>('v1/menus', ids);
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    url: '/systemManage/getMenuTree',
    method: 'get'
  });
}

/** get all pages */
export function fetchGetAllPages() {
  return {
    data: [
      'home',
      '403',
      '404',
      '405',
      '500',
      'function_multi-tab',
      'function_tab',
      'exception_403',
      'exception_404',
      'exception_500',
      'multi-menu_first_child',
      'multi-menu_second_child_home',
      'manage_user',
      'manage_role',
      'manage_menu',
      'document_content-tag',
      'document_content-category',
      'manage_ads',
      'manage_system-option-log',
      'manage_system-config',
      'manage_backup-data',
      'manage_user-detail',
      'about',
      'manage_upload-file',
      'member_reg-user',
      'email_mail-template',
      'extend_template-config',
      'document_content-message',
      'extend_plugin',
      'remote-page'
    ]
  };
  // return request<string[]>({
  //   url: '/systemManage/getAllPages',
  //   method: 'get'
  // });
}
