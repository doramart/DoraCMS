import { request } from '../request';

/** Get installed plugin list */
export function fetchGetPluginList(params?: Api.PluginManage.PluginSearchParams) {
  return request({
    url: '/manage/plugin/getList',
    method: 'get',
    params
  });
}

/** Get plugin shop list */
export function fetchGetPluginShopList(params?: Api.PluginManage.PluginSearchParams) {
  return request({
    url: '/manage/plugin/getPluginShopList',
    method: 'get',
    params
  });
}

/** Get plugin shop item detail */
export function getOneShopPlugin(id: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/getOneShopPlugin`,
    method: 'get',
    params: { id }
  });
}

/** Install plugin */
export function installPlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/installPlugin`,
    method: 'get',
    params: { pluginId }
  });
}

/** Uninstall plugin */
export function unInstallPlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/unInstallPlugin`,
    method: 'get',
    params: { pluginId }
  });
}

/** Update plugin */
export function updatePlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/updatePlugin`,
    method: 'get',
    params: { pluginId }
  });
}

/** Enable plugin */
export function enablePlugin(params: { id: string; state: boolean }) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/enablePlugin`,
    method: 'get',
    params
  });
}

/** Plugin heart beat */
export function pluginHeartBeat() {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/plugin/pluginHeartBeat`,
    method: 'get'
  });
}

/** Create plugin invoice */
export function createInvoice(params: { pluginId: string }) {
  return request<Api.PluginManage.Invoice>({
    url: `/manage/plugin/createInvoice`,
    method: 'post',
    data: params
  });
}

/** Check invoice */
export function checkInvoice(params: { noInvoice: string }) {
  return request<Api.PluginManage.InvoiceCheckResult>({
    url: `/manage/plugin/checkInvoice`,
    method: 'get',
    params
  });
}
