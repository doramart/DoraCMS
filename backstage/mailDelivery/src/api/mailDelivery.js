import request from '@root/publicMethods/request'

export function mailDeliveryList(params) {
  return request({
    url: '/manage/mailDelivery/getList',
    params,
    method: 'get'
  })
}

export function mailTemplateList(params) {
  return request({
    url: '/api/mailTemplate/getList',
    params,
    method: 'get'
  })
}

export function getOneMailDelivery(params) {
  return request({
    url: '/manage/mailDelivery/getOne',
    params,
    method: 'get'
  })
}

export function addMailDelivery(data) {
  return request({
    url: '/manage/mailDelivery/addOne',
    data,
    method: 'post'
  })
}

export function updateMailDelivery(data) {
  return request({
    url: '/manage/mailDelivery/updateOne',
    data,
    method: 'post'
  })
}


export function deleteMailDelivery(params) {
  return request({
    url: '/manage/mailDelivery/delete',
    params,
    method: 'get'
  })
}


export function regUserList(params) {
  return request({
    url: '/manage/regUser/getList',
    params,
    method: 'get'
  })
}

export function sendLogList(params) {
  return request({
    url: '/manage/mailDelivery/getSendLogList',
    params,
    method: 'get'
  })
}