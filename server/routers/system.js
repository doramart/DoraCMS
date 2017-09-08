/**
 * Created by Administrator on 2015/4/29.
 * 系统支持功能
 */
const express = require('express');
const router = express.Router();
//文件上传类
const formidable = require('formidable'),
    util = require('util'),
    fs = require('fs');

//时间格式化
const moment = require('moment');
// let gm = require('gm');
const url = require('url');
const mime = require('../../utils/mime').types;
const service = require('../../utils/service');
//站点配置
const settings = require("../../utils/settings");

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
    let smallImgPath = "public/upload/smallimgs/";
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
            res.end('typeError');
        }

        let typeKey = "others";
        let thisType = file.name.split('.')[1];
        let date = new Date();
        let ms = moment(date).format('YYYYMMDDHHmmss').toString();
        console.log('---', fileType);
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
                res.end('typeError');
            }

        }

    }).on('end', function () {

        // 返回文件路径
        // if(settings.imgZip && (fileKey == 'ctTopImg' || fileKey == 'plugTopImg' || fileKey == 'userlogo')){
        //     res.end('/upload/smallimgs/'+newFileName);
        // }else{
        res.end('/upload/images/' + newFileName);
        // }


    });

    form.parse(req, function (err, fields, files) {
        err && console.log('formidabel error : ' + err);
        console.log('parsing done');
    });
});



module.exports = router;