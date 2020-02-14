import request from '@root/publicMethods/request'

export function mailTemplateList(params) {
  return request({
    url: '/manage/mailTemplate/getList',
    params,
    method: 'get'
  })
}

export function mailTemplateTypeList(params) {
  return request({
    url: '/manage/mailTemplate/getTypeList',
    params,
    method: 'get'
  })
}

export function getOneMailTemplate(params) {
  return request({
    url: '/manage/mailTemplate/getOne',
    params,
    method: 'get'
  })
}

export function addMailTemplate(data) {
  return request({
    url: '/manage/mailTemplate/addOne',
    data,
    method: 'post'
  })
}

export function updateMailTemplate(data) {
  return request({
    url: '/manage/mailTemplate/updateOne',
    data,
    method: 'post'
  })
}


export function deleteMailTemplate(params) {
  return request({
    url: '/manage/mailTemplate/delete',
    params,
    method: 'get'
  })
}