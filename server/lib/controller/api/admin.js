/*
 * @Author: doramart 
 * @Date: 2019-06-27 17:16:32 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-06 13:57:01
 */


const {
    adminUserService,
    systemOptionLogService,
    systemConfigService,
} = require('@service');

const jwt = require('jsonwebtoken')
const {
    validateForm
} = require('../validate/index');
const settings = require('@configs/settings');
const _ = require('lodash');


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
        // console.log('--showImgCode--', showImgCode)
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

        let errInfo = validateForm(res, 'adminUserLogin', formObj, fields.token)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let user = await adminUserService.item(res, {
            query: formObj,
            populate: [{
                path: 'group',
                select: 'power _id enable name'
            }],
            files: 'enable password _id email userName'
        })

        if (!_.isEmpty(user)) {
            if (!user.enable) {
                throw new Error(res.__("validate_user_forbiden"));
            }

            let adminUserToken = jwt.sign({
                _id: user._id,
                password: user.password
            }, settings.encrypt_key, {
                expiresIn: '30day'
            });

            res.cookie('admin_' + settings.auth_cookie_name, adminUserToken, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 30,
                signed: true,
                httpOnly: true
            }); //cookie 有效期30天

            // 记录登录日志
            let clientIp = getClientIP(req);
            let loginLog = {
                type: 'login',
                logs: user.userName + ' login，ip:' + clientIp,
            };
            await systemOptionLogService.create(loginLog);

            renderSuccess(req, res);

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