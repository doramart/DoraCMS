import request from '@root/publicMethods/request'


export function redictContentToUsers(data) {
  return request({
    url: '/manage/content/redictContentToUsers',
    data,
    method: 'post'
  })
}

export function updateContentEditor(data) {
  return request({
    url: '/manage/content/updateContentEditor',
    data,
    method: 'post'
  })
}

export function contentList(params) {
  return request({
    url: '/manage/content/getList',
    params,
    method: 'get'
  })
}

export function getOneContent(params) {
  return request({
    url: '/manage/content/getContent',
    params,
    method: 'get'
  })
}

export function addContent(data) {
  return request({
    url: '/manage/content/addOne',
    data,
    method: 'post'
  })
}

export function updateContent(data) {
  return request({
    url: '/manage/content/updateOne',
    data,
    method: 'post'
  })
}

export function updateManyContent(data) {
  return request({
    url: '/manage/content/updateContents',
    data,
    method: 'post'
  })
}

export function updateContentToTop(data) {
  return request({
    url: '/manage/content/topContent',
    data,
    method: 'post'
  })
}

export function roofContent(data) {
  return request({
    url: '/manage/content/roofContent',
    data,
    method: 'post'
  })
}

export function deleteContent(params) {
  return request({
    url: '/manage/content/deleteContent',
    params,
    method: 'get'
  })
}

export function getRandomContentImg(params) {
  return request({
    url: '/api/content/getRandomContentImg',
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

export function moveContentCate(data) {
  return request({
    url: '/manage/content/moveCate',
    data,
    method: 'post'
  })
}

export function uploadCover(data) {
  return request({
    url: '/api/content/uploadCover',
    data,
    method: 'post'
  })
}

export function coverList(params) {
  return request({
    url: '/api/content/getCoverList',
    params,
    method: 'get'
  })
}

export function coverInfo(params) {
  return request({
    url: '/api/content/getOneContentCover',
    params,
    method: 'get'
  })
}

export function contentCoverTypeList(params) {
  return request({
    url: '/api/content/getCoverTypeList',
    params,
    method: 'get'
  })
}