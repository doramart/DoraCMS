/*
 * @Author: doramart
 * @Date: 2019-09-24 15:34:24
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:12:37
 */
'use strict';
const siteFunc = {
  setTempParentId(arr, key) {
    for (let i = 0; i < arr.length; i++) {
      const pathObj = arr[i];
      pathObj.parentId = key;
    }
    return arr;
  },

  getTempBaseFile(path, viewPath = '', themePath = '') {
    const thisType = path.split('.')[1];
    let basePath;
    if (thisType === 'html') {
      basePath = viewPath;
    } else if (thisType === 'json') {
      basePath = process.cwd();
    } else {
      basePath = themePath;
    }
    return basePath;
  },

  // OPTION_DATABASE_END
};
module.exports = siteFunc;
