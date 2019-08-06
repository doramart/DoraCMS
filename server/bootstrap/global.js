/*
 * @Author: doramart 
 * @Date: 2019-06-18 17:04:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-06 13:55:53
 */

const _ = require('lodash');
const Axios = require("axios");
const settings = require('@configs/settings');
const urlConfigs = require('@configs/urlConfigs');
const validator = require('validator');
const {
  logUtil
} = require('@utils')
const shortid = require('shortid');
const asyncValidator = require('async-validator');
const moment = require('moment');
const {
  cache
} = require('@utils');


global.reqJsonData = async (url, params = {}, method = 'get') => {
  let responseData, apiData = [];
  try {

    let targetUrl = url.indexOf('manage/') == '0' ? (urlConfigs.server_admin_api + '/' + url) : (urlConfigs.server_api + '/' + url);

    if (method === 'get') {
      responseData = await Axios.get(targetUrl, {
        params
      })
    } else if (method === 'post') {
      responseData = await Axios.post(targetUrl, params)
    }

    if (responseData && responseData.status == '200' && !_.isEmpty(responseData.data)) {
      apiData = responseData.data.data;
    }
    return apiData;
  } catch (error) {
    console.log(error)
    return apiData;
  }
}


// 校验合法ID
global.checkCurrentId = (ids) => {
  if (!ids) return false;
  let idState = true;
  let idsArr = ids.split(',');
  if (typeof idsArr === "object" && idsArr.length > 0) {
    for (let i = 0; i < idsArr.length; i++) {
      if (!shortid.isValid(idsArr[i])) {
        idState = false;
        break;
      }
    }
  } else {
    idState = false;
  }
  return idState;
}



// 封装api返回的数据
global.renderSuccess = (req = {}, res, {
  code = 200,
  message = '操作成功',
  data = {},
  type = null
} = {}) => {

  let sendData = {
    status: code,
    message: message,
    server_time: (new Date()).getTime(),
    data: data
  }
  res.send(sendData);
}

global.renderFail = (req, res, {
  code = 500,
  message = '操作成功',
  data = {},
  type = null
} = {}) => {

  let responseMessage = message;
  let responseCode = code;
  if (typeof message == 'object') {
    responseMessage = message.message;
  }
  // 处理登录失效的回调
  if (responseMessage == res.__("label_notice_asklogin")) {
    responseCode = 401;
  }
  let errorData = {
    status: responseCode,
    message: responseMessage,
    server_time: (new Date()).getTime(),
    data: data
  }
  // 记录错误日志
  logUtil.error(responseMessage, req);
  res.send(errorData);
}


global.getStrLength = (str) => {
  let charCode = -1;
  const len = str.length;
  let realLength = 0;
  let zhChar = 0,
    enChar = 0;
  for (let i = 0; i < len; i++) {
    charCode = str.charCodeAt(i)
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
      enChar++
    } else {
      realLength += 2;
      zhChar++
    }
  }
  return {
    length: realLength,
    enChar,
    zhChar
  }
}


global.getDateStr = (addDayCount) => {
  var dd = new Date();
  dd.setDate(dd.getDate() + addDayCount); //获取AddDayCount天后的日期
  var y = dd.getFullYear();
  var m = (dd.getMonth() + 1) < 10 ? "0" + (dd.getMonth() + 1) : (dd.getMonth() + 1); //获取当前月份的日期，不足10补0
  var d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate(); //获取当前几号，不足10补0
  let endDate = moment().format("YYYY-MM-DD");
  return {
    startTime: y + "-" + m + "-" + d + ' 23:59:59',
    endTime: endDate + ' 23:59:59'
  }
}


global.getCacheValueByKey = (key) => {
  return new Promise((resolve, reject) => {
    cache.get(key, (targetValue) => {
      if (targetValue) {
        resolve(targetValue)
      } else {
        resolve('');
      }
    })
  })
}


global.clearRedisByType = (str, cacheKey) => {
  console.log('cacheStr', str);
  let currentKey = settings.session_secret + cacheKey + str;
  cache.set(currentKey, '', 2000);
}



/*
 * @params form: {
 *   descriptor: 验证规则
 *   source: 待验证字段
 *   callback: 异步验证回调函数
 * }
 *
 * @return errInfo {
 *   isAllValid: 验证是否通过
 *  errors: 验证失败的字段信息
 * }
 * 不管验证结果成功还是失败,都会将结果信息写入errors中,方便调用者直接通过数组下标方式获取验证结果信息
 * */
global.validate = (form) => {
  let errInfo = {};
  let errStatus = [];
  let descriptor = form.descriptor;
  let validators = new asyncValidator(descriptor);
  validators.validate(form.source, {
    firstFields: true // 如果一个字段对应多个验证规则, 只显示验证失败的第一个规则信息,并不再进行后续规则的验证
  }, (errors, fields) => {
    if (errors) {
      /* 如需异步验证需要传入回调函数callback */
      errors.forEach(item => {
        errStatus.push(item.message.errStatus);
      });
      errInfo.errors = errors;
      errInfo.isAllValid = !errStatus.includes(true);
      form.callback && form.callback(errInfo);
    }
  });
  return errInfo;
}

global.getAuthUserFields = (type = '') => {
  let fieldStr = "id userName category group logo date enable state";
  if (type == 'login') {
    fieldStr = "id userName category group logo date enable state phoneNum countryCode email comments position loginActive birth password";
  } else if (type == 'base') {
    fieldStr = "id userName category group logo date enable state phoneNum countryCode email watchers followers comments favorites favoriteCommunityContent despises comments profession experience industry introduction birth creativeRight gender";
  } else if (type == 'session') {
    fieldStr = "id userName name category group logo date enable state phoneNum countryCode email watchers followers praiseContents praiseMessages praiseCommunityContent watchSpecials watchCommunity watchTags favorites favoriteCommunityContent despises despiseMessage despiseCommunityContent comments position gender vip";
  }
  return fieldStr;
}


global.getContentListFields = (type = '') => {

  let files = null;
  if (type == 'normal') {
    files = '_id title stitle sImg uAuthor date updateDate discription clickNum roofPlacement type videoImg state dismissReason categories isTop'
  } else if (type == 'simple') {
    files = '_id title stitle sImg stitle date updateDate clickNum roofPlacement type videoImg state dismissReason';
  } else if (type == 'stage1') {
    files = '_id title stitle sImg uAuthor date updateDate discription comments clickNum roofPlacement type videoImg state dismissReason categories isTop'
  } else {
    files = '_id title stitle sImg uAuthor date discription clickNum roofPlacement type appShowType imageArr videoArr duration simpleComments comments videoImg state dismissReason categories isTop'
  }
  // console.log('--files----', files)
  return files;
}

global.emailTypeKey = {
  email_findPsd: 'findPsd',
  email_reg_active: 'reg_active',
  email_notice_contentMsg: 'notice_contentMsg',
  email_notice_admin_byContactUs: 'notice_site_messages',
  email_notice_user_byContactUs: 'notice_user_site_messages',
  email_notice_contentBug: 'notice_contentBug',
  email_notice_user_contentMsg: 'notice_user_contentMsg',
  email_notice_user_reg: 'notice_user_reg',
  email_sendMessageCode: 'email_sendMessageCode', // 发送邮箱验证码
}

/**
 * @getClientIP
 * @desc 获取用户 ip 地址
 * @param {Object} req - 请求
 */
global.getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    req.connection.remoteAddress || // 判断 connection 的远程 IP
    req.socket.remoteAddress || // 判断后端的 socket 的 IP
    req.connection.socket.remoteAddress;
};