import { request } from '../request';

/** Get installed plugin list */
export function fetchGetPluginList(params?: Api.PluginManage.PluginSearchParams) {
  return request({
    url: '/manage/v1/plugins',
    method: 'get',
    params
  });
}

/** Get plugin shop list */
export function fetchGetPluginShopList(params?: Api.PluginManage.PluginSearchParams) {
  return request({
    url: '/manage/v1/plugins/shop',
    method: 'get',
    params
  });
}

/** Get plugin shop item detail */
export function getOneShopPlugin(id: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/shop/${id}`,
    method: 'get'
  });
}

/** Install plugin */
export function installPlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/${pluginId}/install`,
    method: 'post'
  });
}

/** Uninstall plugin */
export function unInstallPlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/${pluginId}/uninstall`,
    method: 'post'
  });
}

/** Update plugin */
export function updatePlugin(pluginId: string) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/${pluginId}/update`,
    method: 'post'
  });
}

/** Enable plugin */
export function enablePlugin(params: { id: string; state: boolean }) {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/${params.id}/enable`,
    method: 'put',
    data: { state: params.state }
  });
}

/** Plugin heart beat */
export function pluginHeartBeat() {
  return request<Api.PluginManage.Plugin>({
    url: `/manage/v1/plugins/heartbeat`,
    method: 'get'
  });
}

/** Create plugin invoice */
export function createInvoice(params: { pluginId: string }) {
  return request<Api.PluginManage.Invoice>({
    url: `/manage/v1/plugins/invoice`,
    method: 'post',
    data: params
  });
}

/** Check invoice */
export function checkInvoice(params: { noInvoice: string }) {
  return request<Api.PluginManage.InvoiceCheckResult>({
    url: `/manage/v1/plugins/invoice/check`,
    method: 'get',
    params
  });
}
