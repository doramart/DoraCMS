import request from '@root/publicMethods/request'


export function doRenderCms(data) {
  return request({
    url: '/manage/renderCms/justdo',
    data,
    method: 'post'
  })
}

export function databaseResouce(params) {
  return request({
    url: '/manage/renderCms/getAdminResources',
    params,
    method: 'get'
  })
}

export function projectConfigrationList(params) {
  return request({
    url: '/manage/renderCms/getProList',
    params,
    method: 'get'
  })
}

export function getOneprojectConfigration(params) {
  return request({
    url: '/manage/renderCms/getOnePro',
    params,
    method: 'get'
  })
}

export function addProjectConfigration(data) {
  return request({
    url: '/manage/renderCms/addOnePro',
    data,
    method: 'post'
  })
}

export function updateProjectConfigration(data) {
  return request({
    url: '/manage/renderCms/updateOnePro',
    data,
    method: 'post'
  })
}


export function deleteProjectConfigration(params) {
  return request({
    url: '/manage/renderCms/deletePro',
    params,
    method: 'get'
  })
}