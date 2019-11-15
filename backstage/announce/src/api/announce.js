import request from '@root/publicMethods/request'


export function getSystemAnnounceList(params) {
  return request({
    url: '/manage/systemAnnounce/getList',
    method: 'get',
    params
  })
}

export function deleteSystemAnnounce(params) {
  return request({
    url: '/manage/systemAnnounce/deleteItem',
    method: 'get',
    params
  })
}

export function addSystemAnnounce(data) {
  return request({
    url: '/manage/systemAnnounce/addOne',
    method: 'post',
    data
  })
}