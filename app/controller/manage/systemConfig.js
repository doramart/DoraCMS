/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-11-08 09:48:19
 */
const Controller = require('egg').Controller;

const {
    systemConfigRule
} = require('@validate')


// const DataOptionLog = require("./dataOptionLog");
const _ = require('lodash');



// const schedule = require('node-schedule');

class SystemConfigController extends Controller {
    async list() {
        const {
            ctx,
            service
        } = this;
        try {

            let payload = ctx.query;
            let systemConfigList = await ctx.service.systemConfig.find(payload, {
                files: '-siteEmailPwd'
            });

            ctx.helper.renderSuccess(ctx, {
                data: systemConfigList
            });

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }
    }


    async getOne() {
        const {
            ctx,
            service
        } = this;
        try {
            let _id = ctx.query.id;

            let targetUser = await ctx.service.systemConfig.item(ctx, {
                query: {
                    _id: _id
                }
            });

            ctx.helper.renderSuccess(ctx, {
                data: targetUser
            });

        } catch (err) {
            ctx.helper.renderFail(ctx, {
                message: err
            });
        }

    }


    async update() {

        const {
            ctx,
            service
        } = this;
        try {

            let fields = ctx.request.body || {};
            const formObj = {
                siteName: fields.siteName,
                ogTitle: fields.ogTitle,
                siteDomain: fields.siteDomain,
                siteDiscription: fields.siteDiscription,
                siteKeywords: fields.siteKeywords,
                siteAltKeywords: fields.siteAltKeywords,
                siteEmailServer: fields.siteEmailServer,
                siteEmail: fields.siteEmail,
                registrationNo: fields.registrationNo,
                databackForderPath: fields.databackForderPath,
                mongodbInstallPath: fields.mongodbInstallPath,
                showImgCode: fields.showImgCode,
                statisticalCode: fields.statisticalCode,
                bakDatabyTime: fields.bakDatabyTime,
                bakDataRate: fields.bakDataRate
            }


            ctx.validate(systemConfigRule.form(ctx), formObj);

            // 单独判断密码
            if (fields.siteEmailPwd) {
                if (fields.siteEmailPwd.length < 6) {
                    errInfo = ctx.__("validate_inputCorrect", [ctx.__("label_password")])
                } else {
                    formObj.siteEmailPwd = ctx.helper.encrypt(fields.siteEmailPwd, this.app.config.encrypt_key);
                }
            }



            if (fields._id) {
                await ctx.service.systemConfig.update(ctx, fields._id, formObj);
            } else {
                await ctx.service.systemConfig.create(formObj);
            }

            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });

        }

    }


    async removes() {
        const {
            ctx,
            service
        } = this;
        try {
            let targetIds = ctx.query.ids;
            await ctx.service.systemConfig.removes(ctx, targetIds);
            ctx.helper.renderSuccess(ctx);

        } catch (err) {

            ctx.helper.renderFail(ctx, {
                message: err
            });
        }
    }

    // addBakDataTask(req = {}, res = {}, bakDataRate) {
    //     if (!_.isEmpty(global.bakDataTask)) {
    //         global.bakDataTask.cancel();
    //     }
    //     let taskRule = '0 59 23 * * *';
    //     if (bakDataRate == '3') { // 每周三次
    //         var rule = new schedule.RecurrenceRule();
    //         rule.dayOfWeek = [0, 3, 6];
    //         rule.hour = 23;
    //         rule.minute = 59;
    //         taskRule = rule;
    //     } else if (bakDataRate == '7') { // 每周
    //         taskRule = '0 59 23 * * 1';
    //     }
    //     global.bakDataTask = schedule.scheduleJob(taskRule, function () {
    //         DataOptionLog.backUpData(ctx);
    //     });
    // }

    cancelBakDataTask() {
        if (!_.isEmpty(global.bakDataTask)) {
            global.bakDataTask.cancel();
        }
    }

}

module.exports = SystemConfigController;