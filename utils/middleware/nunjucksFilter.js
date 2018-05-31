/**
 * nunjucks 自定义过滤器
 */

const siteFunc = require('../siteFunc');

module.exports = (env) => {

    let splitStr = siteFunc.renderLocalStr();
    // 自定义过滤器
    env.addFilter('hightWords', (str, searchkey) => {
        let newStr = str.replace(new RegExp(searchkey, 'gi'), '<span class="searchkey">' + searchkey + '</span>');
        return newStr;
    })

    env.addFilter('cutwords', function (str, n) {
        let newStr = "";
        if (!str) return '';
        var r = /[^\x00-\xff]/g;
        var m;
        if (str.replace(r, '**').length > n) {
            m = Math.floor(n / 2);
            for (var i = m, l = str.length; i < l; i++) {
                if (str.substr(0, i).replace(r, '**').length >= n) {
                    return str.substr(0, i);
                }
            }
        }
        return str;
    });

    env.addFilter('formatDateForMini', function (date, type = 'mini') {
        let newStr = "";
        if (type == 'mini') {
            newStr = date.substring(date.length - 8, date.length - 3);
        } else if (type == 'date') {
            newStr = date.substring(0, 10);
        }
        return newStr;
    })

    // 格式化输入框校验
    env.addFilter('inputCurrent', function (str, label = '') {
        let newStr = "";
        if (str && str.split(splitStr[0]).length == 2) {
            let strArr = str.split(splitStr[0]);
            newStr = strArr[0] + label
        }
        return newStr;
    })

    env.addFilter('inputNotNull', function (str, label = '') {
        let newStr = "";
        if (str && str.split(splitStr[0]).length == 2) {
            let strArr = str.split(splitStr[0]);
            newStr = strArr[0] + ' ' + label
        }
        return newStr;
    })

    env.addFilter('ranglengthandnormal', function (str, min, max, label = '') {
        let newStr = "";
        if (str && str.split(splitStr[0]).length == 6) {
            let strArr = str.split(splitStr[0]);
            newStr = label + strArr[1] + ' ' + min.toString() + ' ' + strArr[3] + ' ' + max.toString() + ' ' + strArr[5]
        }
        return newStr;
    })

    env.addFilter('rangelength', function (str, min, max, label = '') {
        let newStr = "";
        if (str && str.split(splitStr[1]).length == 3) {
            let strArr = str.split(splitStr[1]);
            newStr = label + strArr[0] + ' ' + min.toString() + ' ' + strArr[1] + ' ' + max.toString() + ' ' + strArr[2]
        }
        return newStr;
    })

}