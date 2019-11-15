import request from '@root/publicMethods/request'

export function contentTagList(params) {
  return request({
    url: '/manage/contentTag/getList',
    params,
    method: 'get'
  })
}

export function getOneContentTag(params) {
  return request({
    url: '/manage/contentTag/getOne',
    params,
    method: 'get'
  })
}

export function addContentTag(data) {
  return request({
    url: '/manage/contentTag/addOne',
    data,
    method: 'post'
  })
}

export function updateContentTag(data) {
  return request({
    url: '/manage/contentTag/updateOne',
    data,
    method: 'post'
  })
}

export function deleteContentTag(params) {
  return request({
    url: '/manage/contentTag/deleteTag',
    params,
    method: 'get'
  })
}