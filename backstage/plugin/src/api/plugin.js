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
    params,
    method: 'get'
  })
}


export function deletePlugin(params) {
  return request({
    url: '/manage/plugin/unInstallPlugin',
    params,
    method: 'get'
  })
}

export function updatePlugin(params) {
  return request({
    url: '/manage/plugin/updatePlugin',
    params,
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