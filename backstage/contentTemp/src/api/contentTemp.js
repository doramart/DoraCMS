import request from '@root/publicMethods/request'


export function adminTemplateList(params) {
  return request({
    url: '/manage/template/getTemplateForderList',
    method: 'get',
    params
  })
}
export function getTemplateFileInfo(params) {
  return request({
    url: '/manage/template/getTemplateFileText',
    method: 'get',
    params
  })
}
export function updateTemplateFileText(data) {
  return request({
    url: '/manage/template/updateTemplateFileText',
    method: 'post',
    data
  })
}