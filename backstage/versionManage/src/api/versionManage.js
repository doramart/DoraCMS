import request from '@root/publicMethods/request'


export function versionManageList(params) {
  return request({
    url: '/manage/versionManage/getList',
    method: 'get',
    params
  })
}


export function updateVersionManage(data) {
  return request({
    url: '/manage/versionManage/updateOne',
    method: 'post',
    data
  })
}