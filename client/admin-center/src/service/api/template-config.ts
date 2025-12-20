import { request } from '../request';

/** get installed template list */
export function fetchGetMyTemplateList() {
  return request<Api.PluginManage.Template[]>({
    url: '/manage/template/getList',
    method: 'get'
  });
}

/** get template market list */
export function fetchGetTempsFromShop(params?: { current?: number; size?: number }) {
  return request<Api.PluginManage.TemplateShopResponse>({
    url: '/manage/template/getTempsFromShop',
    method: 'get',
    params
  });
}


/** add template item */
export function addTemplateItem(params: Api.PluginManage.TemplateItemAdd) {
  return request<{ id: string }>({
    url: '/manage/template/addTemplateItem',
    method: 'post',
    data: params
  });
}

/** delete template item */
export function deleteTemplateItem(id: string) {
  return request({
    url: `/manage/template/delTemplateItem?id=${id}`,
    method: 'get'
  });
}

/** install template */
export function installTemplate(tempId: string) {
  return request({
    url: `/manage/template/installFromRemote`,
    method: 'post',
    data: {
      tempId,
    }
  });
}

/** update template */
export function updateTemplate(tempId: string) {
  return request({
    url: `/manage/template/updateTemp?tempId=${tempId}`,
    method: 'get'
  });
}

/** enable template */
export function enableTemplate(tempId: string) {
  return request({
    url: `/manage/template/activate/${tempId}`,
    method: 'post'
  });
}

/** uninstall template */
export function uninstallTemplate(tempId: string) {
  return request({
    url: `/manage/template/uninstall/${tempId}`,
    method: 'post'
  });
}

/** create payment invoice */
export function createPaymentInvoice(params: { tempId: string; singleUserToken: string }) {
  return request<{ qrCode: string; noInvoice: string }>({
    url: '/manage/template/createInvoice',
    method: 'post',
    data: params
  });
}

/** check payment status */
export function checkPaymentStatus(params: { noInvoice: string; singleUserToken: string; itemId: string }) {
  return request<{ checkState: boolean }>({
    url: '/manage/template/checkInvoice',
    method: 'post',
    data: params
  });
}

/** upload custom template */
export function uploadTemplate(formData: FormData) {
  return request({
    url: '/manage/template/uploadCMSTemplate',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/** 获取模板统计信息 */
export function fetchTemplateStats(params?: { status?: string }) {
  return request<Api.PluginManage.TemplateStats>({
    url: '/manage/template/getStats',
    method: 'get',
    params
  });
}

/** 获取当前已激活模板 */
export function fetchActiveTemplate() {
  return request<Api.PluginManage.Template>({
    url: '/manage/template/getActiveTheme',
    method: 'get'
  });
}
