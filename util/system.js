/**
 * Created by Administrator on 2015/4/18.
 */
//邮件发送插件
var nodemailer  = require("nodemailer");
//文件操作对象
var fs = require('fs');
//数据库操作对象
var DbOpt = require("../models/Dbopt");
//数据操作日志
var DataOptionLog = require("../models/DataOptionLog");
//时间格式化
var moment = require('moment');
//站点配置
var settings = require("../models/db/settings");
var siteFunc = require("../models/db/siteFunc");
//文件压缩
var fs = require('fs');
var child = require('child_process');
var archiver = require('archiver');
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
                callBack(error);
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
//                console.log("--state---"+stats.size)
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
                                }else if(ltype.indexOf("js")>=0){
                                    typeKey = "js";
                                }else if(ltype.indexOf("css")>=0){
                                    typeKey = "css";
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
    deleteFolder : function(req, res,path){
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
                res.end("success");
            }else{
                fs.unlink(path, function(err){
                    if(err){
                        console.log(err)
                    }else{
                        console.log('del file success') ;
                        res.end("success");
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
            fs.readFile(path,"utf8",function (error,data){
                if(error){
                    console.log(err)
                }else{
                    return res.json({
                        fileData : data
                    })
                }
            }) ;
        }
    },
    writeFile : function(req,res,path,content){
        if( fs.existsSync(path) ) {
            //写入文件
            fs.writeFile(path,content,function (err) {
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
//        var ms = Date.parse(date);
        var ms = moment(date).format('YYYYMMDDHHmmss').toString();
        var dataPath = settings.DATABACKFORDER + ms;
//        var cmdstr = 'mongodump -o "'+dataPath+'"';
        var cmdstr = 'mongodump -u '+settings.USERNAME+' -p '+settings.PASSWORD+' -d '+settings.DB+' -o "'+dataPath+'"';

        var batPath = settings.DATAOPERATION + '/backupData.bat';
        if(!fs.existsSync(settings.DATABACKFORDER)){
            fs.mkdirSync(settings.DATABACKFORDER);
        }
        if (fs.existsSync(dataPath)) {

            console.log('已经创建过备份了');

        } else {

            fs.mkdir(dataPath,0777,function(err1){
                if (err1) throw err1;
                if( fs.existsSync(batPath) ) {
                    //写入文件
                    fs.writeFile(batPath,cmdstr,function (err2) {
                        if(err2){
                            console.log(err2)
                        }
                        else{
                            console.log("----文件写入成功-----")
                            var exec = child.exec;
                            exec('call "'+batPath,
                                function (error, stdout, stderr) {
                                    if (error !== null) {
                                        //console.log('exec error: ' + error);
                                    }else{
                                        console.log('备份成功');
//                                    生成压缩文件
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


//                                     操作记录入库
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
                        }

                    }) ;
                }
            })
        }



    }

};



module.exports = system;