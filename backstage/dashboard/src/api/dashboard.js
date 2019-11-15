import request from '@root/publicMethods/request'


export function getSiteBasicInfo(params) {
  return request({
    url: '/manage/getSitBasicInfo',
    method: 'get',
    params
  })
}

export function getUserSession(params) {
  return request({
    url: '/manage/getUserSession',
    method: 'get',
    params
  })
}