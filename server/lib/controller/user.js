const BaseComponent = require('../prototype/baseComponent');
const UserModel = require("../models").User;
const MessageModel = require("../models").Message;
const NotifyModel = require("../models").Notify;
const UserNotifyModel = require("../models").UserNotify;
const AdminUserModel = require("../models").AdminUser;
const SystemConfigModel = require("../models").SystemConfig;
const ContentTemplateModel = require("../models").ContentTemplate;
const ContentModel = require("../models").Content;

const ContentTagModel = require("../models").ContentTag;
const formidable = require('formidable');

const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');

const jwt = require('jsonwebtoken');
const cache = require('../../../utils/middleware/cache');
const settings = require('../../../configs/settings');
const shortid = require('shortid');
const validator = require('validator');
const _ = require('lodash')
const fs = require('fs')
const captcha = require('trek-captcha')
const xss = require("xss");
const moment = require('moment');
const https = require('https');


function checkFormData(req, res, fields) {
    let errMsg = '';
    // console.log('----')
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (fields.profession && !validator.isNumeric(fields.profession)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_profession")
        });
    }
    if (fields.industry && !validator.isNumeric(fields.industry)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_introduction")
        });
    }
    if (fields.experience && !validator.isNumeric(fields.experience)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_experience")
        });
    }
    if (fields.userName && !validatorUtil.isRegularCharacter(fields.userName)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_user_userName")
        });
    }
    if (fields.userName && !validator.isLength(fields.userName, 2, 30)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 12,
            label: res.__("label_user_userName")
        });
    }
    if (fields.name && !validatorUtil.isRegularCharacter(fields.name)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_name")
        });
    }
    if (fields.name && !validator.isLength(fields.name, 2, 20)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 20,
            label: res.__("label_name")
        });
    }

    if (fields.gender && (fields.gender != '0' && fields.gender != '1')) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("lc_gender")
        });
    }
    if (fields.email && !validatorUtil.checkEmail(fields.email)) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("label_user_email")
        });
    }

    if (fields.introduction && !validatorUtil.isRegularCharacter(fields.introduction)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_introduction")
        });
    }
    if (fields.introduction && !validator.isLength(fields.introduction, 2, 100)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 100,
            label: res.__("label_introduction")
        });
    }
    if (fields.comments && !validatorUtil.isRegularCharacter(fields.comments)) {
        errMsg = res.__("validate_error_field", {
            label: res.__("label_comments")
        });
    }
    if (fields.comments && !validator.isLength(fields.comments, 2, 100)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 100,
            label: res.__("label_comments")
        });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

function renderUserList(userInfo = {}, userList = [], useClient = '2', params = {}) {

    return new Promise(async (resolve, reject) => {
        try {
            let newUserList = JSON.parse(JSON.stringify(userList));
            for (let userItem of newUserList) {

                if (useClient != '0') {
                    let userContents = await ContentModel.find({
                        uAuthor: userItem._id,
                        state: '2'
                    }, '_id');
                    userItem.content_num = userContents.length;
                    userItem.watch_num = _.uniq(userItem.watchers).length;
                    userItem.follow_num = _.uniq(userItem.followers).length;
                    userItem.had_followed = false;

                    // 参与的评论数
                    let comments_num = await MessageModel.count({
                        author: userItem._id
                    });
                    userItem.comments_num = comments_num;

                    // 收藏的文章数量
                    userItem.favorites_num = userItem.favorites ? userItem.favorites.length : 0;

                    // 只有查询单个用户才查询点赞总数和被关注人数
                    if (params.apiName == 'getUserInfoById') {
                        let total_likeNum = 0,
                            total_despiseNum = 0;
                        for (const contentItem of userContents) {
                            total_likeNum += await UserModel.count({
                                praiseContents: contentItem._id
                            });
                            total_despiseNum += await UserModel.count({
                                despises: contentItem._id
                            });
                        }
                        userItem.total_likeNum = total_likeNum;
                        userItem.total_despiseNum = total_despiseNum;
                    }

                    // console.log('---userItem.followers---', userItem.followers)
                    // console.log('userId--', userId)
                    if (!_.isEmpty(userInfo)) {
                        if (userInfo.watchers.indexOf(userItem._id) >= 0) {
                            userItem.had_followed = true;
                        }
                    }

                    siteFunc.clearUserSensitiveInformation(userItem);
                } else {


                }

            }

            resolve(newUserList);
        } catch (error) {
            resolve(userList);
        }
    })

}


function getCacheValueByKey(key) {
    return new Promise((resolve, reject) => {
        cache.get(key, (targetValue) => {
            if (targetValue) {
                resolve(targetValue)
            } else {
                resolve('');
            }
        })
    })
}



class User {
    constructor() {
        // super()
    }

    async getImgCode(req, res) {
        const {
            token,
            buffer
        } = await captcha();
        req.session.imageCode = token;
        res.writeHead(200, {
            'Content-Type': 'image/png'
        });
        res.write(buffer);
        res.end();
    }

    async getUsers(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let searchkey = req.query.searchkey,
                queryObj = {};
            let isTopBar = req.query.isTopBar;
            let follow = req.query.follow;
            let category = req.query.category;
            let userInfo = req.session.user || {};
            let group = req.query.group;
            let useClient = req.query.useClient;
            let sortby = req.query.sortby;
            let sortObj = {
                date: -1
            }
            let populateArr = [{
                path: 'category',
                select: 'name _id'
            }];

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i');
                if (isTopBar == '1') {
                    queryObj.$or = [{
                        userName: {
                            $regex: reKey
                        }
                    }, {
                        phoneNum: {
                            $regex: reKey
                        }
                    }, {
                        email: {
                            $regex: reKey
                        }
                    }];
                } else {
                    queryObj.userName = {
                        $regex: reKey
                    }
                }

            }

            if (category) {
                queryObj.category = category;
            }

            if (group) {
                queryObj.group = group;
            }

