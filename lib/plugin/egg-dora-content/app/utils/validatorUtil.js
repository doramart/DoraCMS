/**
 * 全局校验类
 */
const validator = require("validator");

module.exports = {

    // 校验字符中是否有特殊字符
    isRegularCharacter(str = "") {
        var pattern = new RegExp("`~@#$^&*()=|{}';'\\[\\].<>/~！@#￥……&*（）——|{}【】‘”“'");
        if (pattern.test(str)) {
            return false;
        } else {
            return true;
        }
    },
    
}