const BaseComponent = require('../prototype/baseComponent');
const SystemOptionLogModel = require("../models").SystemOptionLog;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')


function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validatorUtil.checkEmail(fields.siteEmail)) {
        errMsg = '请填写正确的邮箱!';
    }
    if (!validator.isLength(fields.siteName, 5, 30)) {
        errMsg = '请输入站点名称!';
    }
    if (!validator.isLength(fields.siteDiscription, 5, 200)) {
        errMsg = '请输入站点描述!';
    }
    if (!validator.isLength(fields.siteKeywords, 5, 100)) {
        errMsg = '请输入站点关键字!';
    }
    if (!validator.isLength(fields.registrationNo, 5, 30)) {
        errMsg = '请输入站点备案号!';
    }
    if (!validator.isLength(fields.mongodbInstallPath, 5, 100)) {
        errMsg = '请输入mongodb的bin目录!';
    }
    if (!validator.isLength(fields.databackForderPath, 5, 100)) {
        errMsg = '请输入数据备份路径!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class SystemOptionLog {
    constructor() {
        // super()
    }
    async getSystemOptionLogs(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let type = req.query.type, queryObj = {};
            if (type) queryObj.type = type;
            const SystemOptionLogs = await SystemOptionLogModel.find(queryObj).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize));
            const totalItems = await SystemOptionLogModel.count(queryObj);

            res.send({
                state: 'success',
                docs: SystemOptionLogs,
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
                message: '获取SystemOptionLogs失败'
            })
        }
    }

    async delSystemOptionLogs(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (targetIds === 'all') {
                await SystemOptionLogModel.remove({});
            } else {
                if (!siteFunc.checkCurrentId(targetIds)) {
                    errMsg = '非法请求，请稍后重试！';
                } else {
                    targetIds = targetIds.split(',');
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
                await SystemOptionLogModel.remove({ '_id': { $in: targetIds } });
            }

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

module.exports = new SystemOptionLog();