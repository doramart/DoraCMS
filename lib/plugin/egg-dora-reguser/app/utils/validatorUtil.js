/**
 * 全局校验类
 */
'use strict';
const validator = require('validator');

module.exports = {
  // 校验字符中是否有特殊字符
  isRegularCharacter(str = '') {
    const pattern = new RegExp(
      '`~@#$^&*()=|{}\';\'\\[\\].<>/~！@#￥……&*（）——|{}【】‘”“\''
    );
    if (pattern.test(str)) {
      return false;
    }
    return true;
  },
  validateWords(str) {
    const pattern = new RegExp('[<>#$%^*+*]');
    let newParams = '';
    for (let i = 0; i < str.length; i++) {
      newParams += str.substr(i, 1).replace(pattern, '');
    }
    return newParams;
  },

  // 校验资源名称 必须是英文
  checkResourceName(str, min = 2, max = 6) {
    return validator.isLength(str, min, max);
  },
  // 校验用户名
  checkUserName(str) {
    return /^[a-zA-Z][a-zA-Z0-9_]{4,11}$/.test(str);
  },
  // 校验中文GBK
  checkName(str, min = 2, max = 6) {
    return (
      str && validator.isLength(str, min, max) && /[\u4e00-\u9fa5]/.test(str)
    );
  },
  // 校验密码
  checkPwd(str, min = 6, max = 32) {
    return (
      str &&
      validator.isLength(str, 5, max) &&
      /(?!^\\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{6,}/.test(str)
    );
  },
  // 校验邮箱
  checkEmail(str) {
    return str && validator.isEmail(str);
  },
  // 校验手机号
  checkPhoneNum(str) {
    return str && validator.isNumeric(str.toString());
    // return str && validator.isMobilePhone(str.toString(), 'zh-CN');
  },
  // 校验QQ号
  checkQqNum(str) {
    return RegExp(/^[1-9][0-9]{4,9}$/).test(str);
  },

  checkUrl(str) {
    return str && validator.isURL(str);
  },
};
