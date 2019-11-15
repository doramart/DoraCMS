import request from '@root/publicMethods/request'



export function getUserInfo(params) {
  return request({
    url: '/manage/singleUser/getUserInfo',
    method: 'get',
    params
  })
}

export function logOut(params) {
  return request({
    url: '/manage/singleUser/logOut',
    method: 'get',
    params
  })
}


export function addSingleUser(data) {
  return request({
    url: '/manage/singleUser/doReg',
    data,
    method: 'post'
  })
}

export function loginSingleUser(data) {
  return request({
    url: '/manage/singleUser/doLogin',
    data,
    method: 'post'
  })
}

export function sendVerificationCode(data) {
  return request({
    url: '/manage/singleUser/sendVerificationCode',
    data,
    method: 'post'
  })
}