/*
 * @Author: doramart 
 * @Date: 2019-09-24 15:34:24 
 * @Last Modified by:   doramart 
 * @Last Modified time: 2019-09-24 15:34:24 
 */

var siteFunc = {


    setTempParentId(arr, key) {
        for (var i = 0; i < arr.length; i++) {
            var pathObj = arr[i];
            pathObj.parentId = key;
        }
        return arr;
    },

    getTempBaseFile: function (path, viewPath = '', themePath = '') {
        var thisType = (path).split('.')[1];
        var basePath;
        if (thisType == 'html') {
            basePath = viewPath;
        } else if (thisType == 'json') {
            basePath = process.cwd();
        } else {
            basePath = themePath;
        }
        return basePath;
    },


    // OPTION_DATABASE_END
};
module.exports = siteFunc;