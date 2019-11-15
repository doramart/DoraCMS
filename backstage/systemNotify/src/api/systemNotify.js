import request from '@root/publicMethods/request'



export function getSystemNotifyList(params) {
  return request({
    url: '/manage/systemNotify/getList',
    method: 'get',
    params
  })
}

export function deleteSystemNotify(params) {
  return request({
    url: '/manage/systemNotify/deleteNotifyItem',
    method: 'get',
    params
  })
}

export function setNoticeRead(params) {
  return request({
    url: '/manage/systemNotify/setHasRead',
    method: 'get',
    params
  })
}