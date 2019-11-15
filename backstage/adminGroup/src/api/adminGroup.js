import request from '@root/publicMethods/request'


export function adminGroupList(params) {
  return request({
    url: '/manage/adminGroup/getList',
    method: 'get',
    params
  })
}

export function getOneAdminGroup(params) {
  return request({
    url: '/manage/adminGroup/getOne',
    method: 'get',
    params
  })
}

export function addAdminGroup(data) {
  return request({
    url: '/manage/adminGroup/addOne',
    method: 'post',
    data
  })
}

export function updateAdminGroup(data) {
  return request({
    url: '/manage/adminGroup/updateOne',
    method: 'post',
    data
  })
}

export function deleteAdminGroup(params) {
  return request({
    url: '/manage/adminGroup/deleteGroup',
    method: 'get',
    params
  })
}