const BaseComponent = require('../prototype/baseComponent');
const AdminUserModel = require("../models").AdminUser;
const AdminResourceModel = require("../models").AdminResource;
const UserModel = require("../models").User;
const ContentModel = require("../models").Content;
const SystemConfigModel = require("../models").SystemConfig;
const SystemOptionLogModel = require("../models").SystemOptionLog;
const UserNotifyModel = require("../models").UserNotify;
const MessageModel = require("../models").Message;
const formidable = require('formidable');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const axios = require('axios');
const pkgInfo = require('../../../package.json')
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
    // if (!validatorUtil.checkPwd(fields.password)) {
    //     errMsg = '6-12位，只能包含字母、数字和下划线!';
    // }
    if (fields.password !== fields.confirmPassword) {
        errMsg = '两次输入密码不一致!';
    }
    if (fields.phoneNum && !validatorUtil.checkPhoneNum(fields.phoneNum)) {
        errMsg = '请填写正确的手机号码!';
    }
    if (!validatorUtil.checkEmail(fields.email)) {
        errMsg = '请填写正确的邮箱!';
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 30)) {
        errMsg = '请输入5-30个字符!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
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
            let regUsers = await UserModel.find({}, { password: 0, email: 0 }).limit(20).sort({ date: -1 });
            let contentCount = await ContentModel.count();
            let messageCount = await MessageModel.count();
            let logQuery = { type: 'login' };
            let reKey = new RegExp(req.session.adminUserInfo.userName, 'i')
            logQuery.logs = { $regex: reKey }
            let loginLogs = await SystemOptionLogModel.find(logQuery).sort({ date: -1 }).skip(1).limit(1);
            let messages = await MessageModel.find().limit(10).sort({ date: -1 }).populate([{
                path: 'contentId',
                select: 'stitle _id'
            }, {
                path: 'author',
                select: 'userName _id enable date logo'
            }, {
                path: 'replyAuthor',
                select: 'userName _id enable date logo'
            }, {
                path: 'adminAuthor',
                select: 'userName _id enable date logo'
            }, {
                path: 'adminReplyAuthor',
                select: 'userName _id enable date logo'
            }]).exec();
            // 权限标记
            let fullResources = await AdminResourceModel.find();
            let newResources = [];
            for (let i = 0; i < fullResources.length; i++) {
                let resourceObj = JSON.parse(JSON.stringify(fullResources[i]));
                if (resourceObj.type == '1' && !_.isEmpty(req.session.adminUserInfo)) {
                    let adminPower = req.session.adminUserInfo.group.power;
                    if (adminPower && adminPower.indexOf(resourceObj._id) > -1) {
                        resourceObj.hasPower = true;
                    } else {
                        resourceObj.hasPower = false;
                    }
                    newResources.push(resourceObj);
                } else {
                    newResources.push(resourceObj);
                }
            }
            res.send({
                state: 'success',
                adminUserCount,
                regUserCount,
                regUsers,
                contentCount,
                messageCount,
                messages,
                loginLogs,
                resources: newResources
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
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate({
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
                let errMsg = '';
                if (!validatorUtil.checkUserName(fields.userName)) {
                    errMsg = '请输入正确的用户名'
                }

                if (!fields.imageCode || fields.imageCode != req.session.imageCode) {
                    errMsg = '请输入正确的验证码'
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
                password: fields.password
            }
            try {
                let user = await AdminUserModel.findOne(userObj).populate([{
                    path: 'group',
                    select: 'power _id enable name'
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

                    // 站点认证
                    if (validatorUtil.checkUrl(req.headers.host) && !req.session.adminUserInfo.auth) {
                        const systemConfigs = await SystemConfigModel.find({});
                        const { siteName, siteEmail, siteDomain } = systemConfigs[0];
                        let authParams = {
                            domain: req.headers.host,
                            ipAddress: clientIp,
                            version: pkgInfo.version,
                            siteName,
                            siteEmail,
                            siteDomain
                        };
                        try {
                            let writeState = await axios.post(settings.DORACMSAPI + '/system/checkSystemInfo', authParams);
                            if (writeState.status == 200 && writeState.data == 'success') {
                                await AdminUserModel.update({ '_id': req.session.adminUserInfo._id }, { $set: { auth: true } })
                            }
                        } catch (authError) {
                            res.send({
                                state: 'success',
                                adminPower: req.session.adminPower
                            });
                        }
                    }

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
                password: fields.password,
                confirm: fields.confirm,
                group: fields.group,
                enable: fields.enable,
                comments: fields.comments
            }

            try {
                let user = await AdminUserModel.find().or([{ userName: fields.userName }])
                if (!_.isEmpty(user)) {
                    res.send({
                        state: 'error',
                        message: '用户名已存在！'
                    });
                } else {
                    const newAdminUser = new AdminUserModel(userObj);
                    await newAdminUser.save();
                    res.send({
                        state: 'success',
                        id: newAdminUser._id
                    });
                }
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
                password: fields.password,
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
                throw new siteFunc.UserException(errMsg);
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
                message: '删除数据失败:' + err.message,
            })
        }
    }

}

module.exports = new AdminUser();