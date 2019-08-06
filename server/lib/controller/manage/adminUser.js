/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-31 13:44:55
 */


const {
    adminUserService,
    messageService,
    adminResourceService,
    contentService,
    userService,
    systemOptionLogService,
    systemConfigService,
    userNotifyService
} = require('@service');

const jwt = require('jsonwebtoken')
const {
    validateForm
} = require('../validate/index');
const {
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let adminUserList = await adminUserService.find(payload, {
            query: {
                state: '1'
            },
            populate: [{
                path: 'group',
                select: "name _id"
            }],
            files: {
                password: 0
            }
        });

        renderSuccess(req, res, {
            data: adminUserList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.loginAction = async (req, res, next) => {


    try {
        let fields = req.body || {};
        const systemConfigs = await systemConfigService.find({
            isPaging: '0'
        });
        const {
            siteName,
            siteEmail,
            siteDomain,
            showImgCode
        } = systemConfigs[0];

        let errMsg = '';

        if (showImgCode && (!fields.imageCode || fields.imageCode != req.session.imageCode)) {
            errMsg = res.__("validate_inputCorrect", {
                label: res.__("label_user_imageCode")
            })
        }

        if (errMsg) {
            throw new Error(errMsg);
        }

        const formObj = {
            userName: fields.userName,
            password: fields.password
        }

        let errInfo = validateForm(res, 'adminUserLogin', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let user = await adminUserService.item(res, {
            query: userObj,
            populate: [{
                path: 'group',
                select: 'power _id enable name'
            }]
        })

        if (user) {
            if (!user.enable) {
                throw new Error(res.__("validate_user_forbiden"));
            }

            let adminUserToken = jwt.sign({
                userName: user.userName,
                password: user.password
            }, settings.encrypt_key, {
                expiresIn: '30day'
            });

            res.cookie('admin_' + settings.auth_cookie_name, adminUserToken, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 30,
                signed: true,
                httpOnly: false
            }); //cookie 有效期30天

            // 记录登录日志
            let clientIp = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            let loginLog = {
                type: 'login',
                logs: req.session.adminUserInfo.userName + ' 登录，IP:' + clientIp,
            };
            await systemOptionLogService.create(loginLog);

            renderSuccess(req, res, {
                data: {
                    adminPower: req.session.adminPower
                }
            });

        } else {
            renderFail(req, res, {
                message: res.__("validate_login_notSuccess")
            });
        }

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}



exports.create = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
            userName: fields.userName,
            name: fields.name,
            email: fields.email,
            phoneNum: fields.phoneNum,
            countryCode: fields.countryCode,
            password: fields.password,
            confirm: fields.confirm,
            group: fields.group,
            enable: fields.enable,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'adminUser', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let oldItem = adminUserService.item(res, {
            query: {
                userName: fields.userName
            }
        })

        if (!_.isEmpty(oldItem)) {
            throw new Error(res.__('validate_hadUse_userName'));
        }

        await adminUserService.create(formObj);

        renderSuccess(req, res);
    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}



exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;
        let password = req.query.password;
        let queryObj = {
            _id
        };

        if (password) {
            _.assign(queryObj, {
                password
            });
        }

        let targetItem = await adminUserService.item(res, {
            query: queryObj,
            files: '-password'
        });

        renderSuccess(req, res, {
            data: targetItem
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}


exports.update = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
            userName: fields.userName,
            name: fields.name,
            email: fields.email,
            logo: fields.logo,
            phoneNum: fields.phoneNum,
            countryCode: fields.countryCode,
            group: fields.group,
            enable: fields.enable,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'adminUser', formObj);

        // 单独判断密码
        if (fields.password) {
            if (!validatorUtil.checkPwd(fields.password)) {
                errInfo = res.__("validate_inputCorrect", {
                    label: res.__("label_password")
                })
            } else {
                formObj.password = fields.password;
            }
        }

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let oldResource = adminUserService.item(res, {
            query: {
                userName: fields.userName
            }
        })

        if (!_.isEmpty(oldResource) && oldResource._id != fields._id) {
            throw new Error(res.__("validate_hadUse_userName"));
        }

        await adminUserService.update(res, fields._id, formObj);

        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}


exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;
        await adminUserService.safeDelete(req, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}

exports.getBasicSiteInfo = async (req, res, next) => {
    try {
        let adminUserCount = await adminUserService.count({
            state: '1'
        });
        let regUserCount = await userService.count({
            state: '1'
        });

        let regUsers = await userService.find({
            isPaging: '0',
            pageSize: 10
        }, {
            files: {
                email: 0
            }
        })
        let contentCount = await contentService.count({
            state: '2'
        });
        let messageCount = await messageService.count();

        let reKey = new RegExp(req.session.adminUserInfo.userName, 'i')
        let loginLogs = await systemOptionLogService.find({
            isPaging: '0',
            pageSize: 1
        }, {
            query: {
                type: 'login',
                logs: {
                    $regex: reKey
                }
            }
        })

        let messages = await messageService.find({
            isPaging: '0',
            pageSize: 8
        }, {
            populate: [{
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
            }]
        })
        // 权限标记
        let fullResources = await adminResourceService.find({
            isPaging: '0'
        });
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
        let renderBasicInfo = {
            adminUserCount,
            regUserCount,
            regUsers,
            contentCount,
            messageCount,
            messages,
            loginLogs,
            resources: newResources
        }

        renderSuccess(req, res, {
            data: renderBasicInfo
        });
    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.getUserSession = async (req, res, next) => {
    try {

        let noticeCounts = await userNotifyService.count({
            'systemUser': req.session.adminUserInfo._id,
            'isRead': false
        })
        let renderData = {
            noticeCounts,
            loginState: req.session.adminlogined,
            userInfo: req.session.adminUserInfo
        };

        renderSuccess(req, res, {
            data: renderData
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}