/**
 * 全局校验类
 */
'use strict';
const validator = require('validator');

module.exports = {
  // 校验字符中是否有特殊字符
  isRegularCharacter(str = '') {
    const pattern = new RegExp(
      // eslint-disable-next-line quotes
      "`~@#$^&*()=|{}';'\\[\\].<>/~！@#￥……&*（）——|{}【】‘”“'"
    );
    if (pattern.test(str)) {
      return false;
    }
    return true;
  },
};
