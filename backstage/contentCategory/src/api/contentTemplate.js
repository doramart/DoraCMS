import request from '@root/publicMethods/request'

export function getMyTemplateList(params) {
  return request({
    url: '/manage/template/getMyTemplateList',
    params,
    method: 'get'
  })
}