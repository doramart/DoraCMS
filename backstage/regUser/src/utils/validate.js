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

// 校验字符中是否有特殊字符
export function isRegularCharacter(str = "") {
  var pattern = new RegExp("`~@#$^&*()=|{}';'\\[\\].<>/~！@#￥……&*（）——|{}【】‘”“'");
  if (pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

export function checkPhoneNum(str) {
  return str && validator.isNumeric(str.toString());
}