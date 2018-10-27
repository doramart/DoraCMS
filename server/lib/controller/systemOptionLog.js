const BaseComponent = require('../prototype/baseComponent');
const SystemOptionLogModel = require("../models").SystemOptionLog;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')



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

            let renderData = {
                docs: SystemOptionLogs,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    type
                }
            }
            res.send(siteFunc.renderApiData(res, 200, 'systemOptionLogs', renderData, 'save'))
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async delSystemOptionLogs(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (targetIds === 'all') {
                await SystemOptionLogModel.remove({});
            } else {
                if (!siteFunc.checkCurrentId(targetIds)) {
                    errMsg = res.__("validate_error_params");
                } else {
                    targetIds = targetIds.split(',');
                }
                if (errMsg) {
                    throw new siteFunc.UserException(errMsg);
                }
                await SystemOptionLogModel.remove({ '_id': { $in: targetIds } });
            }

            res.send(siteFunc.renderApiData(res, 200, 'systemOptionLogs', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }


}

module.exports = new SystemOptionLog();