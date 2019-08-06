var Busboy = require('busboy');
var fs = require('fs');
var fse = require('fs-extra');
var os = require('os');
var path = require('path');
var snowflake = require('node-snowflake').Snowflake;
var OSS = require('ali-oss');
const MTS = require('./aliyunSignature')




var isEmpty = function (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

var ueditor = function (static_url, config = {}, handel) {
    return function (req, res, next) {
        var _respond = respond(static_url, config, handel);
        _respond(req, res, next);
    };
};

var respond = function (static_url, config = {}, callback) {
    if (typeof config === 'function') {
        callback = config
        config = {}
    }
    return function (req, res, next) {
        if (req.query.action === 'config') {
            callback(req, res, next);
            return;
        } else if (req.query.action === 'listimage') {
            res.ue_list = function (list_dir) {
                var str = '';
                var i = 0;
                var list = [];
                fs.readdir(static_url + list_dir, function (err, files) {
                    if (err) throw err;

                    var total = files.length;
                    files.forEach(function (file) {

                        var filetype = 'jpg,png,gif,ico,bmp';
                        var tmplist = file.split('.');
                        var _filetype = tmplist[tmplist.length - 1];
                        if (filetype.indexOf(_filetype.toLowerCase()) >= 0) {
                            var temp = {};
                            if (list_dir === '/') {
                                temp.url = list_dir + file;
                            } else {
                                temp.url = list_dir + "/" + file;
                            }
                            list[i] = (temp);
                        } else {}
                        i++;
                        // send file name string when all files was processed
                        if (i === total) {
                            res.json({
                                "state": "SUCCESS",
                                "list": list,
                                "start": 1,
                                "total": total
                            });
                        }
                    });
                });
            };

            callback(req, res, next);

        } else if (req.query.action === 'uploadimage' || req.query.action === 'uploadfile' || req.query.action === 'uploadvideo') {
            var busboy = new Busboy({
                headers: req.headers
            });
            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                req.ueditor = {};
                req.ueditor.fieldname = fieldname;
                req.ueditor.file = file;
                req.ueditor.filename = filename;
                req.ueditor.encoding = encoding;
                req.ueditor.mimetype = mimetype;
                res.ue_up = async function (img_url) {
                    var tmpdir = path.join(os.tmpdir(), path.basename(filename));
                    var name = snowflake.nextId() + path.extname(tmpdir);
                    var dest = path.join(static_url, img_url, name);
                    if (config.oss) {
                        var clientOss = new OSS({
                            region: config.oss.region,
                            accessKeyId: config.oss.accessKeyId,
                            accessKeySecret: config.oss.accessKeySecret
                        });
                        var targetOssPath = img_url.substr(1);
                        clientOss.useBucket(config.oss.bucket);

                        var result = await clientOss.put(targetOssPath + name, file);

                        let targetUrl = result.url;
                        if (targetUrl.indexOf('http://') >= 0) {
                            targetUrl = targetUrl.replace('http://', 'https://');
                        }

                        // 提交oss截图作业
                        if (targetOssPath == 'upload/videos/') {
                            console.log('开始提交截图作业！');
                            MTS.videoShot(targetOssPath, name);
                        }
                        res.json({
                            'url': targetUrl,
                            'title': req.body.pictitle,
                            'original': filename,
                            'state': 'SUCCESS'
                        });
                        return false
                    }

                    //默认上传到项目目录(config对象为空时) 或者 config.local , config.qn 都为 true 时会同时上传到七牛及项目目录
                    if (!config || isEmpty(config) || config.local) {
                        var writeStream = fs.createWriteStream(tmpdir);
                        file.pipe(writeStream);
                        writeStream.on("close", function () {
                            fse.move(tmpdir, dest, function (err) {
                                if (err) throw err;
                                res.json({
                                    'url': path.join(img_url, name).replace(/\\/g, '/'),
                                    'title': req.body.pictitle,
                                    'original': filename,
                                    'state': 'SUCCESS'
                                });
                            });
                        })
                    }
                };
                callback(req, res, next);
            });
            req.pipe(busboy);
        } else {
            callback(req, res, next);
        }
        return;
    };
};
module.exports = ueditor;