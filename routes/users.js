var express = require('express');
var router = express.Router();
var url = require('url');
//验证
var validator = require("validator");
//文章类别对象
var ContentCategory = require("../models/ContentCategory");
//用户实体类
var User = require("../models/User");
var AdminUser = require("../models/AdminUser");
//留言实体类
var Message = require("../models/Message");
// 文档对象
var Content = require("../models/Content");
//数据库操作对象
var DbOpt = require("../models/Dbopt");
//加密类
var crypto = require("crypto");
//系统相关操作
var system = require("../util/system");
//时间格式化
var moment = require('moment');
//站点配置
var settings = require("../models/db/settings");
var siteFunc = require("../models/db/siteFunc");
var shortid = require('shortid');
//数据校验
var filter = require('../util/filter');
//系统消息
var UserNotify = require("../models/UserNotify");
var Notify = require("../models/Notify");


var returnUsersRouter = function(io) {

    //校验是否登录
    function isLogined(req){
        return req.session.logined;
    }


//用户登录

    router.get('/login', function(req, res, next) {

        if(isLogined(req)){
            siteFunc.renderToTargetPageByType(req,res,'index');
        }else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });

// 用户登录提交请求
    router.post('/doLogin', function(req, res, next) {
        var email = req.body.email;
        var password = req.body.password;
        var errors;
        var newPsd = DbOpt.encrypt(password,settings.encrypt_key);
        if(!validator.isEmail(email)){
            errors = '邮箱格式不正确';
        }
        if(!validator.isPsd(password) || !validator.isLength(password,6,12)){
            errors = "密码6-12个字符";
        }
        if(errors){
            res.end(errors);
        }else{
            User.findOne({email:email,password:newPsd},function(err,user){
                if(user){
//            将cookie存入缓存
                    filter.gen_session(user, res);
                    res.end("success");
                }
                else
                {
                    res.end("用户名或密码错误！");
                }
            })
        }

    });

//用户注册
    router.get('/reg', function(req, res, next) {

        siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户注册',page : 'userReg'});

    });


// 用户注册
    router.post('/doReg', function(req, res, next) {
        var errors;
        var userName = req.body.userName;
        var email = req.body.email;
        var password = req.body.password;
        var confirmPsd = req.body.confirmPassword;
//    数据校验
        if(!validator.isUserName(userName)){
            errors = "用户名5-12个英文数字组合";
        }
        if(!validator.isPsd(password) || !validator.isLength(password,6,12)){
            errors = "6-12位，只能包含字母、数字和下划线";
        }
        if(password !== confirmPsd)
        {
            errors = "密码不匹配，请重新输入";
        }
        if(!validator.isEmail(email)){
            errors = "请填写正确的邮箱地址";
        }
        if(errors){
            res.end(errors);
        }else{
            var regMsg = {
                email : email,
                userName : userName
            };

            //        邮箱和用户名都必须唯一
            var query=User.find().or([{'email' : email},{userName : userName}]);
            query.exec(function(err,user){
                if(user.length > 0){
                    errors = "邮箱或用户名已存在！";
                    res.end(errors);
                }else{
                    system.sendEmail(settings.email_notice_user_reg,regMsg,function(err){
                        if(err && err == 'notCurrentEmail'){
                            res.end('乱写邮箱被我发现了吧！');
                        }else{
                            var newPsd = DbOpt.encrypt(password,settings.encrypt_key);
                            req.body.password = newPsd;
                            //发送系统消息给管理员
                            siteFunc.sendSystemNoticeByType(req,res,'reg',userName);
                            DbOpt.addOne(User,req, res)
                        }
                    });

                }
            });

        }
    });

//忘记密码页面
    router.get('/lostPassword', function(req, res, next) {

        siteFunc.renderToTargetPageByType(req,res,'user',{title : '确认邮箱',page : 'userConfirmEmail'});

    });


//提交验证邮箱
    router.post('/sentConfirmEmail',function(req, res, next){

        var targetEmail = req.body.email;
//    获取当前发送邮件的时间
        var retrieveTime = new Date().getTime();
        if(!validator.isEmail(targetEmail)){
            res.end(settings.system_illegal_param)
        }else{
            User.findOne({'email' : targetEmail},function(err,user){
                if(err){
                    res.end(err)
                }else{
                    if(user && user._id){

                        user.retrieve_time = retrieveTime;
                        user.save(function(err){
                            if(err){
                                return next(err);
                            }else{
                                system.sendEmail(settings.email_findPsd,user,function(err){
                                    if(err){
                                        res.end(err)
                                    }else{
                                        console.log('-------邮件发送成功-------');
                                        res.end("success");
                                    }
                                });
                            }
                        })

                    }else{
                        res.end('错误：未能通过电子邮件地址找到用户。');
                    }
                }
            })
        }

    });

//点击找回密码链接跳转页面
    router.get('/reset_pass',function(req,res){
        var params = url.parse(req.url,true);
        var tokenId = params.query.key;
        var keyArr = DbOpt.getKeyArrByTokenId(tokenId);
        if(keyArr && validator.isEmail(keyArr[1])){
            User.findOne({'email' : keyArr[1]},function(err,user){
                if(err){
                    res.end(err);
                }else{
                    if(user && user._id){
                        if(user.password == keyArr[0] && keyArr[2] == settings.session_secret){
//                    校验链接是否过期
                            var now = new Date().getTime();
                            var oneDay = 1000 * 60 * 60 * 24;
                            if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
                                siteFunc.renderToTargetPageByType(req,res,'userInfo',{key : 'warning' ,value : '链接超时，密码无法重置。',page : 'userNotice'});
                            }
                            siteFunc.renderToTargetPageByType(req,res,'user',{title : '重设密码',page : 'userResetPsd',tokenId : tokenId});
                        }else{
                            siteFunc.renderToTargetPageByType(req,res,'userInfo',{key : 'warning' ,value : '信息有误，密码无法重置。',page : 'userNotice'});
                        }
                    }
                }

            })
        }else{
            res.end(settings.system_illegal_param)
        }


    });

    router.post('/updateNewPsd',function(req,res){

        var keyArr = DbOpt.getKeyArrByTokenId(req.body.tokenId);
        if(keyArr && validator.isEmail(keyArr[1])){
            User.findOne({'email' : keyArr[1]},function(err,user){
                if(err){
                    res.end(err);
                }else{
                    if(user.password == keyArr[0] && keyArr[2] == settings.session_secret
                        && validator.isPsd(req.body.password) && validator.isLength(req.body.password,6,12)){

                        user.password = DbOpt.encrypt(req.body.password,settings.encrypt_key);
                        user.save(function(err){
                            if(err){
                                res.end(err)
                            }else{
                                user.retrieve_time = null;
                                res.end('success');
                            }
                        })
                    }else{
                        res.end(settings.system_illegal_param);
                    }
                }
            })
        }else{
            res.end(settings.system_illegal_param)
        }


    });



