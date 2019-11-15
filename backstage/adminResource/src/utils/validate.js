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

// 校验资源名称 必须是英文
export function checkResourceName(str, min = 2, max = 6) {
  return validator.isLength(str, min, max);
}