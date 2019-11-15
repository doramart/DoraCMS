import request from '@root/publicMethods/request'

export function contentCategoryList(params) {
  return request({
    url: '/manage/contentCategory/getList',
    params,
    method: 'get'
  })
}

export function getOneContentCategory(params) {
  return request({
    url: '/manage/contentCategory/getOne',
    params,
    method: 'get'
  })
}

export function addContentCategory(data) {
  return request({
    url: '/manage/contentCategory/addOne',
    data,
    method: 'post'
  })
}

export function updateContentCategory(data) {
  return request({
    url: '/manage/contentCategory/updateOne',
    data,
    method: 'post'
  })
}

export function deleteContentCategory(params) {
  return request({
    url: '/manage/contentCategory/deleteCategory',
    params,
    method: 'get'
  })
}