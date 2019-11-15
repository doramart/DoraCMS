import Cookies from 'js-cookie'
import settings from '@root/publicMethods/settings'

const TokenKey = settings.token_key;
const AdminVipTokenKey = settings.admin_token_key;
// type:0 后管  1: cms中台
export function getToken(type = '0') {
  let currentTokenKey = type == '0' ? TokenKey : AdminVipTokenKey
  return Cookies.get(currentTokenKey)
}

export function setToken(token, type = '0') {
  let currentTokenKey = type == '0' ? TokenKey : AdminVipTokenKey
  return Cookies.set(currentTokenKey, token)
}

export function removeToken(type = '0') {
  let currentTokenKey = type == '0' ? TokenKey : AdminVipTokenKey
  return Cookies.remove(currentTokenKey)
}