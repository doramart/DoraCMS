import request from '@root/publicMethods/request'

export function helpCenterList(params) {
  return request({
    url: '/manage/helpCenter/getList',
    params,
    method: 'get'
  })
}

export function getOneHelpCenter(params) {
  return request({
    url: '/manage/helpCenter/getOne',
    params,
    method: 'get'
  })
}

export function addHelpCenter(data) {
  return request({
    url: '/manage/helpCenter/addOne',
    data,
    method: 'post'
  })
}

export function updateHelpCenter(data) {
  return request({
    url: '/manage/helpCenter/updateOne',
    data,
    method: 'post'
  })
}


export function deleteHelpCenter(params) {
  return request({
    url: '/manage/helpCenter/delete',
    params,
    method: 'get'
  })
}