/**
 * Created by Administrator on 2015/4/18.
 */
//邮件发送插件
var nodemailer  = require("nodemailer");
//文件操作对象
var fs = require('fs');
var url = require('url');
var stat = fs.stat;
//数据库操作对象
var DbOpt = require("../models/Dbopt");
//数据操作日志
var DataOptionLog = require("../models/DataOptionLog");
//时间格式化
var moment = require('moment');
//站点配置
var settings = require("../models/db/settings");
var siteFunc = require("../models/db/siteFunc");
var adminFunc = require("../models/db/adminFunc");
//文件压缩
var fs = require('fs');
var child = require('child_process');
var archiver = require('archiver');
var formidable = require('formidable')
var mime = require('../util/mime').types;
var iconv = require('iconv-lite');
var system = {

    sendEmail : function(key,obj,callBack){

        var emailTitle = "Hello";
        var emailSubject = "Hello";
        var emailContent = "Hello";
        var toEmail;

        if(key == settings.email_findPsd){
            toEmail = obj.email;
            var oldLink = obj.password +'$'+ obj.email +'$'+ settings.session_secret;
            var newLink = DbOpt.encrypt(oldLink,settings.encrypt_key);

            emailSubject = emailTitle = '['+settings.SITETITLE +'] 通过激活链接找回密码';
            emailContent = siteFunc.setConfirmPassWordEmailTemp(obj.userName,newLink);
        }else if(key == settings.email_notice_contentMsg){
            emailSubject = emailTitle = '['+settings.SITETITLE +'] 用户留言提醒';
            emailContent = siteFunc.setNoticeToAdminEmailTemp(obj);
            toEmail = settings.site_email;
        }else if(key == settings.email_notice_user_contentMsg){
            emailSubject = emailTitle = '['+settings.SITETITLE +'] 有人给您留言啦';
            emailContent = siteFunc.setNoticeToUserEmailTemp(obj);
            toEmail = obj.replyAuthor.email;
        }else if(key == settings.email_notice_contentBug){
            emailSubject = emailTitle = '['+settings.SITETITLE +'] 有人给您提bug啦';
            emailContent = siteFunc.setBugToAdminEmailTemp(obj);
            toEmail = settings.site_email;
        }else if(key == settings.email_notice_user_reg){
            emailSubject = emailTitle = '['+settings.SITETITLE +'] 恭喜您，注册成功！';
            emailContent = siteFunc.setNoticeToUserRegSuccess(obj);
            toEmail = obj.email;
        }

//                发送邮件
        var transporter = nodemailer.createTransport({

            service: 'QQ',
            auth: {
                user: settings.site_email,
                pass: settings.site_email_psd
            }

        });

        var mailOptions = {
            from: settings.site_email, // sender address
            to: toEmail, // list of receivers
            subject: emailSubject, // Subject line
            text: emailTitle, // plaintext body
            html: emailContent // html body
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('邮件发送失败：'+error);
                callBack('notCurrentEmail');
            }else{
                console.log('Message sent: ' + info.response);
                callBack();
            }
        });


    },
    scanFolder : function(path){ //文件夹列表读取
        // 记录原始路径
            var oldPath = path;
            var filesList = [];

            var fileList = [],
            folderList = [],
            walk = function(path, fileList, folderList){
                files = fs.readdirSync(path);
                files.forEach(function(item) {

                    var tmpPath = path + '/' + item,
                        stats = fs.statSync(tmpPath);
                    var typeKey = "folder";
                    if(oldPath === path){
                        if (stats.isDirectory()) {
                            walk(tmpPath, fileList, folderList);
                        } else {
                            var fileType = item.split('.')[1];

                            if(fileType){
                                var ltype = fileType.toLowerCase();
                                if(ltype.indexOf("jpg")>=0
                                    || ltype.indexOf("gif")>=0
                                    || ltype.indexOf("png")>=0
                                    || ltype.indexOf("pdf")>=0){
                                    typeKey = "image";
                                }else if(ltype.indexOf("htm")>=0){
                                    typeKey = "html";
                                }else if(ltype.indexOf("js") == 0){
                                    typeKey = "js";
                                }else if(ltype.indexOf("ejs") == 0){
                                    typeKey = "ejs";
                                }else if(ltype.indexOf("css")>=0){
                                    typeKey = "css";
                                }else if(ltype.indexOf("txt")>=0){
                                    typeKey = "txt";
                                }else if(ltype.indexOf("mp4")>=0
                                    || ltype.indexOf("mp3")>=0){
                                    typeKey = "video";
                                }else{
                                    typeKey = "others";
                                }
                            }
                        }

                        var fileInfo = {
                            "name" : item,
                            "type" : typeKey,
                            "path" : tmpPath,
                            "size" : stats.size,
                            "date" : stats.mtime
                        };
                        filesList.push(fileInfo);

                    }
                });
            };

        walk(path, fileList, folderList);
//        console.log('扫描' + path +'成功----'+ filesList.join());

        return filesList;
    },
    scanJustFolder : function(path){ //只读取文件夹，不做递归
        var folderList = [];

        var files = fs.readdirSync(path);
        files.forEach(function(item) {

            var tmpPath = path + '/' + item,
                stats = fs.statSync(tmpPath);
            if (stats.isDirectory()) {
                var fileInfo = {
                    "name" : item,
                    "type" : "folder",
                    "size" : stats.size,
                    "date" : stats.mtime
                };
                folderList.push(fileInfo);
            }
        });

        return folderList;
    },
    deleteFolder : function(req, res,path,callBack){
        var files = [];
        console.log("---del path--"+path);
        if( fs.existsSync(path) ) {
            console.log("---begin to del--");
            if(fs.statSync(path).isDirectory()) {
                var walk = function(path){
                    files = fs.readdirSync(path);
                    files.forEach(function(file,index){
                        var curPath = path + "/" + file;
                        if(fs.statSync(curPath).isDirectory()) { // recurse
                            walk(curPath);
                        } else { // delete file
                            fs.unlinkSync(curPath);
                        }
                    });
                    fs.rmdirSync(path);
                };
                walk(path);
                console.log("---del folder success----");
                callBack();
            }else{
                fs.unlink(path, function(err){
                    if(err){
                        console.log(err)
                    }else{
                        console.log('del file success') ;
                        callBack();
                    }
                }) ;
            }

        }else{
            res.end("success");
        }
    },
    reNameFile : function(req,res,path,newPath){
        if( fs.existsSync(path) ) {

            fs.rename(path,newPath,function(err){
                if(err){
                    console.log("重命名失败！");
                    res.end("error");
                }else{
                    console.log("重命名成功！");
                    res.end("success");
                }
            });

        }

    },
    readFile : function(req,res,path){ // 文件读取
        if( fs.existsSync(path) ) {
            fs.readFile(path,"binary",function (error,data){
                if(error){
                    console.log(err)
                }else{
                    //处理中文乱码问题
                    var buf = new Buffer(data, 'binary');
                    var newData = iconv.decode(buf, 'utf-8');
                    return res.json({
                        fileData : newData
                    })
                }
            }) ;
        }else{
            res.end(settings.system_illegal_param);
        }
    },
    writeFile : function(req,res,path,content){
        if( fs.existsSync(path) ) {
            //写入文件
            var newContent = iconv.encode(content, 'utf-8');
            fs.writeFile(path,newContent,function (err) {
                if(err){
                    console.log(err)
                }else{
                    console.log("----文件写入成功-----")
                    res.end("success");
                }

            }) ;
        }
    },
    backUpData : function(res,req){  // 数据备份
        var date = new Date();
        var ms = moment(date).format('YYYYMMDDHHmmss').toString();
        var dataPath = settings.DATABACKFORDER + ms;
//        var cmdstr = 'mongodump -o "'+dataPath+'"';
        var cmdstr = settings.MONGODBEVNPATH + 'mongodump -u '+settings.USERNAME+' -p '+settings.PASSWORD+' -d '+settings.DB+' -o "'+dataPath+'"';

        var batPath = settings.DATAOPERATION + '/backupData.sh';
        if(!fs.existsSync(settings.DATABACKFORDER)){
            fs.mkdirSync(settings.DATABACKFORDER);
        }
        if (fs.existsSync(dataPath)) {

            console.log('已经创建过备份了');

        } else {

            fs.mkdir(dataPath,0777,function(err1){
                if (err1) throw err1;

                child.exec(cmdstr,function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }else{
                        console.log('数据备份成功');
                        //生成压缩文件
                        var output = fs.createWriteStream(settings.DATABACKFORDER + ms +'.zip');
                        var archive = archiver('zip');

                        archive.on('error', function(err){
                            throw err;
                        });

                        archive.pipe(output);
                        archive.bulk([
                            { src: [dataPath+'/**']}
                        ]);
                        archive.finalize();

                        // 操作记录入库
                        var optLog = new DataOptionLog();
                        optLog.logs = "数据备份";
                        optLog.path = dataPath;
                        optLog.fileName = ms +'.zip';
                        optLog.save(function(err3){
                            if (err3) throw err3;
                            res.end("success");
                        })
                    }
                });

            })
        }

    },
    //文件夹复制
    copyForder : function(fromPath,toPath){
        /*
         * 复制目录中的所有文件包括子目录
         * @param{ String } 需要复制的目录
         * @param{ String } 复制到指定的目录
         */

        var copy = function( src, dst ){
            // 读取目录中的所有文件/目录
            fs.readdir( src, function( err, paths ){
                if( err ){
                    throw err;
                }

                paths.forEach(function( path ){
                    var _src = src + '/' + path,
                        _dst = dst + '/' + path,
                        readable, writable;
                    stat( _src, function( err, st ){
                        if( err ){
                            throw err;
                        }
                        // 判断是否为文件
                        if( st.isFile() ){
                            // 创建读取流
                            readable = fs.createReadStream( _src );
                            // 创建写入流
                            writable = fs.createWriteStream( _dst );
                            // 通过管道来传输流
                            readable.pipe( writable );
                        }
                        // 如果是目录则递归调用自身
                        else if( st.isDirectory() ){
                            exists( _src, _dst, copy );
                        }
                    });
                });
            });
        };

        // 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
        var exists = function( src, dst, callback ){
            fs.exists( dst, function( exists ){
                // 已存在
                if( exists ){
                    callback( src, dst );
                }

                // 不存在
                else{
                    fs.mkdir( dst, function(){
                        callback( src, dst );
                    });
                }
            });
        };

        // 复制目录
        exists(fromPath,toPath,copy );
    },

    //获取文件真实类型
    getFileMimeType : function(filePath){
        var buffer = new Buffer(8);
        var fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 8, 0);
        var newBuf = buffer.slice(0, 4);
        var head_1 = newBuf[0].toString(16);
        var head_2 = newBuf[1].toString(16);
        var head_3 = newBuf[2].toString(16);
        var head_4 = newBuf[3].toString(16);
        var typeCode = head_1 + head_2 + head_3 + head_4;
        var filetype = '';
        var mimetype;
        switch (typeCode){
            case 'ffd8ffe1':
                filetype = 'jpg';
                mimetype = ['image/jpeg', 'image/pjpeg'];
                break;
            case 'ffd8ffe0':
                filetype = 'jpg';
                mimetype = ['image/jpeg', 'image/pjpeg'];
                break;
            case '47494638':
                filetype = 'gif';
                mimetype = 'image/gif';
                break;
            case '89504e47':
                filetype = 'png';
                mimetype = ['image/png', 'image/x-png'];
                break;
            case '504b34':
                filetype = 'zip';
                mimetype = ['application/x-zip', 'application/zip', 'application/x-zip-compressed'];
                break;
            case '2f2aae5':
                filetype = 'js';
                mimetype = 'application/x-javascript';
                break;
            case '2f2ae585':
                filetype = 'css';
                mimetype = 'text/css';
                break;
            case '5b7bda':
                filetype = 'json';
                mimetype = ['application/json', 'text/json'];
                break;
            case '3c212d2d':
                filetype = 'ejs';
                mimetype = 'text/html';
                break;
            default:
                filetype = 'unknown';
                break;
        }

        fs.closeSync(fd);

        return   {
            fileType : filetype,
            mimeType : mimetype
        };

    },

    uploadTemp : function(req,res,callBack){
        var form = new formidable.IncomingForm(),files=[],fields=[],docs=[];
        //存放目录
        var forderName;
        form.uploadDir = 'views/web/temp/';

        form.parse(req, function(err, fields, files) {
            if(err){
                res.end(err);
            }else{
                fs.rename(files.Filedata.path, 'views/web/temp/' + files.Filedata.name,function(err1){
                    if(err1){
                        res.end(err1);
                    }else{

                        forderName = files.Filedata.name.split('.')[0];
                        console.log('parsing done');
                        callBack(forderName);
                    }
                });
            }

        });
    }
};



module.exports = system;