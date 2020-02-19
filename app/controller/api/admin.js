/*
 * @Author: doramart 
 * @Date: 2019-06-27 17:16:32 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-02-17 17:44:26
 */
const Controller = require('egg').Controller;
const jwt = require('jsonwebtoken')
const _ = require('lodash');

const {
    adminUserRule
} = require('@validate')


class AdminController extends Controller {


    async login() {
        const {
            ctx
        } = this;

        try {
            if (ctx.session.adminUserInfo) {
                ctx.redirect('/admin/dashboard');
            } else {

                let configs = await ctx.helper.reqJsonData('systemConfig/getConfig');
                const {
                    showImgCode
                } = configs || [];
                await ctx.render('manage/login.html', {
                    staticRootPath: this.app.config.static.prefix,
                    showImgCode
                });
            }
        } catch (error) {
            ctx.helper.renderFail(ctx, {
                message: error
            });
        }

    }

    async loginAction() {

        const {
            ctx,
            service
        } = this;
        try {

            let fields = ctx.request.body || {};
            const systemConfigs = await ctx.service.systemConfig.find({
                isPaging: '0'
            });
            const {
                showImgCode
            } = systemConfigs[0];

            let errMsg = '';
            if (showImgCode && (!fields.imageCode || fields.imageCode != ctx.session.imageCode)) {
                errMsg = ctx.__("validate_inputCorrect", [ctx.__("label_user_imageCode")])
            }

            if (errMsg) {
                throw new Error(errMsg);
            }

            const formObj = {
                userName: fields.userName,
                password: fields.password
            }

            ctx.validate(adminUserRule.login(ctx), formObj)



            let user = await ctx.service.adminUser.item(ctx, {
                query: formObj,
                populate: [{
                    path: 'group',
                    select: 'power _id enable name'
                }, {
                    path: 'targetEditor',
                    select: 'userName _id'
                }],
                files: 'enable password _id email userName logo'
            })

            if (!_.isEmpty(user)) {
                if (!user.enable) {
                    throw new Error(ctx.__("validate_user_forbiden"));
                }

                let adminUserToken = jwt.sign({
                    _id: user._id,
                }, this.app.config.encrypt_key, {
                    expiresIn: '30day'
                });

                ctx.cookies.set('admin_' + this.app.config.auth_cookie_name, adminUserToken, {
                    path: '/',
                    maxAge: this.app.config.adminUserMaxAge,
                    signed: true,
                    httpOnly: false
                }); //cookie 有效期30天

                // 记录登录日志
                let clientIp = ctx.header['x-forwarded-for'] || ctx.header['x-real-ip'] || ctx.request.ip;
                let loginLog = {
                    type: 'login',
                    logs: user.userName + ' login，ip:' + clientIp,
                };

                if (!_.isEmpty(ctx.service.systemOptionLog)) {
                    await ctx.service.systemOptionLog.create(loginLog);
                }

                ctx.helper.renderSuccess(ctx, {
                    data: {
                        token: adminUserToken
                    }
                });

            } else {
                ctx.helper.renderFail(ctx, {
                    message: ctx.__("validate_login_notSuccess")
                });
            }

        } catch (err) {
            // console.log('--err--', err)
            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }

}

module.exports = AdminController;