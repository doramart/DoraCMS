import request from '@root/publicMethods/request'

export function getAdsList(params) {
  return request({
    url: '/manage/ads/getList',
    method: 'get',
    params
  })
}

export function getOneAd(params) {
  return request({
    url: '/manage/ads/getOne',
    method: 'get',
    params
  })
}

export function addOneAd(data) {
  return request({
    url: '/manage/ads/addOne',
    method: 'post',
    data
  })
}

export function updateAds(data) {
  return request({
    url: '/manage/ads/updateOne',
    method: 'post',
    data
  })
}

export function delAds(params) {
  return request({
    url: '/manage/ads/delete',
    method: 'get',
    params
  })
}