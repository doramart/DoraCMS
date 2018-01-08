const BaseComponent = require('../prototype/baseComponent');
const UserModel = require("../models").User;
const MessageModel = require("../models").Message;
const NotifyModel = require("../models").Notify;
const UserNotifyModel = require("../models").UserNotify;
const AdminUserModel = require("../models").AdminUser;
const SystemConfigModel = require("../models").SystemConfig;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator');
const _ = require('lodash')
const fs = require('fs')
const captcha = require('trek-captcha')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validatorUtil.checkUserName(fields.userName)) {
        errMsg = '5-12个英文字符!';
    }
    if (fields.name && !validatorUtil.checkName(fields.name)) {
        errMsg = '2-6个中文字符!';
    }
    if (fields.phoneNum && !validatorUtil.checkPhoneNum(fields.phoneNum)) {
        errMsg = '请填写正确的手机号码!';
    }
    if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = '请填写正确的邮箱!';
    }
    if (!validator.isLength(fields.comments, 5, 30)) {
        errMsg = '请输入5-30个字符!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class User {
    constructor() {
        // super()
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
            res.send({
                state: 'success',
                docs: Users,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            })
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取User失败'
            })
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
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }

            const userObj = {
                userName: fields.userName,
                name: fields.name || '',
                email: fields.email,
                logo: fields.logo,
                phoneNum: fields.phoneNum || '',
                confirm: fields.confirm,
                group: fields.group
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
                res.send({
                    state: 'success'
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '更新数据失败:' + err,
                })
            }
        })

    }

    async delUser(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = '非法请求，请稍后重试！';
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            for (let i = 0; i < targetIds.length; i++) {
                let regUserMsg = await MessageModel.find({ 'author': targetIds[i] });
                if (!_.isEmpty(regUserMsg)) {
                    res.send({
                        state: 'error',
                        message: '请删除该用户留言后在执行该操作！',
                    })
                    break;
                }
            }
            await UserModel.remove({ '_id': { $in: targetIds } });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:',
            })
        }
    }

    async loginAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let newPsd = service.encrypt(fields.password, settings.encrypt_key);
                let errMsg = '';
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = '请输入正确的邮箱'
                } else if (!validatorUtil.checkPwd(fields.password)) {
                    errMsg = '请输入正确的密码'
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
            } catch (err) {
                console.log(err.message, err);
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return;
            }
            const userObj = {
                email: fields.email,
                password: service.encrypt(fields.password, settings.encrypt_key),
            }
            try {
                let user = await UserModel.findOne(userObj);
                if (user) {
                    if (!user.enable) {
                        res.send({
                            state: 'error',
                            message: "您已被限制登录，请稍后重试"
                        });
                    }
                    // 将cookie存入缓存
                    let auth_token = user._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
                    res.cookie(settings.auth_cookie_name, auth_token,
                        { path: '/', maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, httpOnly: true }); //cookie 有效期30天

                    res.send({
                        state: 'success'
                    });
                } else {
                    logUtil.error(err, req);
                    res.send({
                        state: 'error',
                        message: "用户名或密码错误"
                    });
                }
            } catch (err) {
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: err.stack
                })
            }

        })
    }

    async regAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                let newPsd = service.encrypt(fields.password, settings.encrypt_key);
                let errMsg = '';

                if (!validatorUtil.checkUserName(fields.userName)) {
                    errMsg = '5-12个英文字符!';
                }
                if (!validatorUtil.checkEmail(fields.email)) {
                    errMsg = '请输入正确的邮箱'
                }
                if (!validatorUtil.checkPwd(fields.password)) {
                    errMsg = '请输入正确的密码'
                }
                if (fields.password != fields.confirmPassword) {
                    errMsg = '两次输入密码不一致，请重新输入'
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
            } catch (err) {
                console.log(err.message, err);
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return;
            }
            const userObj = {
                userName: fields.userName,
                email: fields.email,
                password: service.encrypt(fields.password, settings.encrypt_key),
            }
            try {
                let user = await UserModel.find().or([{ 'email': fields.email }, { userName: fields.userName }])
                if (!_.isEmpty(user)) {
                    res.send({
                        state: 'error',
                        message: '邮箱或用户名已存在！'
                    });
                } else {
                    let newUser = new UserModel(userObj);
                    await newUser.save();

                    //发送通知邮件给用户
                    const systemConfigs = await SystemConfigModel.find({});
                    if (!_.isEmpty(systemConfigs)) {
                        service.sendEmail(req, systemConfigs[0], settings.email_notice_user_reg, {
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

                    res.send({
                        state: 'success',
                        message: "注册成功！"
                    });
                }
            } catch (err) {
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: err.stack
                })
            }

        })
    }

    async logOut(req, res, next) {
        req.session.destroy();
        res.clearCookie(settings.auth_cookie_name, { path: '/' });
        res.send({
            state: 'success',
        })
    }

}

module.exports = new User();