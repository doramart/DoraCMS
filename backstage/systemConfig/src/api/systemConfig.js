import request from '@root/publicMethods/request'


export function getSystemConfigs(params) {
  return request({
    url: '/manage/systemConfig/getConfig',
    method: 'get',
    params
  })
}


export function updateSystemConfigs(data) {
  return request({
    url: '/manage/systemConfig/updateConfig',
    method: 'post',
    data
  })
}