/*
 * @Author: doramart 
 * @Date: 2019-06-18 17:04:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-02-08 10:17:45
 */

const _ = require('lodash');
const shortid = require('shortid');
const moment = require('moment');
const {
  cache
} = require('@utils');



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