            if (sortby == '1') {
                sortObj = {
                    followers: 1
                }
            }
            // console.log('--req.session.user---', req.session.user);
            if (follow) {
                if (follow == '1' && req.session.user) {
                    queryObj._id = {
                        $in: req.session.user.watchers
                    };
                    populateArr = [{
                        path: 'category',
                        select: 'name _id'
                    }];
                } else {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }
            }
            let files = (useClient != '0') ? siteFunc.getAuthUserFields('base') : null;
            // console.log('--queryObj---', queryObj)
            let users = await UserModel.find(queryObj, files).sort(sortObj).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate(populateArr).exec();
            let renderUsers = await renderUserList(userInfo, users, useClient, {
                sortby
            });
            // console.log('---renderUsers--', renderUsers)
            const totalItems = await UserModel.count(queryObj);
            let renderData = {
                docs: renderUsers,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            }
            if (modules && modules.length > 0) {
                return renderUsers;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'user', renderUsers, 'getlist'));
                } else {
                    res.send(siteFunc.renderApiData(req, res, 200, 'user', renderData, 'getlist'));
                }
            }

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }


    // 获取随机大师
    async getRandomMasters(req, res, next) {
        try {
            let queryObj = {};
            let userInfo = req.session.user || {};
            _.assign(queryObj, {
                enable: true,
                group: '1'
            })
            const totalContents = await UserModel.count(queryObj);
            const randomArticles = await UserModel.find(queryObj).skip(Math.floor(totalContents * Math.random())).limit(10);
            let renderRandomList = await renderUserList(userInfo, randomArticles)
            res.send(siteFunc.renderApiData(req, res, 200, 'get getRandomMasters success', renderRandomList, 'save'));
        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getRandomMasters'));
        }

    }

    async getOneUserByParams(params) {
        return await UserModel.findOne(params, siteFunc.getAuthUserFields('session')).populate([{
            path: 'category',
            select: 'name _id'
        }]);
    }

    async getUserInfoById(req, res, next) {
        try {
            let targetId = req.query.id;
            let user = req.session.user || {};
            if (!shortid.isValid(targetId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            let targetUser = await UserModel.find({
                _id: targetId
            }, siteFunc.getAuthUserFields('base'));
            let renderUser = await renderUserList(user, targetUser, '2', {
                apiName: 'getUserInfoById'
            });
            let userInfo = {};
            if (!_.isEmpty(renderUser) && (renderUser.length == 1)) {
                userInfo = renderUser[0];
            }
            res.send(siteFunc.renderApiData(req, res, 200, 'getUserInfoById', userInfo, 'getlist'));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'))
        }

    }


    // 我关注的专题、大师等信息
    async getMyFollowInfos(req, res, next) {
        try {
            let userInfo = req.session.user;
            let targetUser = await UserModel.findOne({
                _id: userInfo._id
            }, 'watchers').populate([{
                path: 'watchers',
                select: 'name userName _id logo'
            }]).exec();
            // console.log('-targetUser----', targetUser)
            let watchersList = targetUser.watchers;

            let watchMasterContents = [];
            for (const master of watchersList) {
                let masterId = master._id;
                let masterContents = await ContentModel.find({
                    uAuthor: masterId,
                    state: '2'
                }, siteFunc.getContentListFields(true)).populate([{
                    path: 'uAuthor',
                    select: '_id userName logo name group'
                }]);
                if (!_.isEmpty(masterContents)) {
                    watchMasterContents = [].concat(masterContents);
                }
            }

            let renderData = {
                watchersList,
                watchMasterContents
            }

            res.send(siteFunc.renderApiData(req, res, 200, 'getMyFollowInfos', renderData, 'save'));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'getlist'))
        }
    }

    async updateUser(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                await siteFunc.checkPostToken(req, res, fields.token);

                checkFormData(req, res, fields);

                const userObj = {};
                if (fields.enable != 'undefined' && fields.enable != undefined) {
                    userObj.enable = fields.enable;
                }
                if (fields.userName) {
                    userObj.userName = fields.userName;
                }
                if (fields.name) {
                    userObj.name = fields.name;
                }
                if (fields.gender) {
                    userObj.gender = fields.gender;
                }
                // TODO 邮箱暂不支持独立更改
                // if (fields.email) {
                //     userObj.email = fields.email;
                // }
                if (fields.logo) {
                    userObj.logo = fields.logo;
                }
                // if (fields.phoneNum) {
                //     userObj.phoneNum = fields.phoneNum;
                // }
                if (fields.confirm) {
                    userObj.confirm = fields.confirm;
                }
                if (fields.group) {
                    userObj.group = fields.group;
                }
                if (fields.category) {
                    userObj.category = fields.category;
                }
                if (fields.comments) {
                    userObj.comments = xss(fields.comments);
                }
                // if (fields.introduction) {
                userObj.introduction = xss(fields.introduction);
                // }
                if (fields.company) {
                    userObj.company = fields.company;
                }
                if (fields.province) {
                    userObj.province = fields.province;
                }
                if (fields.city) {
                    userObj.city = fields.city;
                }
                if (fields.birth) {
                    // 生日日期不能大于当前时间
                    if (new Date(fields.birth).getTime() > new Date().getTime()) {
                        throw new siteFunc.UserException(res.__('validate_error_params'));
                    }
                    userObj.birth = fields.birth;
                }
                if (fields.industry) {
                    userObj.industry = xss(fields.industry);
                }
                if (fields.profession) {
                    userObj.profession = xss(fields.profession);
                }
                if (fields.experience) {
                    userObj.experience = xss(fields.experience);
                }
                if (fields.password) {
                    userObj.password = service.encrypt(fields.password, settings.encrypt_key);
                }

                let targetUserId = '';
                // console.log('---cc-', req.query.useClient)
                if (req.query.useClient == '0') {
                    targetUserId = fields._id;
                } else {
                    targetUserId = req.session.user._id;
                }

                // console.log('--userObj--', userObj);
                // console.log('--targetUserId--', targetUserId);
                await UserModel.findOneAndUpdate({
                    _id: targetUserId
                }, {
                    $set: userObj
                });


                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('lc_basic_sub_btn')
                }), {}, 'updateUserInfo'));

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async bindEmailOrPhoneNum(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                await siteFunc.checkPostToken(req, res, fields.token);

                let userInfo = req.session.user;
                let bindType = fields.type;
                let errMsg = '';

                if (bindType != '1' && bindType != '2') {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                if (bindType == '1') {
                    if (!fields.phoneNum || !validatorUtil.checkPhoneNum((fields.phoneNum).toString())) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_phoneNum")
                        })
                    }

                    if (!fields.countryCode) {
                        errMsg = res.__("validate_selectNull", {
                            label: res.__("label_user_countryCode")
                        });
                    }

                    if (userInfo.phoneNum) {
                        throw new siteFunc.UserException(res.__("user_action_tips_repeat", {
                            label: res.__('lc_bind')
                        }));
                    }

                    let queryUserObj = {
                        $or: [{
                            phoneNum: fields.phoneNum,
                        }, {
                            phoneNum: '0' + fields.phoneNum,
                        }],
                        countryCode: fields.countryCode
                    };

                    if (fields.phoneNum.indexOf('0') == '0') {
                        queryUserObj = {
                            $or: [{
                                phoneNum: fields.phoneNum
                            }, {
                                phoneNum: fields.phoneNum.substr(1),
                            }],
                            countryCode: fields.countryCode
                        };
                    }

                    let userRecords = await UserModel.findOne(queryUserObj);
                    if (!_.isEmpty(userRecords)) {
                        throw new siteFunc.UserException(res.__('validate_user_had_bind'));
                    }

                } else {
                    if (!validatorUtil.checkEmail(fields.email)) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_email")
                        });
                    }
                    // console.log('--userInfo-', userInfo)
                    if (userInfo.email) {
                        throw new siteFunc.UserException(res.__("user_action_tips_repeat", {
                            label: res.__('lc_bind')
                        }));
                    }
                    let userRecords = await UserModel.findOne({
                        email: fields.email
                    });
                    if (!_.isEmpty(userRecords)) {
                        throw new siteFunc.UserException(res.__('validate_user_had_bind'));
                    }
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                let endStr = bindType == '2' ? fields.email : (fields.countryCode + fields.phoneNum);

                let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_tourist_bindAccount_' + endStr);

                if (!fields.messageCode || !validator.isNumeric((fields.messageCode).toString()) || (fields.messageCode).length != 6 || currentCode != fields.messageCode) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_imageCode")
                    })
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                const userObj = {};

                if (bindType == '1') {
                    userObj.phoneNum = fields.phoneNum;
                    userObj.countryCode = fields.countryCode;
                } else {
                    userObj.email = fields.email;
                }

                await UserModel.findOneAndUpdate({
                    _id: userInfo._id
                }, {
                    $set: userObj
                });

                siteFunc.clearRedisByType(endStr, '_sendMessage_tourist_bindAccount_');

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('lc_basic_sub_btn')
                }), {}, 'bindEmailOrPhoneNum'));

            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'bindEmailOrPhoneNum'));
            }
        })

    }


    async delUser(req, res, next) {
        try {
            let errMsg = '',
                targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            for (let i = 0; i < targetIds.length; i++) {
                let regUserMsg = await MessageModel.find({
                    'author': targetIds[i]
                });
                if (!_.isEmpty(regUserMsg)) {

                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_del_adminUser_notice"), 'delete'));

                    return;
                }
            }
            await UserModel.remove({
                '_id': {
                    $in: targetIds
                }
            });
            res.send(siteFunc.renderApiData(req, res, 200, 'user', {}, 'delete'));

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    async loginAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                // let currentCode = '123456';
                let errMsg = '',
                    loginType = fields.loginType || '1'; // 1:手机验证码登录 2:手机号密码登录 3:邮箱密码登录

                // TODO 临时兼容没有改动的APP端
                if (fields.phoneNum && fields.password) {
                    loginType = 2;
                }

                if (fields.email && fields.password) {
                    loginType = 3;
                }

                // console.log('--loginType--', loginType)
                if (loginType != '1' && loginType != '2' && loginType != '3' && loginType != '4') {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                if (loginType == '1' || loginType == '2') {

                    if (!fields.phoneNum || !validatorUtil.checkPhoneNum((fields.phoneNum).toString())) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_phoneNum")
                        })
                    }

                    if (!fields.countryCode) {
                        errMsg = res.__("validate_selectNull", {
                            label: res.__("label_user_countryCode")
                        });
                    }

                    if (loginType == '2') {
                        if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
                            errMsg = res.__("validate_rangelength", {
                                min: 6,
                                max: 12,
                                label: res.__("label_user_password")
                            })
                        }
                    } else if (loginType == '1') {

                        let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_login_' + (fields.countryCode + fields.phoneNum));
                        if (!fields.messageCode || !validator.isNumeric((fields.messageCode).toString()) || (fields.messageCode).length != 6 || currentCode != fields.messageCode) {
                            errMsg = res.__("validate_inputCorrect", {
                                label: res.__("label_user_imageCode")
                            })
                        }
                    }

                } else if (loginType == '3') {
                    if (!validatorUtil.checkEmail(fields.email)) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_email")
                        });
                    }
                    if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
                        errMsg = res.__("validate_rangelength", {
                            min: 6,
                            max: 12,
                            label: res.__("label_user_password")
                        })
                    }
                } else if (loginType == '4') {
                    if (!validatorUtil.checkEmail(fields.email)) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_email")
                        });
                    }
                    let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_login_' + fields.email);
                    if (!fields.messageCode || !validator.isNumeric((fields.messageCode).toString()) || (fields.messageCode).length != 6 || currentCode != fields.messageCode) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_imageCode")
                        })
                    }
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                let queryUserObj = {
                    $or: [{
                        phoneNum: fields.phoneNum
                    }, {
                        phoneNum: '0' + fields.phoneNum
                    }],
                    countryCode: fields.countryCode
                };

                if (loginType != '3' && loginType != '4' && fields.phoneNum.indexOf('0') == '0') {
                    queryUserObj = {
                        $or: [{
                            phoneNum: fields.phoneNum
                        }, {
                            phoneNum: fields.phoneNum.substr(1)
                        }],
                        countryCode: fields.countryCode
                    };
                }

                let userObj = {};
                if (loginType == '1') {
                    _.assign(userObj, queryUserObj)
                } else if (loginType == '2') {
                    _.assign(userObj, queryUserObj, {
                        password: service.encrypt(fields.password, settings.encrypt_key)
                    })
                } else if (loginType == '3') {
                    _.assign(userObj, {
                        email: fields.email
                    }, {
                        password: service.encrypt(fields.password, settings.encrypt_key)
                    })
                } else if (loginType == '4') {
                    _.assign(userObj, {
                        email: fields.email
                    })
                    queryUserObj = {
                        email: fields.email
                    }
                }

                // 初级校验
                // console.log('---queryUserObj--', queryUserObj)
                let userCount = await UserModel.count(queryUserObj);
                // console.log('-userCount----', userCount)
                if (userCount > 0 || loginType == '2' || loginType == '3') {
                    // 校验登录用户合法性
                    let user = await UserModel.findOne(userObj, siteFunc.getAuthUserFields('login'));

                    if (_.isEmpty(user)) {
                        if (loginType == '2') {
                            throw new siteFunc.UserException(res.__('validate_login_notSuccess_1'));
                        } else {
                            throw new siteFunc.UserException(res.__('validate_login_notSuccess'));
                        }
                    }
                    if (!user.enable) {
                        throw new siteFunc.UserException(res.__("validate_user_forbiden"));
                    }

                    if (!user.loginActive) {
                        await UserModel.findOneAndUpdate({
                            _id: user._id
                        }, {
                            $set: {
                                loginActive: true
                            }
                        });
                    }

                    let renderUser = JSON.parse(JSON.stringify(user));
                    let auth_token = user._id + '$$$$' + settings.encrypt_key; // 以后可能会存储更多信息，用 $$$$ 来分隔

                    // 针对 App 端同时创建 Token
                    renderUser.token = jwt.sign({
                        userId: user._id
                    }, settings.encrypt_key, {
                        expiresIn: '30day'
                    })

                    // 将cookie存入缓存
                    res.cookie(settings.auth_cookie_name, auth_token, {
                        path: '/',
                        maxAge: 1000 * 60 * 60 * 24 * 30,
                        signed: true,
                        httpOnly: true
                    }); //cookie 有效期30天

                    // 重置验证码
                    let endStr = loginType == '3' ? fields.email : (fields.countryCode + fields.phoneNum);
                    siteFunc.clearRedisByType(endStr, '_sendMessage_login_');
                    // console.log('--111---',renderUser)
                    res.send(siteFunc.renderApiData(req, res, 200, res.__("validate_user_loginOk"), renderUser));
                } else {
                    console.log('No user,create new User');
                    // 没有该用户数据，新建该用户


                    let createUserObj = {
                        group: '0',
                        creativeRight: false,
                        loginActive: true,
                        birth: '1770-01-01',
                        enable: true
                    };

                    if (loginType == '1') {
                        createUserObj.phoneNum = fields.phoneNum;
                        createUserObj.countryCode = fields.countryCode;
                        createUserObj.userName = fields.phoneNum;
                    } else if (loginType == '4') {
                        createUserObj.email = fields.email;
                        createUserObj.userName = fields.email;
                    }

                    let createUser = new UserModel(createUserObj);
                    let currentUser = await createUser.save();


                    let newUser = await UserModel.findOne({
                        _id: currentUser._id
                    }, siteFunc.getAuthUserFields('login'));
                    let renderUser = JSON.parse(JSON.stringify(newUser));

                    let auth_token = renderUser._id + '$$$$' + settings.encrypt_key; // 以后可能会存储更多信息，用 $$$$ 来分隔
                    renderUser.token = jwt.sign({
                        userId: renderUser._id
                    }, settings.encrypt_key, {
                        expiresIn: '30day'
                    })
                    res.cookie(settings.auth_cookie_name, auth_token, {
                        path: '/',
                        maxAge: 1000 * 60 * 60 * 24 * 30,
                        signed: true,
                        httpOnly: true
                    });

                    // 重置验证码
                    let endStr = loginType == '3' ? fields.email : (fields.countryCode + fields.phoneNum);
                    siteFunc.clearRedisByType(endStr, '_sendMessage_login_');
                    // console.log('--222---',renderUser)
                    res.send(siteFunc.renderApiData(req, res, 200, res.__("validate_user_loginOk"), renderUser));

                }
            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err));
            }

        })
    }

    async touristLoginAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                let userCode = fields.userCode;

                if (!userCode) {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                let renderCode = service.decryptApp(settings.encryptApp_key, settings.encryptApp_vi, userCode);

                if (!renderCode) {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                let targetUser = await UserModel.findOne({
                    deviceId: renderCode
                });

                if (!_.isEmpty(targetUser)) {

                    console.log('get old tourist User');

                    if (!targetUser.enable) {
                        throw new siteFunc.UserException(res.__("validate_user_forbiden"));
                    }

                    let renderUser = JSON.parse(JSON.stringify(targetUser));

                    // 针对 App 端同时创建 Token
                    renderUser.token = jwt.sign({
                        userId: targetUser._id
                    }, settings.encrypt_key, {
                        expiresIn: '30day'
                    })

                    res.send(siteFunc.renderApiData(req, res, 200, res.__("validate_user_loginOk"), renderUser));

                } else {

                    console.log('create new tourist User');
                    // 没有该用户数据，新建该用户

                    let createUserObj = {
                        userName: renderCode,
                        deviceId: renderCode,
                        group: '0',
                        creativeRight: false,
                        loginActive: true,
                        birth: '1770-01-01',
                        enable: true
                    };

                    let createUser = new UserModel(createUserObj);
                    let currentUser = await createUser.save();

                    let newUser = await UserModel.findOne({
                        _id: currentUser._id
                    }, siteFunc.getAuthUserFields('login'));
                    let renderUser = JSON.parse(JSON.stringify(newUser));

                    renderUser.token = jwt.sign({
                        userId: renderUser._id
                    }, settings.encrypt_key, {
                        expiresIn: '30day'
                    })

                    res.send(siteFunc.renderApiData(req, res, 200, res.__("validate_user_loginOk"), renderUser));

                }

            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err));
            }

        })
    }

    async regAction(req, res, next) {

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                let errMsg = '';
                let uid = fields.uid;
                let regType = fields.regType || '1'; // 1:手机号注册  2:邮箱注册

                if (regType != '1' && regType != '2') {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                if (regType == '1') {
                    if (!fields.phoneNum || !validatorUtil.checkPhoneNum((fields.phoneNum).toString())) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_phoneNum")
                        })
                    }

                    if (!fields.countryCode) {
                        errMsg = res.__("validate_selectNull", {
                            label: res.__("label_user_countryCode")
                        });
                    }

                } else if (regType == '2') {
                    if (!validatorUtil.checkEmail(fields.email)) {
                        errMsg = res.__("validate_inputCorrect", {
                            label: res.__("label_user_email")
                        });
                    }
                }

                let endStr = regType == '1' ? (fields.countryCode + fields.phoneNum) : fields.email;
                let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_reg_' + endStr);

                console.log('--currentCode---', currentCode)
                if (!validator.isNumeric((fields.messageCode).toString()) || (fields.messageCode).length != 6 || currentCode != fields.messageCode) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_imageCode")
                    })
                }

                if (fields.userName && !validator.isLength(fields.userName, 2, 12)) {
                    errMsg = res.__("validate_rangelength", {
                        min: 2,
                        max: 12,
                        label: res.__("label_user_userName")
                    });
                }

                if (fields.userName && !validatorUtil.isRegularCharacter(fields.userName)) {
                    errMsg = res.__("validate_error_field", {
                        label: res.__("label_user_userName")
                    });
                }

                if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
                    errMsg = res.__("validate_rangelength", {
                        min: 6,
                        max: 12,
                        label: res.__("label_user_password")
                    })
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                const userObj = {
                    userName: fields.userName || fields.phoneNum,
                    countryCode: fields.countryCode,
                    logo: fields.logo,
                    phoneNum: fields.phoneNum,
                    email: fields.email,
                    group: '0',
                    creativeRight: false,
                    password: service.encrypt(fields.password, settings.encrypt_key),
                    loginActive: false,
                    enable: true
                }

                let queryUserObj = {};
                if (regType == '1') {

                    queryUserObj = {
                        $or: [{
                            phoneNum: fields.phoneNum
                        }, {
                            phoneNum: '0' + fields.phoneNum
                        }]
                    };

                    if (fields.phoneNum.indexOf('0') == '0') {
                        queryUserObj = {
                            $or: [{
                                phoneNum: fields.phoneNum
                            }, {
                                phoneNum: fields.phoneNum.substr(1)
                            }]
                        };
                    }

                } else if (regType == '2') {
                    queryUserObj = {
                        email: fields.email
                    }
                    userObj.userName = userObj.userName || fields.email;
                }

                let user = await UserModel.find(queryUserObj);

                if (!_.isEmpty(user)) {
                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_hadUse_userNameOrEmail")))
                } else {
                    let newUser = new UserModel(userObj);
                    let endUser = await newUser.save();
                    req.session.user = await UserModel.findOne({
                        _id: endUser._id
                    }, siteFunc.getAuthUserFields('session'));

                    let noticeConfig = siteFunc.getNoticeConfig('reg', fields.userName);
                    let notify = new NotifyModel(noticeConfig);
                    // 发系统消息管理员
                    let newNotify = await notify.save();
                    let users = await AdminUserModel.find({}, '_id');
                    if (users.length > 0) {
                        for (let i = 0; i < users.length; i++) {
                            let userNotify = new UserNotifyModel({
                                systemUser: users[i]._id,
                                notify: newNotify
                            });
                            await userNotify.save();
                        }
                    }

                    // 重置验证码
                    siteFunc.clearRedisByType(endStr, '_sendMessage_reg_');

                    let reSendData = siteFunc.renderApiData(req, res, 200, res.__("validate_user_regOk"));
                    res.send(reSendData);
                }
            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err))
            }

        })
    }

    async checkPhoneNumExist(req, res, next) {
        try {

            let phoneNum = req.query.phoneNum || '';
            let countryCode = req.query.countryCode || '';
            let errMsg = "";

            if (!phoneNum || !validatorUtil.checkPhoneNum((phoneNum).toString())) {
                errMsg = res.__("validate_inputCorrect", {
                    label: res.__("label_user_phoneNum")
                })
            }

            if (!validator.isNumeric(countryCode.toString())) {
                errMsg = res.__("validate_inputCorrect", {
                    label: res.__("label_user_countryCode")
                })
            }

            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            let queryUserObj = {
                $or: [{
                    phoneNum: phoneNum
                }, {
                    phoneNum: '0' + phoneNum
                }],
                countryCode: countryCode
            };

            if (phoneNum.indexOf('0') == '0') {
                queryUserObj = {
                    $or: [{
                        phoneNum: phoneNum
                    }, {
                        phoneNum: phoneNum.substr(1)
                    }],
                    countryCode: countryCode
                };
            }

            let targetUser = await UserModel.findOne(queryUserObj);
            let checkState = false;
            if (!_.isEmpty(targetUser)) {
                checkState = true;
            }

            res.send(siteFunc.renderApiData(req, res, 200, 'checkPhoneNumExist success', {
                checkState
            }, 'save'));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'save'));
        }
    }

    async checkHadSetLoginPassword(req, res, next) {

        try {

            let userInfo = req.session.user;
            let targetUser = await UserModel.findOne({
                _id: userInfo._id
            });
            let checkState = false;
            if (!_.isEmpty(targetUser) && targetUser.password) {
                checkState = true;
            }

            res.send(siteFunc.renderApiData(req, res, 200, 'checkHadSetLoginPassword success', {
                checkState
            }, 'save'));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'save'));
        }
    }


    async logOut(req, res, next) {
        req.session.destroy();
        res.clearCookie(settings.auth_cookie_name, {
            path: '/'
        });
        res.send(siteFunc.renderApiData(req, res, 200, res.__("validate_user_logoutOk")));
    }

    async sentConfirmEmail(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            let targetEmail = fields.email;
            // 获取当前发送邮件的时间
            let retrieveTime = new Date().getTime();
            if (!validator.isEmail(targetEmail)) {
                res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_params")))
            } else {
                try {
                    let user = await UserModel.findOne({
                        'email': targetEmail
                    });
                    if (!_.isEmpty(user) && user._id) {
                        await UserModel.findOneAndUpdate({
                            'email': targetEmail
                        }, {
                            $set: {
                                retrieve_time: retrieveTime
                            }
                        })
                        //发送通知邮件给用户
                        const systemConfigs = await SystemConfigModel.find({});
                        if (!_.isEmpty(systemConfigs)) {
                            service.sendEmail(req, res, systemConfigs[0], settings.email_findPsd, {
                                email: targetEmail,
                                userName: user.userName,
                                password: user.password
                            })
                            res.send(siteFunc.renderApiData(req, res, 200, res.__("label_resetpwd_sendEmail_success")));
                        }
                    } else {
                        res.send(siteFunc.renderApiErr(req, res, 500, res.__("label_resetpwd_noemail")))
                    }
                } catch (error) {
                    res.send(siteFunc.renderApiErr(req, res, 500, error))
                }

            }

        })
    }

    async reSetPass(req, res, next) {
        let params = req.query;
        let tokenId = params.key;
        let keyArr = service.getKeyArrByTokenId(tokenId);

        if (keyArr && validator.isEmail(keyArr[1])) {

            try {
                let defaultTemp = await ContentTemplateModel.findOne({
                    'using': true
                }).populate('items').exec();
                let noticeTempPath = settings.SYSTEMTEMPFORDER + defaultTemp.alias + '/users/userNotice.html';
                let reSetPwdTempPath = settings.SYSTEMTEMPFORDER + defaultTemp.alias + '/users/userResetPsd.html';

                let user = await UserModel.findOne({
                    'email': keyArr[1]
                });
                if (!_.isEmpty(user) && user._id) {

                    if (user.password == keyArr[0] && keyArr[2] == settings.session_secret) {
                        //  校验链接是否过期
                        let now = new Date().getTime();
                        let oneDay = 1000 * 60 * 60 * 24;
                        let localKeys = await siteFunc.getSiteLocalKeys(req.session.locale, res);
                        if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
                            let renderData = {
                                infoType: "warning",
                                infoContent: res.__("label_resetpwd_link_timeout"),
                                staticforder: defaultTemp.alias,
                                lk: localKeys.renderKeys
                            }
                            res.render(noticeTempPath, renderData);
                        } else {
                            let renderData = {
                                tokenId,
                                staticforder: defaultTemp.alias,
                                lk
                            };
                            res.render(reSetPwdTempPath, renderData);
                        }
                    } else {
                        let localKeys = await siteFunc.getSiteLocalKeys(req.session.locale, res);
                        res.render(noticeTempPath, {
                            infoType: "warning",
                            infoContent: res.__("label_resetpwd_error_message"),
                            staticforder: defaultTemp.alias,
                            lk: localKeys.renderKeys
                        });
                    }
                } else {
                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("label_resetpwd_noemail")))
                }
            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error))
            }
        } else {
            res.send(siteFunc.renderApiErr(req, res, 500, res.__("label_resetpwd_noemail")))
        }
    }

    // 根据手机验证码找回密码
    async resetMyPassword(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {

                let phoneNum = fields.phoneNum;
                let countryCode = fields.countryCode;
                let messageCode = fields.messageCode;
                let email = fields.email;
                let type = fields.type || '1';
                let errMsg = "";

                if (type != '1' && type != '2') {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }

                if (type == '1') {
                    if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
                        throw new siteFunc.UserException(res.__("validate_inputCorrect", {
                            label: res.__("label_user_phoneNum")
                        }));
                    }

                    if (!countryCode) {
                        errMsg = res.__("validate_selectNull", {
                            label: res.__("label_user_countryCode")
                        });
                    }

                } else if (type == '2') {
                    if (!validatorUtil.checkEmail(fields.email)) {
                        throw new siteFunc.UserException(res.__("validate_inputCorrect", {
                            label: res.__("label_user_email")
                        }));
                    }
                }

                let endStr = type == '1' ? (fields.countryCode + fields.phoneNum) : fields.email;
                // console.log('----', settings.session_secret + '_sendMessage_resetPassword_' + endStr)
                // let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_reg_' + endStr);
                let currentCode = await getCacheValueByKey(settings.session_secret + '_sendMessage_resetPassword_' + endStr);

                // console.log('-currentCode-----', currentCode)
                if (!validator.isNumeric((messageCode).toString()) || (messageCode).length != 6 || currentCode != fields.messageCode) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_imageCode")
                    })
                }

                if (!fields.password) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_password")
                    })
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                let queryUserObj = {
                    $or: [{
                        phoneNum: fields.phoneNum
                    }, {
                        phoneNum: '0' + fields.phoneNum
                    }],
                    countryCode: fields.countryCode
                };

                if (type == '1') {
                    if (fields.phoneNum.indexOf('0') == '0') {
                        queryUserObj = {
                            $or: [{
                                phoneNum: fields.phoneNum
                            }, {
                                phoneNum: fields.phoneNum.substr(1)
                            }],
                            countryCode: fields.countryCode
                        };
                    }
                } else if (type == '2') {
                    queryUserObj = {
                        email: fields.email
                    }
                }


                let targetUser = await UserModel.findOne(queryUserObj);

                if (!_.isEmpty(targetUser)) {

                    await UserModel.findOneAndUpdate({
                        _id: targetUser._id
                    }, {
                        $set: {
                            password: service.encrypt(fields.password, settings.encrypt_key)
                        }
                    });

                    // 重置验证码
                    siteFunc.clearRedisByType(endStr, '_sendMessage_resetPassword_');

                    res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                        label: res.__('lc_basic_set_password')
                    })));

                } else {
                    throw new siteFunc.UserException(res.__('label_resetpwd_error_message'));
                }


            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error))
            }
        })

    }


    // web 端找回密码
    async updateNewPsd(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            let errMsg = '';
            if (!fields.tokenId) {
                errMsg = 'token is null'
            }

            if (!fields.password) {
                errMsg = 'password is null'
            }

            if (fields.password != fields.confirmPassword) {
                errMsg = res.__("validate_error_pass_atypism")
            }

            if (errMsg) {
                res.send(siteFunc.renderApiErr(req, res, 500, errMsg))
            } else {
                var keyArr = service.getKeyArrByTokenId(fields.tokenId);
                if (keyArr && validator.isEmail(keyArr[1])) {
                    try {
                        let user = await UserModel.findOne({
                            'email': keyArr[1]
                        });
                        if (!_.isEmpty(user) && user._id) {
                            if (user.password == keyArr[0] && keyArr[2] == settings.session_secret) {
                                let currentPwd = service.encrypt(fields.password, settings.encrypt_key);
                                await UserModel.findOneAndUpdate({
                                    'email': keyArr[1]
                                }, {
                                    $set: {
                                        password: currentPwd,
                                        retrieve_time: ''
                                    }
                                });
                                res.send(siteFunc.renderApiData(req, res, 200, 'reset pwd success'));
                            } else {
                                res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_params")))
                            }
                        } else {
                            res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_params")))
                        }
                    } catch (error) {
                        res.send(siteFunc.renderApiErr(req, res, 500, error))
                    }
                } else {
                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_error_params")))
                }
            }
        })

    }

    // app 端修改密码
    async modifyMyPsd(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {

            try {
                await siteFunc.checkPostToken(req, res, fields.token);

                let errMsg = '';
                let userInfo = req.session.user || {};

                if (!fields.oldPassword) {
                    errMsg = 'oldPassword is null'
                }

                if (!fields.password) {
                    errMsg = 'password is null'
                }

                if (errMsg) {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                let targetUser = await UserModel.findOne({
                    _id: userInfo._id,
                    password: service.encrypt(fields.oldPassword, settings.encrypt_key)
                });

                if (!_.isEmpty(targetUser)) {

                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            password: service.encrypt(fields.password, settings.encrypt_key)
                        }
                    });

                    res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                        label: res.__('lc_basic_set_password')
                    })));

                } else {
                    throw new siteFunc.UserException(res.__('label_resetpwd_error_message'));
                }

            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error, 'modifyMyPsd'));
            }

        })

    }


    async postEmailToAdminUser(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let errMsg = "";
                if (fields.name && !validator.isLength(fields.name, 2, 16)) {
                    errMsg = res.__("validate_rangelength", {
                        min: 2,
                        max: 16,
                        label: res.__("label_name")
                    });
                }
                if (fields.phoneNum && !validatorUtil.checkPhoneNum(fields.phoneNum)) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_phoneNum")
                    });
                }
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = res.__("validate_inputCorrect", {
                        label: res.__("label_user_email")
                    });
                }
                if (fields.comments && !validator.isLength(fields.comments, 5, 1000)) {
                    errMsg = res.__("validate_rangelength", {
                        min: 5,
                        max: 1000,
                        label: res.__("label_comments")
                    });
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                } else {
                    const systemConfigs = await SystemConfigModel.find({});
                    service.sendEmail(req, res, systemConfigs[0], settings.email_notice_admin_byContactUs, {
                        email: fields.email,
                        name: fields.name,
                        phoneNum: fields.phoneNum,
                        comments: xss(fields.comments)
                    })
                    // 给用户发邮件
                    service.sendEmail(req, res, systemConfigs[0], settings.email_notice_user_byContactUs, {
                        email: fields.email,
                        name: fields.name,
                        phoneNum: fields.phoneNum,
                        comments: xss(fields.comments)
                    })
                    res.send(siteFunc.renderApiData(req, res, 200, res.__("lc_sendEmail_user_success_notice")));
                }
            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error))
            }

        })
    }

    // 关注标签
    async addTags(req, res) {

        try {

            let userInfo = await UserModel.findOne({
                _id: req.session.user
            }, 'watchTags');
            let tagId = req.query.tagId;
            let followState = req.query.type;
            if (!shortid.isValid(tagId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            let targetTag = await ContentTagModel.findOne({
                _id: tagId
            });
            if (_.isEmpty(targetTag)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            let oldWatchTag = userInfo.watchTags || [];
            let oldWatchTagArr = _.concat([], oldWatchTag);
            if (oldWatchTagArr.indexOf(tagId) >= 0 && followState == '1') {
                throw new siteFunc.UserException(res.__("validate_error_repost"));
            } else {
                if (followState == '1') {
                    oldWatchTagArr.push(tagId);
                } else if (followState == '0') {
                    oldWatchTagArr = _.filter(oldWatchTagArr, (item) => {
                        return item != tagId;
                    })
                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }
                oldWatchTagArr = _.uniq(oldWatchTagArr);
                // console.log('--userInfo._id----', userInfo._id);
                await UserModel.findOneAndUpdate({
                    _id: userInfo._id
                }, {
                    $set: {
                        watchTags: oldWatchTagArr
                    }
                });

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('lc_add')
                }), {}, 'addTags'))
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'addTags'));
        }

    }


    // 关注大师
    async followMaster(req, res) {

        try {
            // TODO 暂供测试用
            let userInfo = req.session.user;
            let userId = userInfo._id;
            let masterIds = req.query.masterId;
            let masterFollowState = req.query.followState;

            if (!masterIds) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            let masterIdArr = masterIds.split(',');
            let targetWatcher = await UserModel.findOne({
                _id: userId
            });
            for (const masterId of masterIdArr) {
                if (!shortid.isValid(masterId)) {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }

                if (masterId == userId) {
                    throw new siteFunc.UserException(res.__("user_action_tips_subscribe_self"));
                }
                // console.log('---masterId---', masterId);
                let targetMasterFollow = await UserModel.findOne({
                    _id: masterId
                });

                // console.log('---targetMasterFollow---', targetMasterFollow);
                if (_.isEmpty(targetMasterFollow)) {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }

                let userWatcherArr = _.concat([], targetWatcher.watchers);
                let masterFollowersArr = _.concat([], targetMasterFollow.followers);

                if (userWatcherArr.indexOf(userId) >= 0 && masterFollowState == 'in') {
                    throw new siteFunc.UserException(res.__("validate_error_repost"));
                } else {
                    if (masterFollowState == 'in') {
                        userWatcherArr.push(targetMasterFollow._id);
                        masterFollowersArr.push(userId);
                    } else if (masterFollowState == 'out') {
                        userWatcherArr = _.filter(userWatcherArr, (item) => {
                            return item != targetMasterFollow._id;
                        })
                        masterFollowersArr = _.filter(masterFollowersArr, (item) => {
                            return item != userId;
                        })
                    } else {
                        throw new siteFunc.UserException(res.__("validate_error_params"));
                    }
                    // 去重
                    userWatcherArr = _.uniq(userWatcherArr);
                    masterFollowersArr = _.uniq(masterFollowersArr);
                    // 记录本人主动关注
                    await UserModel.findOneAndUpdate({
                        _id: userId
                    }, {
                        $set: {
                            watchers: userWatcherArr
                        }
                    });
                    // 记录大师被关注
                    await UserModel.findOneAndUpdate({
                        _id: targetMasterFollow._id
                    }, {
                        $set: {
                            followers: masterFollowersArr
                        }
                    });

                    // 发送关注消息
                    if (masterFollowState == 'in') {
                        siteFunc.addSiteMessage('2', userInfo, targetMasterFollow._id);
                    }
                }

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__(masterFollowState === 'in' ? 'user_action_tips_add_master' : 'user_action_tips_unsubscribe_master')
                }), {}, 'followMaster'))
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'followMaster'));
        }

    }



    async sendVerificationCode(req, res) {

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {

            try {
                let phoneNum = fields.phoneNum;
                let email = fields.email;
                let countryCode = fields.countryCode;
                let messageType = fields.messageType;
                let sendType = fields.sendType || '1'; // 1: 短信验证码  2:邮箱验证码

                // 针对管理员
                let userName = fields.userName;
                let password = fields.password;

                let cacheKey = '',
                    errMsg = "";

                // 管理员登录
                if (messageType == '5') {

                    if (!userName || !password) {
                        throw new siteFunc.UserException(res.__('label_systemnotice_nopower'));
                    }

                    let targetAdminUser = await AdminUserModel.findOne({
                        userName,
                        password
                    })

                    if (!_.isEmpty(targetAdminUser)) {
                        phoneNum = targetAdminUser.phoneNum;
                        countryCode = targetAdminUser.countryCode;
                    } else {
                        throw new siteFunc.UserException(res.__('label_systemnotice_nopower'));
                    }

                } else {

                    if (sendType == '1') {
                        if (!phoneNum || !validator.isNumeric(phoneNum.toString())) {
                            errMsg = res.__("validate_inputCorrect", {
                                label: res.__("label_user_phoneNum")
                            });
                        }

                        if (!fields.countryCode) {
                            errMsg = res.__("validate_selectNull", {
                                label: res.__("label_user_countryCode")
                            });
                        }
                    } else if (sendType == '2') {
                        if (!validatorUtil.checkEmail(fields.email)) {
                            errMsg = res.__("validate_inputCorrect", {
                                label: res.__("label_user_email")
                            });
                        }
                    }

                }

                if (!messageType) {
                    errMsg = res.__("validate_error_params");
                }

                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }

                // 生成短信验证码
                let currentStr = siteFunc.randomString(6, '123456789');

                // console.log('---messageCode----', currentStr);

                if (messageType == '0') { // 注册验证码
                    cacheKey = '_sendMessage_reg_';
                } else if (messageType == '1') { // 登录获取验证码
                    cacheKey = '_sendMessage_login_';
                } else if (messageType == '2') { // 忘记资金密码获取验证码
                    cacheKey = '_sendMessage_reSetFunPassword_';
                } else if (messageType == '3') { // 忘记登录密码找回
                    cacheKey = '_sendMessage_resetPassword_';
                } else if (messageType == '4') { // 身份认证
                    cacheKey = '_sendMessage_identity_verification_';
                } else if (messageType == '5') { // 管理员登录
                    cacheKey = '_sendMessage_adminUser_login_';
                } else if (messageType == '6') { // 游客绑定邮箱或手机号
                    cacheKey = '_sendMessage_tourist_bindAccount_';
                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }

                let endStr = sendType == '1' ? (countryCode + phoneNum) : email;
                let currentKey = settings.session_secret + cacheKey + endStr;
                console.log(currentStr, '---currentKey---', currentKey)
                cache.set(currentKey, currentStr, 1000 * 60 * 10); // 验证码缓存10分钟

                // 验证码加密
                let renderCode = service.encryptApp(settings.encryptApp_key, settings.encryptApp_vi, currentStr);
                console.log('renderCode: ', renderCode);

                if (sendType == '1') {
                    // 发送短消息
                    (process.env.NODE_ENV == 'production') && siteFunc.sendTellMessagesByPhoneNum(countryCode, phoneNum, currentStr.toString());
                } else if (sendType == '2') {
                    //发送通知邮件给用户
                    const systemConfigs = await SystemConfigModel.find({});
                    if (!_.isEmpty(systemConfigs)) {
                        (process.env.NODE_ENV == 'production') && service.sendEmail(req, res, systemConfigs[0], settings.email_sendMessageCode, {
                            email: email,
                            renderCode: currentStr
                        })
                    } else {
                        throw new siteFunc.UserException(res.__('validate_error_params'));
                    }
                } else {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('user_action_tips_sendMessage')
                }), {
                    messageCode: renderCode
                }, 'save'));

            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error, 'sendVerificationCode'));

            }
        })

    }

    // 点赞/取消赞
    async askContentThumbsUp(req, res, next) {
        try {
            let userInfo = req.session.user;
            let userId = userInfo._id;
            let contentId = req.query.contentId;
            let praiseState = req.query.praiseState;
            if (!shortid.isValid(contentId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            let targetContent = await ContentModel.findOne({
                _id: contentId,
                state: '2'
            });
            let targetMessage = await MessageModel.findOne({
                _id: contentId
            });

            let targetMediaType = '0';

            if (!_.isEmpty(targetContent)) {
                targetMediaType = '0'; // 帖子
                if (targetContent.uAuthor == userId) {
                    throw new siteFunc.UserException(res.__("user_action_tips_praise_self"));
                }
            } else if (!_.isEmpty(targetMessage)) {
                targetMediaType = '1'; // 评论
                if (targetMessage.author == userId) {
                    throw new siteFunc.UserException(res.__("user_action_tips_praise_self"));
                }
            } else {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            let oldPraise = userInfo.praiseContents || [];
            if (targetMediaType == '1') {
                oldPraise = userInfo.praiseMessages || [];
            } else if (targetMediaType == '2') {
                oldPraise = userInfo.praiseCommunityContent || [];
            } else if (targetMediaType == '3') {
                oldPraise = userInfo.praiseCommunityMessage || [];
            }

            let oldPraiseArr = _.concat([], oldPraise);
            if (oldPraiseArr.indexOf(contentId) >= 0 && praiseState == 'in') {
                throw new siteFunc.UserException(res.__("user_action_tips_repeat", {
                    label: res.__('user_action_type_give_thumbs_up')
                }));
            } else {
                if (praiseState == 'in') {
                    oldPraiseArr.push(contentId);
                } else if (praiseState == 'out') {
                    oldPraiseArr = _.filter(oldPraise, (item) => {
                        return item != contentId;
                    })
                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }
                oldPraiseArr = _.uniq(oldPraiseArr);

                if (targetMediaType == '0') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            praiseContents: oldPraiseArr
                        }
                    });
                } else if (targetMediaType == '1') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            praiseMessages: oldPraiseArr
                        }
                    });
                } else if (targetMediaType == '2') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            praiseCommunityContent: oldPraiseArr
                        }
                    });
                } else if (targetMediaType == '3') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            praiseCommunityMessage: oldPraiseArr
                        }
                    });
                }

                if (praiseState == 'in') {
                    // 发送提醒消息
                    if (targetMediaType == '0') {
                        siteFunc.addSiteMessage('4', userInfo, targetContent.uAuthor, contentId, {
                            targetMediaType
                        });
                    } else if (targetMediaType == '1') {
                        siteFunc.addSiteMessage('4', userInfo, targetMessage.author, contentId, {
                            targetMediaType
                        });
                    }

                }

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('user_action_type_give_thumbs_up')
                }), {}, 'addPraise'))
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'addPraise'));
        }

    }

    // 收藏帖子
    async favoriteContent(req, res, next) {
        try {
            let userInfo = await UserModel.findOne({
                _id: req.session.user
            }, siteFunc.getAuthUserFields('session'));
            let userId = userInfo._id;
            let contentId = req.query.contentId;
            let favoriteState = req.query.favoriteState;
            if (!shortid.isValid(contentId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            let targetContent = await ContentModel.findOne({
                _id: contentId,
                state: '2'
            });

            let targetContentType = '0';
            if (!_.isEmpty(targetContent)) {
                targetContentType = '0'; // 普通帖子
            } else {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            let oldFavorite = userInfo.favorites || [];
            if (targetContentType == '2') {
                oldFavorite = userInfo.favoriteCommunityContent || [];
            }
            let oldFavoriteArr = _.concat([], oldFavorite);
            if (oldFavoriteArr.indexOf(contentId) >= 0 && favoriteState == 'in') {
                throw new siteFunc.UserException(res.__("user_action_tips_repeat", {
                    label: res.__('user_action_type_give_favorite')
                }));
            } else {
                if (favoriteState == 'in') {
                    oldFavoriteArr.push(contentId);
                } else if (favoriteState == 'out') {
                    oldFavoriteArr = _.filter(oldFavorite, (item) => {
                        return item != contentId;
                    })
                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }
                oldFavoriteArr = _.uniq(oldFavoriteArr);
                if (targetContentType == '0') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            favorites: oldFavoriteArr
                        }
                    });
                } else if (targetContentType == '2') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            favoriteCommunityContent: oldFavoriteArr
                        }
                    });
                }

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('user_action_type_give_favorite')
                }), {}, 'addFavorite'))
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'addFavorite'));
        }
    }

    // 帖子踩
    async despiseContent(req, res, next) {
        try {
            let userInfo = req.session.user;
            let contentId = req.query.contentId;
            let despiseState = req.query.despiseState;
            if (!shortid.isValid(contentId)) {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }
            let targetContent = await ContentModel.findOne({
                _id: contentId,
                state: '2'
            });
            let targetMessage = await MessageModel.findOne({
                _id: contentId
            });

            let targetMediaType = '0';

            if (!_.isEmpty(targetContent)) {
                targetMediaType = '0'; // 帖子
            } else if (!_.isEmpty(targetMessage)) {
                targetMediaType = '1'; // 评论
            } else {
                throw new siteFunc.UserException(res.__("validate_error_params"));
            }

            // console.log('--userInfo-1---',req.session.user);
            let oldDespise = userInfo.despises || [];
            if (targetMediaType == '1') {
                oldDespise = userInfo.despiseMessage || [];
            } else if (targetMediaType == '2') {
                oldDespise = userInfo.despiseCommunityContent || [];
            } else if (targetMediaType == '3') {
                oldDespise = userInfo.despiseCommunityMessage || [];
            }

            let oldDespiseArr = _.concat([], oldDespise);

            // console.log('--oldDespiseArr----', oldDespiseArr);

            if (oldDespiseArr.indexOf(contentId) >= 0 && despiseState == 'in') {
                throw new siteFunc.UserException(res.__("user_action_tips_repeat", {
                    label: res.__('user_action_type_give_despise')
                }));
            } else {
                if (despiseState == 'in') {
                    oldDespiseArr.push(contentId);
                } else if (despiseState == 'out') {
                    oldDespiseArr = _.filter(oldDespise, (item) => {
                        return item != contentId;
                    })
                } else {
                    throw new siteFunc.UserException(res.__("validate_error_params"));
                }
                oldDespiseArr = _.uniq(oldDespiseArr);

                if (targetMediaType == '0') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            despises: oldDespiseArr
                        }
                    });
                } else if (targetMediaType == '1') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            despiseMessage: oldDespiseArr
                        }
                    });
                } else if (targetMediaType == '2') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            despiseCommunityContent: oldDespiseArr
                        }
                    });
                } else if (targetMediaType == '3') {
                    await UserModel.findOneAndUpdate({
                        _id: userInfo._id
                    }, {
                        $set: {
                            despiseCommunityMessage: oldDespiseArr
                        }
                    });
                }

                res.send(siteFunc.renderApiData(req, res, 200, res.__('restful_api_response_success', {
                    label: res.__('user_action_type_give_despise')
                }), {}, 'addDespise'))
            }
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'addDespise'));
        }
    }

    async makeWallets(req, res) {
        try {
            siteFunc.getWallets(req.query.num);
            res.send(siteFunc.renderApiData(req, res, 200, 'makeWallets', {}));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'makeWallets'));
        }
    }

}

module.exports = new User();