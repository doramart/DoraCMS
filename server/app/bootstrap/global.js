/*
 * @Author: doramart
 * @Date: 2019-06-18 17:04:40
 * @Last Modified by: doramart
 * @Last Modified time: 2025-08-05 21:58:52
 */
'use strict';

const shortid = require('shortid');
const moment = require('moment');

// 校验合法ID
// global.checkCurrentId = ids => {
//   if (!ids) return false;
//   let idState = true;
//   const idsArr = ids.split(',');
//   if (typeof idsArr === 'object' && idsArr.length > 0) {
//     for (let i = 0; i < idsArr.length; i++) {
//       if (!ctx.validateId(idsArr[i])) {
//         idState = false;
//         break;
//       }
//     }
//   } else {
//     idState = false;
//   }
//   return idState;
// };

global.getStrLength = str => {
  let charCode = -1;
  const len = str.length;
  let realLength = 0;
  let zhChar = 0,
    enChar = 0;
  for (let i = 0; i < len; i++) {
    charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
      enChar++;
    } else {
      realLength += 2;
      zhChar++;
    }
  }
  return {
    length: realLength,
    enChar,
    zhChar,
  };
};

global.getDateStr = addDayCount => {
  const dd = new Date();
  dd.setDate(dd.getDate() + addDayCount); // 获取AddDayCount天后的日期
  const y = dd.getFullYear();
  const m = dd.getMonth() + 1 < 10 ? '0' + (dd.getMonth() + 1) : dd.getMonth() + 1; // 获取当前月份的日期，不足10补0
  const d = dd.getDate() < 10 ? '0' + dd.getDate() : dd.getDate(); // 获取当前几号，不足10补0
  const endDate = moment().format('YYYY-MM-DD');
  return {
    startTime: y + '-' + m + '-' + d + ' 23:59:59',
    endTime: endDate + ' 23:59:59',
  };
};

global.getAuthUserFields = (type = '') => {
  let fieldStr = 'id userName group logo createdAt enable state';
  if (type === 'login') {
    fieldStr =
      'id userName group logo createdAt enable state phoneNum countryCode email comments position loginActive birth password';
  } else if (type === 'base') {
    fieldStr =
      'id userName group logo createdAt enable state phoneNum countryCode email watchers followers comments favorites despises comments profession experience industry introduction birth gender';
  } else if (type === 'session') {
    fieldStr =
      'id userName name group logo createdAt enable state phoneNum countryCode email watchers followers praiseContents praiseMessages watchTags favorites despises despiseMessage comments position gender';
  }
  return fieldStr;
};

global.getContentListFields = (type = '') => {
  let files = null;
  if (type === 'normal') {
    files =
      'id keywords source title stitle sImg uAuthor createdAt updatedAt discription clickNum roofPlacement type videoImg state dismissReason categories isTop';
  } else if (type === 'simple') {
    files =
      'id keywords source title stitle sImg createdAt updatedAt clickNum roofPlacement type videoImg state dismissReason';
  } else if (type === 'stage1') {
    files =
      'id keywords source title stitle sImg uAuthor createdAt updatedAt discription comments clickNum roofPlacement type videoImg state dismissReason categories isTop';
  } else {
    files =
      'id keywords source title stitle sImg uAuthor createdAt discription clickNum roofPlacement type appShowType imageArr videoArr duration simpleComments comments videoImg state dismissReason categories isTop';
  }
  // console.log('--files----', files)
  return files;
};
