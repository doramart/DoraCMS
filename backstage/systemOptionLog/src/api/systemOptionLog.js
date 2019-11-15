import request from '@root/publicMethods/request'


export function getSystemOptionLogsList(params) {
  return request({
    url: '/manage/systemOptionLog/getList',
    method: 'get',
    params
  })
}

export function deleteSystemOptionLogs(params) {
  return request({
    url: '/manage/systemOptionLog/deleteLogItem',
    method: 'get',
    params
  })
}

export function clearSystemOptionLogs(params) {
  return request({
    url: '/manage/systemOptionLog/deleteAllLogItem',
    method: 'get',
    params
  })
}