/**
 * nunjucks 自定义过滤器
 */


const _ = require('lodash');


module.exports = {

    // 自定义过滤器
    hightWords(str, searchkey) {
        let newStr = str.replace(new RegExp(searchkey, 'gi'), '<span class="searchkey">' + searchkey + '</span>');
        return newStr;
    },

    renderKeywords(str) {
        let newStr = str;
        if (str && str.indexOf(',') >= 0) {
            newStr = "";
            let strArr = str.split(',');
            for (let i = 0; i < strArr.length; i++) {
                let dotStr = ', ';
                if (i == strArr.length - 1) {
                    dotStr = ''
                }
                newStr += '#' + strArr[i] + dotStr
            }
        }
        return newStr;
    },

    cutwords(str, n, dot = true) {
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
        if (dot)(str = str + '...')
        return str;
    },

    formatDateForMini(date, type = 'mini') {
        let newStr = "";
        if (type == 'mini') {
            newStr = date.substring(date.length - 8, date.length - 3);
        } else if (type == 'month') {
            newStr = date.substring(0, 7);
        } else if (type == 'date') {
            newStr = date.substring(0, 10);
        } else if (type == 'justdate') {
            newStr = date.substring(8, 10);
        }
        return newStr;
    },


    format_bytes(size, delimiter = '') {
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        for (var i = 0; size >= 1024 && i < 5; i++) size /= 1024;
        return Math.round(size * 100) / 100 + delimiter + units[i];
    },

    /**
     * 格式化时间
     */
    format_time(D, sec) {
        let time;
        const date = new Date(D);
        const y = date.getFullYear();
        let M = date.getMonth() + 1;
        M = M < 10 ? '0' + M : M;
        let d = date.getDate();
        d = d < 10 ? '0' + d : d;
        let h = date.getHours();
        h = h < 10 ? '0' + h : h;
        let m = date.getMinutes();
        m = m < 10 ? '0' + m : m;
        let s = date.getSeconds();
        s = s < 10 ? '0' + s : s;
        if (sec) {
            time = y + '-' + M + '-' + d + ' ' + h + ':' + m + ':' + s;
        } else {
            time = y + '-' + M + '-' + d + ' ' + h + ':' + m;
        }
        return time;
    },
    /**
     * moment
     * YYYY-MM-DD HH:mm:ss
     * lll
     */
    moment(time, config) {
        const moment = require('moment');
        moment.locale('zh-cn');
        if (_.isEmpty(config)) {
            return moment(time).fromNow();
        } else {
            return moment(time).format(config);
        }
    },

    strToJson(str) {
        if (!_.isEmpty(str) && str != 0) {
            return JSON.parse(str);
        }
    },

    jsonToStr(json) {
        if (!_.isEmpty(json)) {
            return JSON.stringify(json);
        }
    },

    strToArray(str, sn = ',') {
        if (!_.isEmpty(str)) {
            const ss = str.split(sn); // 在每个逗号(,)处进行分解。
            // console.log(ss);
            return ss;
        } else {
            return str;
        }
    },

    in_Array(str, arr) {
        arr = arr || 0;
        if (!_.isArray(arr)) {
            if (_.isNumber(arr)) {
                arr = "'" + arr + "'";
            }
            arr = arr.split(',');
        }
        // console.log(arr);
        return in_array(str, arr);
    },

    isempty(any) {
        return _.isEmpty(any);
    },

    /**
     * 时间戳格式化 dateformat('Y-m-d H:i:s')
     * @param extra 'Y-m-d H:i:s'
     * @param date  时间戳
     * @return  '2015-12-17 15:39:44'
     */
    dateformat(extra, date) {
        return dateformat(date, extra);
    },



    /**
     * 获取当前事件 时间戳
     */
    getnow() {
        return new Date().getTime();
    },
    /**
     * 字符串在指定位置插入内容
     * str表示原字符串变量，flg表示要插入的字符串，sn表示要插入的位置
     */
    insert_flg(str, flg, sn) {
        let newstr = '';
        for (let i = 0; i < str.length; i += sn) {
            var tmp = str.substring(i, i + sn);
            newstr += tmp + flg;
        }
        return newstr;
    },
    /**
     * 字符串在指定位截断
     * str表示原字符串变量，flg表示要插入的字符串，sn表示要截断位置
     */
    block(str, sn, flg) {
        let newstr = '';
        if (_.isEmpty(flg)) {
            flg = '...';
        }
        if (!_.isEmpty(str)) {
            if (sn >= str.length) {
                newstr = str;
            } else {
                newstr = str.substring(0, sn);
            }
        }
        return newstr + flg;
    },
    /**
     * 过滤html标签
     *
     */
    delhtmltags(str) {
        if (!_.isEmpty(str)) {
            return str.replace(/<[^>]+>/g, ''); // 去掉所有的html标记
        } else {
            return '';
        }
    },




}