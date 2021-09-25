/**
 * nunjucks 自定义过滤器
 */

'use strict';
const _ = require('lodash');

module.exports = {
  // 自定义过滤器
  hightWords(str, searchkey) {
    const newStr = str.replace(
      new RegExp(searchkey, 'gi'),
      '<span class="searchkey">' + searchkey + '</span>'
    );
    return newStr;
  },

  renderKeywords(str) {
    let newStr = str;
    if (str && str.indexOf(',') >= 0) {
      newStr = '';
      const strArr = str.split(',');
      for (let i = 0; i < strArr.length; i++) {
        let dotStr = ', ';
        if (i === strArr.length - 1) {
          dotStr = '';
        }
        newStr += '#' + strArr[i] + dotStr;
      }
    }
    return newStr;
  },

  cutwords(str, n, dot = true) {
    if (!str) return '';
    const r = /[^\x00-\xff]/g;
    let m;
    if (str.replace(r, '**').length > n) {
      m = Math.floor(n / 2);
      for (let i = m, l = str.length; i < l; i++) {
        if (str.substr(0, i).replace(r, '**').length >= n) {
          return str.substr(0, i);
        }
      }
    }
    if (dot) str = str + '...';
    return str;
  },

  formatDateForMini(date, type = 'mini') {
    let newStr = '';
    if (type === 'mini') {
      newStr = date.substring(date.length - 8, date.length - 3);
    } else if (type === 'month') {
      newStr = date.substring(0, 7);
    } else if (type === 'date') {
      newStr = date.substring(0, 10);
    } else if (type === 'justdate') {
      newStr = date.substring(8, 10);
    }
    return newStr;
  },

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

  moment(time, config) {
    const moment = require('moment');
    moment.locale('zh-cn');
    if (_.isEmpty(config)) {
      return moment(time).fromNow();
    }
    return moment(time).format(config);
  },

  strToJson(str) {
    if (!_.isEmpty(str) && str !== 0) {
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
    }
    return str;
  },

  isempty(any) {
    return _.isEmpty(any);
  },

  /**
   * 获取当前事件 时间戳
   */
  getnow() {
    return new Date().getTime();
  },

  insert_flg(str, flg, sn) {
    let newstr = '';
    for (let i = 0; i < str.length; i += sn) {
      const tmp = str.substring(i, i + sn);
      newstr += tmp + flg;
    }
    return newstr;
  },

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

  delhtmltags(str) {
    if (!_.isEmpty(str)) {
      return str.replace(/<[^>]+>/g, ''); // 去掉所有的html标记
    }
    return '';
  },
};
