const BaseComponent = require('../prototype/baseComponent');
const UserModel = require("../models").User;
const MessageModel = require("../models").Message;
const NotifyModel = require("../models").Notify;
const UserNotifyModel = require("../models").UserNotify;
const AdminUserModel = require("../models").AdminUser;
const SystemConfigModel = require("../models").SystemConfig;
const ContentTemplateModel = require("../models").ContentTemplate;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const settings = require('../../../configs/settings');
const shortid = require('shortid');
const validator = require('validator');
const _ = require('lodash')
const fs = require('fs')
const captcha = require('trek-captcha')
const xss = require("xss");

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validatorUtil.checkUserName(fields.userName)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 12, label: res.__("label_user_userName") });
    }
    if (fields.name && !validatorUtil.checkName(fields.name)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 6, label: res.__("label_name") });
    }
    if (fields.phoneNum && !validatorUtil.checkPhoneNum(fields.phoneNum)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_phoneNum") });
    }
    if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_email") });
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 30)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 30, label: res.__("label_comments") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

function renderLocalKey(res, renderData, locals) {
    if (locals && locals.length > 0) {
        for (let i = 0; i < locals.length; i++) {
            let lockey = locals[i];
            renderData[lockey] = res.__(lockey);
        }
    }
    return renderData;
}

class User {
    constructor() {
        // super()
    }

    async updateUserComments(req, res) {

        try {
            const users = await UserModel.find({});
            if (!_.isEmpty(users)) {
                for (let i = 0; i < users.length; i++) {
                    let targetUser = users[i];
                    await UserModel.findOneAndUpdate({ _id: targetUser._id }, { $set: { comments: " " } })
                }
            }
            res.send(siteFunc.renderApiData(res, 200, 'user', {}, 'update'));

        } catch (error) {
            res.send(siteFunc.renderApiErr(req, res, 500, error, 'update'));
        }


    }

    async getImgCode(req, res) {
        const { token, buffer } = await captcha();
        req.session.imageCode = token;
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.write(buffer);
        res.end();
    }

    async getUsers(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let searchkey = req.query.searchkey, queryObj = {};

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.userName = { $regex: reKey }
            }

