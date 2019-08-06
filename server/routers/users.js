const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true

const generalFun = require("../lib/utils/generalFun");
const {
    authSessionForPage
} = require('@middleware')

const shortid = require('shortid');
const _ = require('lodash')



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
router.get('/userCenter', authSessionForPage, (req, res, next) => {
    req.query.title = "用户中心";
    req.query.tempPage = 'users/userCenter.html';
    next()
}, generalFun.getDataForUserCenter);


// 修改用户密码页面
router.get('/setUserPsd', authSessionForPage, (req, res, next) => {
    req.query.title = "修改密码";
    req.query.tempPage = 'users/userSetPsd.html';
    next()
}, generalFun.getDataForUserCenter);


router.get('/personInfo', authSessionForPage, (req, res, next) => {
    req.query.title = "编辑用户信息";
    req.query.tempPage = 'users/personInfo.html';
    next()
}, generalFun.getDataForUserCenter);


// 用户相关主界面
router.get('/userContents', authSessionForPage, (req, res, next) => {
    req.query.title = "我的发布";
    req.query.tempPage = 'users/userContents.html';
    next()
}, generalFun.getDataForUserCenter);


// 用户投稿主界面
router.get('/userAddContent', authSessionForPage, (req, res, next) => {
    req.query.title = "投稿";
    req.query.tempPage = 'users/userAddContent.html';
    req.query.contentType = 'normal';
    next()
}, generalFun.getDataForUserCenter);

router.get('/editContent/:id', authSessionForPage, async (req, res, next) => {

    let contentId = req.params.id;
    if (!shortid.isValid(contentId)) {
        res.redirect("/users/userCenter");
    } else {
        let contentInfo = await reqJsonData('content/getContent', {
            id: contentId,
            userId: req.session.user._id,
            token: req.session.user.token
        });
        if (!_.isEmpty(contentInfo)) {
            req.query.pageType = 'editContent';
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


module.exports = router;