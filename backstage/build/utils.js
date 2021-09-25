const fs = require('fs');
const path = require('path');
var qiniu = require("qiniu");
var modulesPath = path.resolve(__dirname, '../');
let scanforder = (path) => {
    let folderList = [];
    let files = fs.readdirSync(path);
    files.forEach(function (item) {
        let tmpPath = path + '/' + item,
            stats = fs.statSync(tmpPath);
        if (stats.isDirectory()) {
            folderList.push(item);
        }
    });
    return folderList;
}

let scanFiles = (basePath, path) => {

    // 记录原始路径
    let filesList = [];
    // let basePath = path;
    let fileList = [],
        folderList = [],
        walk = function (path, fileList, folderList) {
            files = fs.readdirSync(path);
            files.forEach(function (item) {

                let tmpPath = path + '/' + item,
                    stats = fs.statSync(tmpPath);
                if (stats.isDirectory()) {
                    walk(tmpPath, fileList, folderList);
                } else {
                    let currentPath = tmpPath.replace(basePath + '/dist/', '');
                    filesList.push({
                        localFile: tmpPath,
                        pathKey: currentPath
                    });
                }
            });
        };

    walk(path, fileList, folderList);

    return filesList;
}

let uploadByQiniu = (localFile, targetKey) => {
    return new Promise((resolve, reject) => {
        var config = new qiniu.conf.Config();
        // 空间对应的机房
        config.zone = qiniu.zone.Zone_z0;

        config.useHttpsDomain = true;

        //要上传的空间
        let bucket = 'cmsupload';

        var accessKey = 'V6tL3A9-bg6eJ8BPA62Xpq20GGKYgK7-2uk6MgF5';
        var secretKey = '17yL6dNxnC2-dSLJOONeBRjonoCDCrSQZoJeRC81';
        var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        var options = {
            scope: bucket + ':' + targetKey,
        };
        var putPolicy = new qiniu.rs.PutPolicy(options);
        var uploadToken = putPolicy.uploadToken(mac);

        var formUploader = new qiniu.form_up.FormUploader(config);
        var putExtra = new qiniu.form_up.PutExtra();

        // console.log('localFile: ', localFile);
        // console.log('targetKey: ', targetKey);
        // 文件上传
        setTimeout(() => {
            formUploader.putFile(uploadToken, targetKey, localFile, putExtra, function (respErr,
                respBody, respInfo) {
                if (respErr) {
                    // throw respErr;
                    reject(respErr);
                }
                if (respInfo.statusCode == 200) {
                    console.log(respBody);
                    resolve();
                } else {
                    console.log(respInfo.statusCode);
                    console.log(respBody);
                    resolve();
                }
            });
        }, 1000);

    })
}


module.exports = {
    scanforder,
    scanFiles,
    uploadByQiniu
};