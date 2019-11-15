import request from '@root/publicMethods/request'


export function adminResourceList(params) {
  return request({
    url: '/manage/adminResource/getList',
    method: 'get',
    params
  })
}
