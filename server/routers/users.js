const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true
const fs = require('fs')
const path = require('path')
const {
    authSession
} = require('../../utils');
const generalFun = require("../lib/utils/generalFun");
const settings = require('../../configs/settings');
const {
    AdminUser,
    ContentCategory,
    Content,
    ContentTag,
    User,
    Message,
    SystemConfig,
    UserNotify,
    Ads
} = require('../lib/controller');
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
        res.redirect('/users/login');
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


router.get('/personInfo', checkUserSessionForPage, (req, res, next) => {
    req.query.title = "编辑用户信息";
    req.query.tempPage = 'users/personInfo.html';
    next()
}, generalFun.getDataForUserCenter);

//忘记密码
// router.get('/forgotPsd', (req, res, next) => {
//     if (req.session.user) {
//         res.redirect('/');
//     } else {
//         next();
//     }
// }, (req, res, next) => {
//     req.query.title = "忘记密码";
//     req.query.tempPage = 'users/userForgotPsd.html';
//     next()
// }, generalFun.getDataForForgotPsd);

//忘记密码通过邮箱
// router.get('/forgotPsdByEmail', (req, res, next) => {
//     if (req.session.user) {
//         res.redirect('/');
//     } else {
//         next();
//     }
// }, (req, res, next) => {
//     req.query.title = "忘记密码";
//     req.query.tempPage = 'users/userForgotPsdByEmail.html';
//     next()
// }, generalFun.getDataForForgotPsd);
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
    req.query.contentType = 'normal';
    next()
}, generalFun.getDataForUserCenter);

router.get('/editContent/:id', checkUserSessionForPage, async (req, res, next) => {

    let contentId = req.params.id;
    if (!shortid.isValid(contentId)) {
        res.redirect("/users/userCenter");
    } else {
        let contentInfo = await ContentBiz.getOneContentByParams({
            _id: contentId,
            uAuthor: req.session.user._id,
            state: '0'
        });
        if (!_.isEmpty(contentInfo)) {
            req.query.title = "编辑创作";
            req.query.contentId = contentId;
            req.query.contentType = contentInfo.type == '1' ? 'normal' : 'special';
            req.query.tempPage = 'users/userAddContent.html';
            next()
        } else {
            res.redirect("/users/userCenter");
        }

    }

}, generalFun.getDataForUserCenter);




// 找回密码
router.get('/confirmEmail', generalFun.getDataForResetPsdPage)

//点击找回密码链接跳转页面
router.get('/reset_pass', User.reSetPass);

router.post('/updateNewPsd', User.updateNewPsd);



module.exports = router;