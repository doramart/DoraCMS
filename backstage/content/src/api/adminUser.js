import request from '@root/publicMethods/request';


export function getInfo(token) {
  return request({
    url: '/manage/getUserSession',
    method: 'get'
  })
}
