import request from '@root/publicMethods/request'

export function contentMessageList(params) {
  return request({
    url: '/manage/contentMessage/getList',
    params,
    method: 'get'
  })
}

export function getOneContentMessage(params) {
  return request({
    url: '/manage/contentMessage/getOne',
    params,
    method: 'get'
  })
}

export function addContentMessage(data) {
  return request({
    url: '/manage/contentMessage/addOne',
    data,
    method: 'post'
  })
}


export function deleteContentMessage(params) {
  return request({
    url: '/manage/contentMessage/deleteMessage',
    params,
    method: 'get'
  })
}