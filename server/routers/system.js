/**
 * Created by Administrator on 2015/4/29.
 * 系统支持功能
 */
const express = require('express');
const router = express.Router();
router.caseSensitive = true;
router.strict = true
//文件上传类
const formidable = require('formidable'),
    util = require('util'),
    fs = require('fs');
const qiniu = require('qiniu');
//时间格式化
const moment = require('moment');
// let gm = require('gm');
const url = require('url');
const mime = require('../../utils/mime').types;
const service = require('../../utils/service');
//站点配置
const settings = require("../../configs/settings");
let checkPathNum = 0;

function uploadToQiniu(req, res, imgkey) {
    // 鉴权凭证
    let { openqn, accessKey, secretKey, bucket, origin, fsizeLimit } = settings;
    let config = new qiniu.conf.Config();
    // 空间对应的机房
    config.zone = qiniu.zone.Zone_z0;
    // 是否使用https域名
    //config.useHttpsDomain = true;
    // 上传是否使用cdn加速
    config.useCdnDomain = true;

    let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    let options = {
        scope: bucket,
        fsizeLimit: fsizeLimit,
        mimeLimit: 'image/*'
    };
    let putPolicy = new qiniu.rs.PutPolicy(options);
    let uploadToken = putPolicy.uploadToken(mac);

    let localFile = process.cwd() + "/public/" + imgkey;
    let formUploader = new qiniu.form_up.FormUploader(config);
    let putExtra = new qiniu.form_up.PutExtra();

    // 文件上传
    formUploader.putFile(uploadToken, imgkey, localFile, putExtra, function (respErr,
        respBody, respInfo) {
        if (respErr) {
            throw respErr;
        }
        if (respInfo.statusCode == 200) {
            console.log(respBody);
            res.end(origin + '/' + respBody.key);
        } else {
            console.log(respInfo.statusCode);
            console.log(respBody);
            res.end(respInfo.statusCode);
        }
    });
}

let confirmPath = (path) => {
    return new Promise(function (resolve, reject) {
        let waitCheck = () => {
            setTimeout(() => {
                if (!fs.existsSync(path)) {
                    if (checkPathNum == 3) {
                        resolve(fs.existsSync(path));
                    } else {
                        checkPathNum++;
                        waitCheck();
                    }
                } else {
                    resolve(fs.existsSync(path));
                }
            }, 200);
        }
        waitCheck();
    })
}

let checkFilePath = async function (path) {
    return await confirmPath(path);
};

/* GET users listing. */
router.post('/upload', function (req, res, next) {

    //    获取传入参数
    let params = url.parse(req.url, true);
    let fileType = params.query.type;
    let fileKey = params.query.key;
    let form = new formidable.IncomingForm(),
        files = [],
        fields = [],
        docs = [];
    console.log('start upload');

    //存放目录
    let updatePath = "public/upload/images/";
    let newFileName = "";
    form.uploadDir = updatePath;

    form.on('field', function (field, value) {
        fields.push([field, value]);
    }).on('file', function (field, file) {
        files.push([field, file]);
        docs.push(file);
        //校验文件的合法性
        let realFileType = service.getFileMimeType(file.path);
        let contentType = mime[realFileType.fileType] || 'unknown';
        if (contentType == 'unknown') {
            res.end(settings.system_error_imageType);
        }

        let typeKey = "others";
        let thisType = file.name.split('.')[1];
        let date = new Date();
        let ms = moment(date).format('YYYYMMDDHHmmss').toString();

        if (fileType == 'images') {
            typeKey = "img"
        }
        newFileName = typeKey + ms + "." + thisType;

        if (fileType == 'images') {
            if (realFileType.fileType == 'jpg' || realFileType.fileType == 'jpeg' || realFileType.fileType == 'png' || realFileType.fileType == 'gif') {
                fs.rename(file.path, updatePath + newFileName, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })
            } else {
                res.end(settings.system_error_imageType);
            }

        }

    }).on('end', function () {
        // 返回文件路径
        if (settings.openqn) {
            let localPath = process.cwd() + '/' + updatePath + newFileName;
            // 校验文件是否上传成功
            if (checkFilePath(localPath)) {
                uploadToQiniu(req, res, 'upload/images/' + newFileName)
            } else {
                res.end(settings.system_error_upload);
            }
        } else {
            res.end('/upload/images/' + newFileName);
        }
    });

    form.parse(req, function (err, fields, files) {
        err && console.log('formidabel error : ' + err);
        console.log('parsing done');
    });
});




module.exports = router;