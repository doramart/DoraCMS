/**
 * Created by PanJiaChen on 16/11/18.
 */
const validator = require("validator");
/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.indexOf(str.trim()) >= 0
}


// 校验用户名
export function checkUserName(str) {
  return /^[a-zA-Z][a-zA-Z0-9_]{4,11}$/.test(str);
}

// 校验中文GBK
export function checkName(str, min = 2, max = 6) {
  return str && validator.isLength(str, min, max) && /[\u4e00-\u9fa5]/.test(str);
}

// 校验密码
export function checkPwd(str, min = 6, max = 32) {
  return str && validator.isLength(str, 5, max) && /(?!^\\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{6,}/.test(str);
}

// 校验邮箱
export function checkEmail(str) {
  return str && validator.isEmail(str);
}

// 校验手机号
export function checkPhoneNum(str) {
  return str && validator.isNumeric(str.toString());
  // return str && validator.isMobilePhone(str.toString(), 'zh-CN');
}

// 校验QQ号
export function checkQqNum(str) {
  return RegExp(/^[1-9][0-9]{4,9}$/).test(str);
}

export function checkUrl(str) {
  return str && validator.isURL(str);
}