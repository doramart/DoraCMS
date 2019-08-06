/**
 * nunjucks 自定义过滤器
 */


const _ = require('lodash');
const settings = require('@configs/settings');
const nunjucks = require('nunjucks')

const path = require('path')

module.exports = async (app) => {

    let env = nunjucks.configure(path.join(__dirname, '../../views'), { // 设置模板文件的目录，为views
        noCache: process.env.NODE_ENV !== 'production',
        autoescape: true,
        express: app
    });

    let splitStr = () => {
        let str = [' ', '  '];
        if (settings.lang == 'en') {
            str = ['  ', '    ']
        }
        return str;
    };

    // 自定义过滤器
    env.addFilter('hightWords', (str, searchkey) => {
        let newStr = str.replace(new RegExp(searchkey, 'gi'), '<span class="searchkey">' + searchkey + '</span>');
        return newStr;
    })

    env.addFilter('renderKeywords', (str) => {
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
    })

    env.addFilter('cutwords', function (str, n, dot = true) {
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
        if (str && str.split(splitStr()[0]).length == 2) {
            let strArr = str.split(splitStr()[0]);
            newStr = strArr[0] + label
        }
        return newStr;
    })

    env.addFilter('inputNotNull', function (str, label = '') {
        let newStr = "";
        if (str && str.split(splitStr()[0]).length == 2) {
            let strArr = str.split(splitStr()[0]);
            newStr = strArr[0] + ' ' + label.toLowerCase()
        }
        return newStr;
    })

    env.addFilter('ranglengthandnormal', function (str, min, max, label = '') {
        let newStr = "";
        if (str && str.split(splitStr()[0]).length == 7) {
            let strArr = str.split(splitStr()[0]);
            newStr = strArr[0] + ' ' + label.toLowerCase() + ' ' + strArr[2] + ' ' + min.toString() + ' ' + strArr[4] + ' ' + max.toString() + ' ' + strArr[6]
        }
        return newStr;
    })

    env.addFilter('rangelength', function (str, min, max, label = '') {
        let newStr = "";
        if (str && str.split(splitStr()[0]).length == 6) {
            let strArr = str.split(splitStr()[0]);
            newStr = label + strArr[1] + ' ' + min.toString() + ' ' + strArr[3] + ' ' + max.toString() + ' ' + strArr[5]
        }
        return newStr;
    })

    env.addFilter('format_bytes', function (size, delimiter = '') {
        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        for (var i = 0; size >= 1024 && i < 5; i++) size /= 1024;
        return Math.round(size * 100) / 100 + delimiter + units[i];
    });

    /**
     * 格式化时间
     */
    env.addFilter('format_time', function (D, sec) {
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
    });
    /**
     * moment
     * YYYY-MM-DD HH:mm:ss
     * lll
     */
    env.addFilter('moment', function (time, config) {
        const moment = require('moment');
        moment.locale('zh-cn');
        if (_.isEmpty(config)) {
            return moment(time).fromNow();
        } else {
            return moment(time).format(config);
        }
    });

    env.addFilter('strToJson', function (str) {
        if (!_.isEmpty(str) && str != 0) {
            return JSON.parse(str);
        }
    });

    env.addFilter('jsonToStr', function (json) {
        if (!_.isEmpty(json)) {
            return JSON.stringify(json);
        }
    });

    env.addFilter('strToArray', function (str, sn = ',') {
        if (!_.isEmpty(str)) {
            const ss = str.split(sn); // 在每个逗号(,)处进行分解。
            // console.log(ss);
            return ss;
        } else {
            return str;
        }
    });

    env.addFilter('in_Array', function (str, arr) {
        arr = arr || 0;
        if (!_.isArray(arr)) {
            if (_.isNumber(arr)) {
                arr = "'" + arr + "'";
            }
            arr = arr.split(',');
        }
        // console.log(arr);
        return in_array(str, arr);
    });

    env.addFilter('isempty', function (any) {
        return _.isEmpty(any);
    });

    /**
     * 时间戳格式化 dateformat('Y-m-d H:i:s')
     * @param extra 'Y-m-d H:i:s'
     * @param date  时间戳
     * @return  '2015-12-17 15:39:44'
     */
    env.addFilter('dateformat', function (extra, date) {
        return dateformat(date, extra);
    });

    /**
     * 获取文档封面图
     */
    env.addFilter('get_cover', async (cover_id, field, callback) => {
        const data = await get_cover(cover_id, field);
        callback(null, data);
    }, true);
    /**
     * {{id|get_pic("m=1,w=200,h=200")}}
     */
    env.addFilter('get_pic', async (id, type, callback) => {
        let m, w, h;
        // console.log(type);
        const obj = {};
        for (let v of type.split(',')) {
            v = v.split('=');
            obj[v[0]] = v[1];
        }
        m = obj.m;
        w = obj.w;
        h = obj.h;
        const data = await get_pic(id, m, w, h);
        callback(null, data);
    }, true);

    /**
     * 获取当前事件 时间戳
     */
    env.addFilter('getnow', function () {
        return new Date().getTime();
    });
    /**
     * 字符串在指定位置插入内容
     * str表示原字符串变量，flg表示要插入的字符串，sn表示要插入的位置
     */
    env.addFilter('insert_flg', (str, flg, sn) => {
        let newstr = '';
        for (let i = 0; i < str.length; i += sn) {
            var tmp = str.substring(i, i + sn);
            newstr += tmp + flg;
        }
        return newstr;
    });
    /**
     * 字符串在指定位截断
     * str表示原字符串变量，flg表示要插入的字符串，sn表示要截断位置
     */
    env.addFilter('block', (str, sn, flg) => {
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
    });
    /**
     * 过滤html标签
     *
     */
    env.addFilter('delhtmltags', (str) => {
        if (!_.isEmpty(str)) {
            return str.replace(/<[^>]+>/g, ''); // 去掉所有的html标记
        } else {
            return '';
        }
    });
    /**
     * 获取文件信息
     * @param file_id 文件id
     * @param field 字段名,如果为空则返回整个记录集
     * @returns {*}
     */
    env.addFilter('get_file', async (file_id, field, key, callback) => {
        const data = await get_file(file_id, field, key);
        callback(null, data);
    }, true);



    env.addExtension('remote', new remote());

}