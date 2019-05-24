const BaseComponent = require('../prototype/baseComponent');
const VersionManageModel = require("../models").VersionManage;
const formidable = require('formidable');
const {
    service,
    settings,
    validatorUtil,
    logUtil,
    siteFunc
} = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')


function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!fields.title) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("label_version_title")
        });
    }
    if (!fields.description) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("label_version_description")
        });
    }
    if (!fields.version) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("label_version_version")
        });
    }
    if (!fields.versionName) {
        errMsg = res.__("validate_inputCorrect", {
            label: res.__("label_version_versionName")
        });
    }

    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class VersionManage {
    constructor() {
        // super()
    }
    async getVersionManages(req, res, next) {
        try {
            let modules = req.query.modules;
            let files = null; // 查询模式 full/simple
            let useClient = req.query.useClient;
            let versionCode = req.query.versionCode;
            let client = req.query.client;


            let queryObj = {};
            let versionInfoCount = await VersionManageModel.count({});

            if (useClient != '0') {
                if (!versionCode || !validator.isNumeric(versionCode)) {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                }
                queryObj.version = {
                    $gt: Number(versionCode)
                }
            }

            if (client) {
                if (client != '0' && client != '1') {
                    throw new siteFunc.UserException(res.__('validate_error_params'));
                } else {
                    queryObj.client = client;
                }
            }

            let versionManages = await VersionManageModel.find(queryObj, files);

            // 如果为空，则创建2个
            // console.log('---versionInfoCount--', versionInfoCount)
            if (versionInfoCount == 0) {
                let configObj = {
                    "date": new Date(),
                    "description": "新增自动更新",
                    "forcibly": false,
                    "title": "有更新啦1",
                    "url": "",
                    "version": 1,
                    "client": client,
                    "versionName": "1.0"
                }
                // console.log('--configObj--', configObj)
                let versionObj = new VersionManageModel(configObj);
                await versionObj.save();
            }


            if (modules && modules.length > 0) {
                return versionManages[0];
            } else {
                if (useClient == '0') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'get versionData success', {
                        docs: versionManages
                    }));
                } else {
                    res.send(siteFunc.renderApiData(req, res, 200, 'get versionData success', versionManages[0]));
                }
            }

        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getVersionManages'));
        }
    }

    async getConfigsByFiles(params = {}, files = null) {
        return await VersionManageModel.find(params, files);
    }

    async updateVersionData(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {

            try {

                checkFormData(req, res, fields);

                const systemObj = {
                    title: fields.title,
                    description: fields.description,
                    version: fields.version,
                    versionName: fields.versionName,
                    forcibly: fields.forcibly,
                    url: fields.url
                }
                const item_id = fields._id;

                if (item_id) {
                    await VersionManageModel.findOneAndUpdate({
                        _id: item_id
                    }, {
                        $set: systemObj
                    });
                } else {
                    const versionObj = new VersionManage(systemObj);
                    await versionObj.save();
                }
                res.send(siteFunc.renderApiData(req, res, 200, 'updateVersionData success', {}));

            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'updateVersionData'));

            }
        })

    }

}

module.exports = new VersionManage();