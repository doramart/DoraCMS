const BaseComponent = require('../prototype/baseComponent');
const AdminUserModel = require("../models").AdminUser;
const UserModel = require("../models").User;
const ContentModel = require("../models").Content;
const SystemOptionLogModel = require("../models").SystemOptionLog;
const UserNotifyModel = require("../models").UserNotify;
const MessageModel = require("../models").Message;
const formidable = require('formidable');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validatorUtil.checkUserName(fields.userName)) {
        errMsg = '5-12个英文字符!';
    }
    if (!validatorUtil.checkName(fields.name)) {
        errMsg = '2-6个中文字符!';
    }
    if (!validatorUtil.checkPwd(fields.password)) {
        errMsg = '6-12位，只能包含字母、数字和下划线!';
    }
    if (fields.password !== fields.confirmPassword) {
        errMsg = '两次输入密码不一致!';
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
        res.send({
            state: 'error',
            type: 'ERROR_PARAMS',
            message: errMsg
        })
    }
}

class AdminUser {
    constructor() {
        // super()
    }

    async getUserSession(req, res, next) {
        try {
            let noticeCounts = await UserNotifyModel.count({ 'systemUser': req.session.adminUserInfo._id, 'isRead': false });
            res.send({
                state: 'success',
                noticeCounts,
                loginState: req.session.adminlogined,
                userInfo: req.session.adminUserInfo
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取session失败' + err
            })
        }
    }

    async getBasicSiteInfo(req, res, next) {
        try {
            let adminUserCount = await AdminUserModel.count();
            let regUserCount = await UserModel.count();
            let contentCount = await ContentModel.count();
            let messageCount = await MessageModel.count();
            res.send({
                state: 'success',
                adminUserCount,
                regUserCount,
                contentCount,
                messageCount
            });
        } catch (error) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取系统基础数据失败'
            })
        }
    }

    async getAdminUsers(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            const adminUsers = await AdminUserModel.find({}, { password: 0 }).sort({
                date: -1
            }).skip(10 * (Number(current) - 1)).limit(Number(pageSize)).populate({
                path: 'group',
                select: "name _id"
            }).exec();
            const totalItems = await AdminUserModel.count();
            res.send({
                state: 'success',
                docs: adminUsers,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            })
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取adminUsers失败'
            })
        }
    }

    async loginAction(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            let {
                userName,
                password
            } = fields;
            try {
                let newPsd = service.encrypt(fields.password, settings.encrypt_key);
                let errMsg = '';
                if (!validatorUtil.checkUserName(fields.userName)) {
                    errMsg = '请输入正确的用户名'
                } else if (!validatorUtil.checkPwd(fields.password)) {
                    errMsg = '请输入正确的密码'
                }
                if (errMsg) {
                    res.send({
                        state: 'error',
                        type: 'ERROR_PARAMS',
                        message: errMsg
                    })
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
                password: service.encrypt(fields.password, settings.encrypt_key)
            }
            try {
                let user = await AdminUserModel.findOne(userObj).populate([{
                    path: 'group',
                    select: 'power _id enable'
                }]).exec();
                if (user) {
                    if (!user.enable) {
                        res.send({
                            state: 'error',
                            message: "该用户已被限制登录，请稍后重试"
                        });
                    }
                    req.session.adminPower = user.group.power;
                    req.session.adminlogined = true;
                    req.session.adminUserInfo = user;

                    // 记录登录日志
                    let clientIp = req.headers['x-forwarded-for'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress;
                    let loginLog = new SystemOptionLogModel();
                    loginLog.type = 'login';
                    loginLog.logs = req.session.adminUserInfo.userName + ' 登录，IP:' + clientIp;
                    await loginLog.save();

                    res.send({
                        state: 'success',
                        adminPower: req.session.adminPower
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
                    message: err.message
                })
            }
        })
    }

    async addAdminUser(req, res, next) {
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
                name: fields.name,
                email: fields.email,
                phoneNum: fields.phoneNum,
                password: service.encrypt(fields.password, settings.encrypt_key),
                confirm: fields.confirm,
                group: fields.group,
                enable: fields.enable,
                comments: fields.comments
            }

            const newAdminUser = new AdminUserModel(userObj);
            try {
                await newAdminUser.save();
                res.send({
                    state: 'success',
                    id: newAdminUser._id
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '保存数据失败:',
                })
            }
        })
    }

    async updateAdminUser(req, res, next) {
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
                name: fields.name,
                email: fields.email,
                phoneNum: fields.phoneNum,
                password: service.encrypt(fields.password, settings.encrypt_key),
                confirm: fields.confirm,
                group: fields.group,
                enable: fields.enable,
                comments: fields.comments
            }
            const item_id = fields._id;
            try {
                await AdminUserModel.findOneAndUpdate({
                    _id: item_id
                }, {
                        $set: userObj
                    });
                res.send({
                    state: 'success'
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '更新数据失败:',
                })
            }
        })

    }

    async delAdminUser(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                res.send({
                    state: 'error',
                    message: errMsg,
                })
            }
            let adminUserMsg = await MessageModel.find({ 'adminAuthor': req.query.ids });
            if (!_.isEmpty(adminUserMsg)) {
                res.send({
                    state: 'error',
                    message: '请删除该管理员留言后在执行该操作！',
                })
            }
            await AdminUserModel.remove({
                _id: req.query.ids
            });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:' + err,
            })
        }
    }

}

module.exports = new AdminUser();