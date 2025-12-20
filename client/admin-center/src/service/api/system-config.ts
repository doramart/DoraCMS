import { request } from '../request';
import { standardDelete } from './deleteHelper';

/** get system configs */
export function fetchGetSystemConfigs(params: any) {
  return request({
    url: '/api/systemConfig/getConfig',
    method: 'get',
    params
  });
}

/** get system config list */
export function fetchGetSystemConfigList(params: Api.Common.CommonSearchParams) {
  return request({
    url: '/manage/systemConfig/getConfig',
    method: 'get',
    params
  });
}

/** create system config item */
export function createSystemConfigItem(params: Api.SystemManage.SystemConfig) {
  return request<Api.SystemManage.SystemConfig>({
    url: '/manage/systemConfig/addOne',
    method: 'post',
    data: { ...params }
  });
}

/** update system config item */
export function updateSystemConfigItem(params: Api.SystemManage.SystemConfig) {
  return request<Api.SystemManage.SystemConfig>({
    url: '/manage/systemConfig/updateConfig',
    method: 'post',
    data: { ...params }
  });
}

/** delete system config item */
export function deleteSystemConfigItem(ids: string | string[]) {
  return standardDelete<Api.SystemManage.SystemConfigList>('systemConfig', ids);
}
