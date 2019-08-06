/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-06 08:55:09
 */


const {
    systemConfigService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const DataOptionLog = require("./dataOptionLog");
const _ = require('lodash');
const {
    service,
} = require('@utils');

const settings = require('@configs/settings');
const schedule = require('node-schedule');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let systemConfigList = await systemConfigService.find(payload, {
            files: '-siteEmailPwd'
        });

        renderSuccess(req, res, {
            data: systemConfigList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetUser = await systemConfigService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetUser
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

            bakDatabyTime: fields.bakDatabyTime,
            bakDataRate: fields.bakDataRate
        }

        let errInfo = validateForm(res, 'systemConfig', formObj)

        // 单独判断密码
        if (fields.siteEmailPwd) {
            if (fields.siteEmailPwd.length < 6) {
                errInfo = res.__("validate_inputCorrect", {
                    label: res.__("label_password")
                })
            } else {
                formObj.siteEmailPwd = service.encrypt(fields.siteEmailPwd, settings.encrypt_key);
            }
        }

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        if (fields._id) {
            await systemConfigService.update(res, fields._id, formObj);
        } else {
            await systemConfigService.create(formObj);
        }
        if (fields.bakDatabyTime) {
            this.addBakDataTask(req, res, fields.bakDataRate);
        } else {
            this.cancelBakDataTask();
        }

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
        await systemConfigService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}

exports.addBakDataTask = (req = {}, res = {}, bakDataRate) => {
    if (!_.isEmpty(global.bakDataTask)) {
        global.bakDataTask.cancel();
    }
    let taskRule = '0 59 23 * * *';
    if (bakDataRate == '3') { // 每周三次
        var rule = new schedule.RecurrenceRule();
        rule.dayOfWeek = [0, 3, 6];
        rule.hour = 23;
        rule.minute = 59;
        taskRule = rule;
    } else if (bakDataRate == '7') { // 每周
        taskRule = '0 59 23 * * 1';
    }
    global.bakDataTask = schedule.scheduleJob(taskRule, function () {
        DataOptionLog.backUpData(req, res);
    });
}

exports.cancelBakDataTask = () => {
    if (!_.isEmpty(global.bakDataTask)) {
        global.bakDataTask.cancel();
    }
}