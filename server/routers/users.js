const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true
const fs = require('fs')
const path = require('path')
const { authSession } = require('../../utils');
const generalFun = require("../lib/utils/generalFun");
const settings = require('../../configs/settings');
const { AdminUser, ContentCategory, Content, ContentTag, User, Message, SystemConfig, UserNotify, Ads } = require('../lib/controller');
const moment = require('moment');
const shortid = require('shortid');
const _ = require('lodash')

//校验是否登录
function isLogined(req) {
    return req.session.logined;
}

function checkUserSessionForPage(req, res, next) {
    if (!_.isEmpty(req.session.user)) {
        next()
    } else {
        res.redirect('/');
    }
}

function checkUserSessionForApi(req, res, next) {
    if (!_.isEmpty(req.session.user)) {
        next()
    } else {
        res.send({
            status: 500,
            message: res.__("label_notice_asklogin")
        });
    }
}


//用户登录
router.get('/login', function (req, res, next) {
    if (req.session.user) {
        res.redirect("/");
    } else {
        req.query.title = '用户登录';
        req.query.tempPage = 'users/userLogin.html';
        next()
    }
}, generalFun.getDataForUserLoginAndReg);

// 用户登录提交请求
router.post('/doLogin', User.loginAction);

//用户注册
router.get('/reg', function (req, res, next) {
    if (req.session.user) {
        res.redirect("/");
    } else {
        req.query.title = '用户注册';
        req.query.tempPage = 'users/userReg.html';
        next()
    }
}, generalFun.getDataForUserLoginAndReg);


// 用户注册
router.post('/doReg', User.regAction);


//用户中心
router.get('/userCenter', checkUserSessionForPage, (req, res, next) => {
    req.query.title = "用户中心";
    req.query.tempPage = 'users/userCenter.html';
    next()
}, generalFun.getDataForUserCenter);


// 修改用户密码页面
router.get('/setUserPsd', checkUserSessionForPage, (req, res, next) => {
    req.query.title = "修改密码";
    req.query.tempPage = 'users/userSetPsd.html';
    next()
}, generalFun.getDataForUserCenter);

// 用户相关主界面
router.get('/userContents', checkUserSessionForPage, (req, res, next) => {
    req.query.title = "我的发布";
    req.query.tempPage = 'users/userContents.html';
    next()
}, generalFun.getDataForUserCenter);


// 用户投稿主界面
router.get('/userAddContent', checkUserSessionForPage, (req, res, next) => {
    req.query.title = "投稿";
    req.query.tempPage = 'users/userAddContent.html';
    next()
}, generalFun.getDataForUserCenter);


//查找指定注册用户
router.get('/userInfo', checkUserSessionForApi, function (req, res, next) {

    res.send({
        status: 200,
        data: {
            userInfo: req.session.user
        }
    })
});


// 用户留言
router.post('/message/post', checkUserSessionForApi, Message.postMessages)

//-------------------------------------留言模块结束


//-------------------------------------消息通知模块开始
router.get('/userNotify/setHasRead', function (req, res) {

});

//     批量删除消息
router.get('/userNotify/batchDel', function (req, res) {


});


// 修改用户信息
router.post('/updateInfo', checkUserSessionForApi, User.updateUser);

// 获取用户通知信息
router.get('/getUserNotifys', checkUserSessionForApi, (req, res, next) => { req.query.user = req.session.user._id; next() }, UserNotify.getUserNotifys);

// 设置用户消息为已读
router.get('/setNoticeRead', checkUserSessionForApi, (req, res, next) => { req.query.user = req.session.user._id; next() }, UserNotify.setMessageHasRead);

// 删除用户消息
router.get('/delUserNotify', checkUserSessionForApi, UserNotify.delUserNotify);

// 获取用户参与话题
router.get('/getUserReplies', checkUserSessionForApi, (req, res, next) => { req.query.user = req.session.user._id; next() }, Message.getMessages);

// 获取用户发布文章
router.get('/getUserContents', checkUserSessionForApi, (req, res, next) => { req.query.user = req.session.user._id; next() }, Content.getContents);

// 用户注销
router.get('/logOut', checkUserSessionForApi, User.logOut);

// 找回密码
router.get('/confirmEmail', generalFun.getDataForResetPsdPage)

//提交验证邮箱
router.post('/sentConfirmEmail', (req, res, next) => {
    // console.log('-------sentConfirmEmail--------');
    next();
}, User.sentConfirmEmail);

//点击找回密码链接跳转页面
router.get('/reset_pass', User.reSetPass);

router.post('/updateNewPsd', User.updateNewPsd);

// 发送邮件给管理员
router.post('/postEmailToAdminUser', User.postEmailToAdminUser);

module.exports = router;