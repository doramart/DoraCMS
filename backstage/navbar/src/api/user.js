import request from '@root/publicMethods/request';


export function getInfo(token) {
  return request({
    url: '/manage/getUserSession',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/manage/logout',
    method: 'get'
  })
}

export function getRoleResources() {
  return request({
    url: '/manage/adminResource/getListByPower',
    method: 'get'
  })
}