/*
 * @Author: doramart
 * @Date: 2019-09-24 15:34:24
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-18 18:16:20
 */
'use strict';
const _ = require('lodash');
const siteFunc = {
  buildTree(list) {
    const currentArr = [];
    const temp = {};
    const tree = {};
    for (const i in list) {
      temp[list[i]._id] = list[i];
    }
    for (const i in temp) {
      if (
        temp[i].parentId &&
        temp[i].parentId !== '0' &&
        !_.isEmpty(temp[temp[i].parentId])
      ) {
        if (!temp[temp[i].parentId].children) {
          temp[temp[i].parentId].children = [];
        }
        const currentTemp = temp[i];
        temp[temp[i].parentId].children.push(currentTemp);
      } else {
        tree[temp[i]._id] = temp[i];
      }
    }
    for (const item in tree) {
      currentArr.push(tree[item]);
    }
    return currentArr;
  },

  // OPTION_DATABASE_END
};
module.exports = siteFunc;
