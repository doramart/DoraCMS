/**
 * Created by Administrator on 2015/4/29.
 * 系统支持功能
 */
var express = require('express');
var router = express.Router();
//文件上传类
var formidable = require('formidable'),
    util = require('util'),fs=require('fs');
//系统相关操作
var system = require("../util/system");
var gm = require('gm');
var url = require('url');
/* GET users listing. */
router.post('/upload', function(req, res, next) {

//    获取传入参数
    var params = url.parse(req.url,true);
    var fileType = params.query.type;
    var fileKey = params.query.key;
    var form = new formidable.IncomingForm(),files=[],fields=[],docs=[];
    console.log('start upload');

    //存放目录
    var updatePath = "public/upload/images/";
    var smallImgPath = "public/upload/smallimgs/";
    var newFileName = "";
    form.uploadDir = updatePath;

    form.on('field', function(field, value) {
        fields.push([field, value]);
    }).on('file', function(field, file) {
        files.push([field, file]);
        docs.push(file);

        var typeKey = "others";
        var thisType = file.name.split('.')[1];
        var date = new Date();
        var ms = Date.parse(date);

        if(fileType == 'images'){
            typeKey = "img"
        }

        newFileName = typeKey + ms + "."+thisType;

        fs.rename(file.path,updatePath+newFileName,function(err){
            if(err){
                console.log(err)
            }else{
                // 图片缩放
                var input =  updatePath+newFileName;
                var out = smallImgPath+newFileName;

                if(fileType == 'images'){
                    if(fileKey == 'ctTopImg'){
                        gm(input).resize(500,300,'!').autoOrient().write(out, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('done');
                            }
                        });
                    }else if(fileKey == 'plugTopImg'){ // 插件主题图片
                        gm(input).resize(500,300,'!').autoOrient().write(out, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('done');
                            }
                        });
                    }else if(fileKey == 'userlogo'){ // 用户头像
                        gm(input).resize(100,100,'!').autoOrient().write(out, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('done');
                            }
                        });
                    }
                }

            }
        })

    }).on('end', function() {
        console.log('-> upload done');
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        var out={Resopnse:{
            'result-code':0,
            timeStamp:new Date()
        },
            files:docs
        };
        var sout=JSON.stringify(out);
//        返回文件路径
        if(fileKey == 'ctTopImg' || fileKey == 'plugTopImg' || fileKey == 'userlogo'){
            res.end('/upload/smallimgs/'+newFileName);
        }else{
            res.end('/upload/images/'+newFileName);
        }

    });

    form.parse(req, function(err, fields, files) {
        err && console.log('formidabel error : ' + err);

        console.log('parsing done');
    });
});

module.exports = router;