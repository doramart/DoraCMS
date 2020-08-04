import request from '@root/publicMethods/request'

export function pluginList(params) {
  return request({
    url: '/manage/plugin/getList',
    params,
    method: 'get'
  })
}

export function shopPluginList(params) {
  return request({
    url: '/manage/plugin/getPluginShopList',
    params,
    method: 'get'
  })
}

export function getOnePlugin(params) {
  return request({
    url: '/manage/plugin/getOne',
    params,
    method: 'get'
  })
}

export function getOneShopPlugin(params) {
  return request({
    url: '/manage/plugin/getOneShopPlugin',
    params,
    method: 'get'
  })
}

export function addPlugin(params) {
  return request({
    url: '/manage/plugin/installPlugin',
    params: Object.assign({}, params, {
      loadingConfig: {
        str: '正在安装插件，请勿刷新页面!',
        alwaysShow: true
      }
    }),
    method: 'get'
  })
}


export function deletePlugin(params) {
  return request({
    url: '/manage/plugin/unInstallPlugin',
    params: Object.assign({}, params, {
      loadingConfig: {
        str: '正在卸载插件，请勿刷新页面!',
        alwaysShow: true
      }
    }),
    method: 'get'
  })
}

export function pluginHeartBeat(params) {
  return request({
    url: '/manage/plugin/pluginHeartBeat',
    params: Object.assign({}, params, {
      loadingConfig: {
        str: '正在重启，请稍后...',
        alwaysShow: true
      }
    }),
    method: 'get'
  })
}

export function updatePlugin(params) {
  return request({
    url: '/manage/plugin/updatePlugin',
    params: Object.assign({}, params, {
      loadingConfig: {
        str: '正在更新插件，请勿刷新页面!',
        alwaysShow: true
      }
    }),
    method: 'get'
  })
}

export function createInvoice(data) {
  return request({
    url: '/manage/plugin/createInvoice',
    data,
    method: 'post'
  })
}

export function checkInvoice(data) {
  return request({
    url: '/manage/plugin/checkInvoice',
    data,
    method: 'post'
  })
}

export function enablePlugin(data) {
  return request({
    url: '/manage/plugin/enablePlugin',
    data,
    method: 'post'
  })
}