const BaseComponent = require('../prototype/baseComponent');
const SystemConfigModel = require("../models").SystemConfig;
const DataOptionLog = require("./dataOptionLog");

const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const settings = require('../../../configs/settings');
const schedule = require('node-schedule');
const _ = require('lodash');

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!fields.siteEmailServer) {
        errMsg = '请选择系统邮箱服务器！';
    }
    if (!validatorUtil.checkPwd(fields.siteEmailPwd)) {
        errMsg = '6-12位，只能包含字母、数字和下划线!';
    }
    if (!validatorUtil.checkEmail(fields.siteEmail)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_user_email") });
    }
    if (!validator.isLength(fields.siteName, 5, 100)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_site_name") });
    }
    if (!validator.isLength(fields.siteDiscription, 5, 200)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_site_dis") });
    }
    if (!validator.isLength(fields.siteKeywords, 5, 100)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_site_keyWords") });
    }
    if (!validator.isLength(fields.siteAltKeywords, 5, 100)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_site_tags") });
    }
    if (!validator.isLength(fields.registrationNo, 5, 30)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_site_icp") });
    }
    if (!validator.isLength(fields.mongodbInstallPath, 5, 100)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_mongoPath") });
    }
    if (!validator.isLength(fields.databackForderPath, 5, 100)) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_sysconfig_databakPath") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class SystemConfig {
    constructor() {
        // super()
    }
    async getSystemConfigs(req, res, next) {
        try {
            let modules = req.query.modules;
            let model = req.query.model, files = null; // 查询模式 full/simple
            if (model === 'simple') {
                files = {
                    siteName: 1,
                    siteDomain: 1,
                    siteDiscription: 1,
                    siteKeywords: 1,
                    siteAltKeywords: 1,
                    siteEmail: 1,
                    registrationNo: 1,
                    showImgCode: 1
                }
            }
            const systemConfigs = await SystemConfigModel.find({}, files);

            let configData = {
                docs: systemConfigs
            };

            let renderData = siteFunc.renderApiData(res, 200, 'systemConfig', configData, 'getlist');

            if (modules && modules.length > 0) {
                return renderData.data.docs;
            } else {
                res.send(renderData);
            }

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async getConfigsByFiles(files = '') {
        return await SystemConfigModel.find({}, files);
    }

    async updateSystemConfig(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const systemObj = {
                siteName: fields.siteName,
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
                siteEmailPwd: service.encrypt(fields.siteEmailPwd, settings.encrypt_key),
                poseArticlScore: fields.poseArticlScore,
                postMessageScore: fields.postMessageScore,
                shareArticlScore: fields.shareArticlScore,
                bakDatabyTime: fields.bakDatabyTime,
                bakDataRate: fields.bakDataRate
            }
            const item_id = fields._id;
            try {
                if (item_id) {
                    await SystemConfigModel.findOneAndUpdate({ _id: item_id }, { $set: systemObj });
                } else {
                    const newAdminUser = new SystemConfigModel(systemObj);
                    await newAdminUser.save();
                }
                if (fields.bakDatabyTime) {
                    (new SystemConfig()).addBakDataTask(req, res, fields.bakDataRate);
                } else {
                    (new SystemConfig()).cancelBakDataTask();
                }
                res.send(siteFunc.renderApiData(res, 200, 'systemConfig', {}, 'update'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async addBakDataTask(req = {}, res = {}, bakDataRate) {
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

    async cancelBakDataTask() {
        console.log('---取消定时器---');
        global.bakDataTask.cancel();
    }

}

module.exports = new SystemConfig();