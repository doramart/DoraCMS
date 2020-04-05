import request from '@root/publicMethods/request'


export function getBakDataList(params) {
  return request({
    url: '/manage/backupDataManage/getBakList',
    method: 'get',
    params
  })
}

export function bakUpCMSData(data) {
  return request({
    url: '/manage/backupDataManage/backUp',
    method: 'post',
    data
  })
}

export function restoreCMSData(data) {
  return request({
    url: '/manage/backupDataManage/restore',
    method: 'post',
    data
  })
}

export function deletetBakDataItem(params) {
  return request({
    url: '/manage/backupDataManage/deleteDataItem',
    method: 'get',
    params
  })
}