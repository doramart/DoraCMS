import request from '@root/publicMethods/request'


export function adminResourceList(params) {
  return request({
    url: '/manage/adminResource/getList',
    method: 'get',
    params
  })
}


export function getOneAdminResource(params) {
  return request({
    url: '/manage/adminResource/getOne',
    method: 'get',
    params
  })
}

export function addAdminResource(data) {
  return request({
    url: '/manage/adminResource/addOne',
    method: 'post',
    data
  })
}

export function updateAdminResource(data) {
  return request({
    url: '/manage/adminResource/updateOne',
    method: 'post',
    data
  })
}

export function updateResourceParentId(data) {
  return request({
    url: '/manage/adminResource/updateParentId',
    method: 'post',
    data
  })
}

export function deleteAdminResource(params) {
  return request({
    url: '/manage/adminResource/deleteResource',
    method: 'get',
    params
  })
}