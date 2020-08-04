import request from '@root/publicMethods/request'

export function hooksList(params) {
  return request({
    url: '/manage/hook/getList',
    params,
    method: 'get'
  })
}

export function getOneHook(params) {
  return request({
    url: '/manage/hook/getOne',
    params,
    method: 'get'
  })
}

export function addHook(data) {
  return request({
    url: '/manage/hook/addOne',
    data,
    method: 'post'
  })
}

export function updateHook(data) {
  return request({
    url: '/manage/hook/updateOne',
    data,
    method: 'post'
  })
}


export function deleteHook(params) {
  return request({
    url: '/manage/hook/delete',
    params,
    method: 'get'
  })
}