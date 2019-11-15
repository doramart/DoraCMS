/**
 * Created by PanJiaChen on 16/11/18.
 */
const validator = require("validator");

export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export function checkEmail(str) {
  return str && validator.isEmail(str);
}

// 校验资源名称 必须是英文
export function checkUrl(str) {
  return str && validator.isURL(str);
}