            const Users = await UserModel.find(queryObj, { password: 0 }).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize));
            const totalItems = await UserModel.count(queryObj);
            let renderData = {
                docs: Users,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            }
            res.send(siteFunc.renderApiData(res, 200, 'user', renderData, 'getlist'));
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async getOneUserByParams(req, res, params) {
        return await UserModel.findOne(params, { password: 0 });
    }

    async updateUser(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const userObj = {};
            if (fields.userName) {
                userObj.userName = fields.userName;
            }
            if (fields.name) {
                userObj.name = fields.name;
            }
            if (fields.email) {
                userObj.email = fields.email;
            }
            if (fields.logo) {
                userObj.logo = fields.logo;
            }
            if (fields.phoneNum) {
                userObj.phoneNum = fields.phoneNum;
            }
            if (fields.confirm) {
                userObj.confirm = fields.confirm;
            }
            if (fields.group) {
                userObj.group = fields.group;
            }
            if (fields.password) {
                userObj.password = service.encrypt(fields.password, settings.encrypt_key);
            }
            const item_id = fields._id;

            try {
                await UserModel.findOneAndUpdate({ _id: item_id }, { $set: userObj });
                // 更新缓存
                delete userObj.password;
                req.session.user = _.assign(req.session.user, userObj)

                let uData = siteFunc.renderApiData(res, 200, 'update user')
                res.send(uData);
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delUser(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            for (let i = 0; i < targetIds.length; i++) {
                let regUserMsg = await MessageModel.find({ 'author': targetIds[i] });
                if (!_.isEmpty(regUserMsg)) {

                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_del_adminUser_notice"), 'delete'));

                    return;
                }
            }
            await UserModel.remove({ '_id': { $in: targetIds } });
            res.send(siteFunc.renderApiData(res, 200, 'user', {}, 'delete'));

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    async loginAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let newPsd = service.encrypt(fields.password, settings.encrypt_key);
                let errMsg = '';
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_email") })
                } else if (!validatorUtil.checkPwd(fields.password)) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_password") })
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }
            const userObj = {
                email: fields.email,
                password: service.encrypt(fields.password, settings.encrypt_key),
            }
            try {
                let user = await UserModel.findOne(userObj);
                if (user) {
                    if (!user.enable) {
                        res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_user_forbiden")))
                    }
                    // 将cookie存入缓存
                    let auth_token = user._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
                    res.cookie(settings.auth_cookie_name, auth_token,
                        { path: '/', maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, httpOnly: true }); //cookie 有效期30天
                    let renderUser = JSON.parse(JSON.stringify(user));
                    delete renderUser.password;
                    let reSendData = siteFunc.renderApiData(res, 200, res.__("validate_user_loginOk"), renderUser);
                    res.send(reSendData);
                } else {

                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_login_notSuccess")))
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
                let from = fields.from;
                let newPsd = service.encrypt(fields.password, settings.encrypt_key);
                let errMsg = '';
                // app过来的注册暂时不校验用户名
                if (from != 'app' && !validatorUtil.checkUserName(fields.userName)) {
                    errMsg = res.__("validate_rangelength", { min: 2, max: 5, label: res.__("label_user_userName") });
                }
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_email") })
                }
                if (!validatorUtil.checkPwd(fields.password, 6, 12)) {
                    errMsg = res.__("validate_rangelength", { min: 6, max: 12, label: res.__("label_user_password") })
                }
                if (fields.password != fields.confirmPassword) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_password") })
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err.message))
                return;
            }
            const userObj = {
                userName: fields.userName,
                email: fields.email,
                password: service.encrypt(fields.password, settings.encrypt_key),
            }
            try {
                let user;
                if (fields.from == 'app') {
                    user = await UserModel.find({ 'email': fields.email })
                } else {
                    user = await UserModel.find().or([{ 'email': fields.email }, { userName: fields.userName }])
                }

                if (!_.isEmpty(user)) {
                    res.send(siteFunc.renderApiErr(req, res, 500, res.__("validate_hadUse_userNameOrEmail")))
                } else {
                    let newUser = new UserModel(userObj);
                    await newUser.save();
                    //发送通知邮件给用户
                    const systemConfigs = await SystemConfigModel.find({});
                    if (!_.isEmpty(systemConfigs)) {
                        service.sendEmail(req, res, systemConfigs[0], settings.email_notice_user_reg, {
                            email: fields.email,
                            userName: fields.userName
                        })
                    }

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
                    let reSendData = siteFunc.renderApiData(res, 200, res.__("validate_user_regOk"));
                    res.send(reSendData);
                }
            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err))
            }

        })
    }

    async logOut(req, res, next) {
        req.session.destroy();
        res.clearCookie(settings.auth_cookie_name, { path: '/' });
        res.send(siteFunc.renderApiData(res, 200, res.__("validate_user_logoutOk")));
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
                    let user = await UserModel.findOne({ 'email': targetEmail });
                    if (!_.isEmpty(user) && user._id) {
                        await UserModel.findOneAndUpdate({ 'email': targetEmail }, { $set: { retrieve_time: retrieveTime } })
                        //发送通知邮件给用户
                        const systemConfigs = await SystemConfigModel.find({});
                        if (!_.isEmpty(systemConfigs)) {
                            service.sendEmail(req, res, systemConfigs[0], settings.email_findPsd, {
                                email: targetEmail,
                                userName: user.userName,
                                password: user.password
                            })
                            res.send(siteFunc.renderApiData(res, 200, res.__("label_resetpwd_sendEmail_success")));
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
                let defaultTemp = await ContentTemplateModel.findOne({ 'using': true }).populate('items').exec();
                let noticeTempPath = settings.SYSTEMTEMPFORDER + defaultTemp.alias + '/users/userNotice.html';
                let reSetPwdTempPath = settings.SYSTEMTEMPFORDER + defaultTemp.alias + '/users/userResetPsd.html';

                let user = await UserModel.findOne({ 'email': keyArr[1] });
                if (!_.isEmpty(user) && user._id) {
                    // console.log('----keyArr---', keyArr);
                    if (user.password == keyArr[0] && keyArr[2] == settings.session_secret) {
                        //  校验链接是否过期
                        let now = new Date().getTime();
                        let oneDay = 1000 * 60 * 60 * 24;
                        let localKeys = await siteFunc.getSiteLocalKeys(res);
                        if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
                            let renderData = {
                                infoType: "warning",
                                infoContent: res.__("label_resetpwd_link_timeout"),
                                staticforder: defaultTemp.alias,
                                lk: localKeys.renderKeys
                            }
                            res.render(noticeTempPath, renderData);
                        } else {
                            let renderData = { tokenId, staticforder: defaultTemp.alias, lk };
                            res.render(reSetPwdTempPath, renderData);
                        }
                    } else {
                        let localKeys = await siteFunc.getSiteLocalKeys(res);
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
                        let user = await UserModel.findOne({ 'email': keyArr[1] });
                        if (!_.isEmpty(user) && user._id) {
                            if (user.password == keyArr[0] && keyArr[2] == settings.session_secret) {
                                let currentPwd = service.encrypt(fields.password, settings.encrypt_key);
                                await UserModel.findOneAndUpdate({ 'email': keyArr[1] }, { $set: { password: currentPwd, retrieve_time: '' } });
                                res.send(siteFunc.renderApiData(res, 200, 'reset pwd success'));
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


    async postEmailToAdminUser(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let errMsg = "";
                if (fields.name && !validator.isLength(fields.name, 2, 16)) {
                    errMsg = res.__("validate_rangelength", { min: 2, max: 16, label: res.__("label_name") });
                }
                if (fields.phoneNum && !validatorUtil.checkPhoneNum(fields.phoneNum)) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_phoneNum") });
                }
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_email") });
                }
                if (fields.comments && !validator.isLength(fields.comments, 5, 1000)) {
                    errMsg = res.__("validate_rangelength", { min: 5, max: 1000, label: res.__("label_comments") });
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
                    res.send(siteFunc.renderApiData(res, 200, res.__("lc_sendEmail_user_success_notice")));
                }
            } catch (error) {
                res.send(siteFunc.renderApiErr(req, res, 500, error))
            }

        })
    }
}

module.exports = new User();