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

export function getClientNotice(params) {
  return request({
    url: '/manage/singleUser/getClientNotice',
    method: 'get',
    params
  })
}

export function getVersionMaintenanceInfo(params) {
  return request({
    url: '/manage/singleUser/getVersionMaintenanceInfo',
    method: 'get',
    params
  })
}
