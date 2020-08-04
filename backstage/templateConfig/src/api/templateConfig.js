import request from '@root/publicMethods/request'


export function getMyTemplateList(params) {
  return request({
    url: '/manage/template/getMyTemplateList',
    params,
    method: 'get'
  })
}

export function addTemplateItem(data) {
  return request({
    url: '/manage/template/addTemplateItem',
    method: 'post',
    data
  })
}

export function delTemplateItem(params) {
  return request({
    url: '/manage/template/delTemplateItem',
    params,
    method: 'get'
  })
}

export function getTemplateItemlist(params) {
  return request({
    url: '/manage/template/getTemplateItemlist',
    params,
    method: 'get'
  })
}

export function getTemplatelistfromShop(params) {
  return request({
    url: '/manage/template/getTempsFromShop',
    params,
    method: 'get'
  })
}

export function installTemp(params) {
  return request({
    url: '/manage/template/installTemp',
    params,
    method: 'get'
  })
}

export function updateTemp(params) {
  return request({
    url: '/manage/template/updateTemp',
    params,
    method: 'get'
  })
}

export function enableTemp(params) {
  return request({
    url: '/manage/template/enableTemp',
    params,
    method: 'get'
  })
}

export function uninstallTemp(params) {
  return request({
    url: '/manage/template/uninstallTemp',
    params,
    method: 'get'
  })
}

export function createInvoice(data) {
  return request({
    url: '/manage/template/createInvoice',
    data,
    method: 'post'
  })
}

export function checkInvoice(data) {
  return request({
    url: '/manage/template/checkInvoice',
    data,
    method: 'post'
  })
}