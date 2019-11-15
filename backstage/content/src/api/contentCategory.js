import request from '@root/publicMethods/request'



export function contentCategoryList(params) {
  return request({
    url: '/manage/contentCategory/getList',
    params,
    method: 'get'
  })
}
