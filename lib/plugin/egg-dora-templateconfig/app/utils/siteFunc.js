/**
 * Created by Administrator on 2015/5/30.
 */


const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');



var siteFunc = {

    // 扫描某路径下文件夹是否存在
    checkExistFile(tempFilelist, forderArr) {

        let filterForderArr = [],
            distPath = false;
        for (let i = 0; i < forderArr.length; i++) {
            const forder = forderArr[i];
            let currentForder = _.filter(tempFilelist, (fileObj) => {
                return fileObj.name == forder;
            })
            filterForderArr = filterForderArr.concat(currentForder);
        }
        if (filterForderArr.length > 0 && (tempFilelist.length >= forderArr.length) && (filterForderArr.length >= forderArr.length)) {
            distPath = true;
        }

        return distPath;
    },


    // OPTION_DATABASE_END
};
module.exports = siteFunc;