//用户中心
    router.get('/userCenter', function(req, res, next) {
        if(isLogined(req)){
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户中心',page : 'userCenter'});
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });

//用户消息
    router.get('/userMessage', function(req, res, next) {
        if(isLogined(req)){
            siteFunc.renderToTargetPageByType(req,res,'userNotice',{title : '我的消息',page : 'userMessage'});
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });


// 修改用户密码页面
    router.get('/setUserPsd', function(req, res, next) {
        if(isLogined(req)){
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '密码重置',page : 'userSetPsd'});
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });


//用户参与话题
    router.get('/userReplies', function(req, res, next) {
        if(isLogined(req)){
            siteFunc.renderToTargetPageByType(req,res,'userReply',{title : '参与话题',page : 'userReplies'});
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });

//参与话题分页
    router.get('/userReplies/:defaultUrl',function(req, res){
        if(isLogined(req)){
            var defaultUrl = req.params.defaultUrl;
            var replyUrl = defaultUrl.split('—')[0];
            var replyPage = defaultUrl.split('—')[1];
            if (replyUrl == 'p') {
                replyPage = defaultUrl.split('—')[1].split(".")[0];
                if(replyPage && validator.isNumeric(replyPage)){
                    req.query.page = replyPage;
                }

                siteFunc.renderToTargetPageByType(req,res,'userReply',{title : '参与话题',page : 'userReplies'});

            }else{
                siteFunc.renderToTargetPageByType(req,res,'error',{info : '非法操作!',message :settings.system_illegal_param, page : 'do500'});
            }
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }
    });



// 用户退出
    router.get('/logout', function(req, res, next) {
        req.session.destroy();
        res.clearCookie(settings.auth_cookie_name, { path: '/' });
        res.end("success");
    });


//查找指定注册用户
    router.get('/userInfo', function(req, res, next) {

        var params = url.parse(req.url,true);
        var currentId = params.query.uid;
        if(shortid.isValid(currentId)){
            User.findOne({_id : currentId}, function (err,result) {
                if(err){

                }else{
//                针对有密码的记录，需要解密后再返回
                    if(result && result.password){
                        var decipher = crypto.createDecipher("bf",settings.encrypt_key);
                        var oldPsd = "";
                        oldPsd += decipher.update(result.password,"hex","utf8");
                        oldPsd += decipher.final("utf8");
                        result.password = oldPsd;
                    }
                    return res.json(result);
                }
            })
        }else{
            return res.json({});
        }

    });



//修改用户信息
    router.post('/userInfo/modify', function(req, res, next) {
        var errors;
        var email = req.body.email;
        var password = req.body.password;
        var userName = req.body.userName;
        var name = req.body.name;
        var city = req.body.city;
        var company = req.body.company;
        var qq = req.body.qq;
        var phoneNum = req.body.phoneNum;

        //    数据校验
        if(!validator.isUserName(userName)){
            errors = "用户名5-12个英文字符";
        }

        if(name && (!validator.isGBKName(name) || !validator.isLength(name,1,5))){
            errors = "姓名格式不正确";
        }

        if(!validator.isEmail(email)){
            errors = "请填写正确的邮箱地址";
        }

        if(city && (!validator.isGBKName(city) || !validator.isLength(city,0,12))){
            errors = "请填写正确的城市名称";
        }

        if(company && (!validator.isGBKName(company) || !validator.isLength(company,0,12))){
            errors = "请填写正确的学校中文名称";
        }

        if(qq && !validator.isQQ(qq)){
            errors = "请填写正确的QQ号码";
        }

        if(phoneNum && !validator.isMobilePhone(phoneNum, 'zh-CN')){
            errors = "请填写正确的手机号码";
        }

        if(errors){
            res.end(errors)
        }else{
            var newPsd = DbOpt.encrypt(password,settings.encrypt_key);
            req.body.password = newPsd;
            DbOpt.updateOneByID(User,req, res,"modify regUser");
        }

    });


//密码修改
    router.post('/resetMyPsd', function(req, res, next) {
        var params = url.parse(req.url,true);
        var userId = params.query.uid;
        var oldPassword = req.body.oldPassword;
        var userPsd = req.body.password;
        var errors;

        if(!validator.isPsd(oldPassword) || !validator.isLength(oldPassword,6,12)){
            errors = "6-12位，只能包含字母、数字和下划线";
        }
        if(!validator.isPsd(userPsd) || !validator.isLength(userPsd,6,12)){
            errors = "6-12位，只能包含字母、数字和下划线";
        }

        if(userPsd === oldPassword){
            errors = "新密码和原密码不能相同";
        }

        if(errors){
            res.end(errors)
        }else{
            //    密码加密
            var oldPsd = DbOpt.encrypt(oldPassword,settings.encrypt_key);
            var newPsd = DbOpt.encrypt(userPsd,settings.encrypt_key);
            if(shortid.isValid(userId)){
                User.findOne({_id:userId},function(err,user){
                    if(user){
//            验证是否是本人操作，提高安全性
                        if(oldPsd === user.password){
//                更新密码
                            User.update({_id:userId}, {password : newPsd}, function (err,result) {
                                if(err){
                                    res.end(err);
                                }else{
                                    res.end("success");
                                }
                            })
                        }
                        else{
                            res.end("数据有误，请稍后重试");
                        }
                    }
                    else
                    {
                        res.end("该用户不存在");
                    }
                })
            }else{
                res.end(settings.system_illegal_param);
            }
        }


    });





//-------------------------------------留言模块开始
// 用户留言
    router.post('/message/sent', function(req, res, next) {

        var errors;
        var contentId = req.body.contentId;
        var contentTitle = req.body.contentTitle;
        var authorId = req.session.user._id;
        var replyId = req.body.replyId;
        var replyEmail = req.body.replyEmail;
        var relationMsgId = req.body.relationMsgId;

        if(!shortid.isValid(contentId) || !contentTitle){
            errors = settings.system_illegal_param;
        }
        if(!authorId){
            errors = settings.system_illegal_param;
        }
        if(replyEmail && !validator.isEmail(replyEmail)){
            errors = settings.system_illegal_param;
        }

        if(errors){
            res.end(errors);
        }else{


            if(replyId){
                req.body.replyAuthor = new User({_id : replyId,email : replyEmail});
                req.body.relationMsgId = relationMsgId;
            }

            req.body.author = new User({_id : authorId,userName : req.session.user.userName});
            var newMsg = new Message(req.body);
            newMsg.save(function(){
//              更新评论数
                Content.updateCommentNum(contentId,'add',function(){
//              如果被评论用户存在邮箱，则发送提醒邮件
                    if(newMsg.replyAuthor && newMsg.replyAuthor.email){
                        system.sendEmail(settings.email_notice_user_contentMsg,newMsg,function(err){
                            if(err){
                                res.end(err);
                            }
                            console.log('-----sent user email success--------')
                        });
                    }else{
//                    给管理员发送消息,这里异步就可以，不用等到邮件发送成功再返回结果
//                        system.sendEmail(settings.email_notice_contentMsg,newMsg,function(err){
//                            if(err){
//                                res.end(err);
//                            }
//                            console.log('-----sent notice admin email success--------')
//                        });
                        siteFunc.sendSystemNoticeByType(req,res,'msg',newMsg);
                    }

                    res.end("success");
                });

            });

        }

    });


//-------------------------------------留言模块结束


//-------------------------------------消息通知模块开始
    router.get('/userNotify/setHasRead',function(req,res){
        var params = url.parse(req.url,true);
        var currentId = params.query.msgId;
        if(currentId){
            if(isLogined(req)){
                UserNotify.setHasRead(currentId,function(err){
                    if(err){
                        res.end(err);
                    }else{
                        UserNotify.getNoReadNotifyCountByUserId(req.session.user._id,'user',function(err,count){
                            req.session.user.msg_count = count;
                            io.sockets.emit('notifyNum', {msg_count: count });
                            res.end('success');
                        });
                    }
                });
            }else{
                siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
            }
        }else{
            res.end(settings.system_illegal_param);
        }
    });

//     批量删除消息
    router.get('/userNotify/batchDel',function(req,res){
        var params = url.parse(req.url,true);
        var ids = params.query.ids;
        var idsArr = ids.split(',');
        if(isLogined(req)){
            if(idsArr.length > 0){
                UserNotify.remove({'_id':{$in: idsArr}},function(err){
                    if(err){
                        res.end(err);
                    }else{
                        res.end("success");
                    }
                });
            }else{
                res.end('请选择至少一项后再执行删除操作！');
            }

        }else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }

    });



//  消息通知分页
    router.get('/userNotifies/:defaultUrl',function(req, res){
        if(isLogined(req)){
            var defaultUrl = req.params.defaultUrl;
            var notifyUrl = defaultUrl.split('—')[0];
            var replyPage = defaultUrl.split('—')[1];
            if (notifyUrl == 'p') {
                replyPage = defaultUrl.split('—')[1].split(".")[0];
                if(replyPage && validator.isNumeric(replyPage)){
                    req.query.page = replyPage;
                }
                siteFunc.renderToTargetPageByType(req,res,'userNotice',{title : '我的消息',page : 'userMessage'});
            }else{
                siteFunc.renderToTargetPageByType(req,res,'error',{info : '非法操作!',message :settings.system_illegal_param, page : 'do500'});
            }
        }
        else{
            siteFunc.renderToTargetPageByType(req,res,'user',{title : '用户登录',page : 'userLogin'});
        }
    });

//-------------------------------------消息通知模块结束


    return router;

};


module.exports = returnUsersRouter;
