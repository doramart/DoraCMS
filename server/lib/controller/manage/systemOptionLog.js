/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-27 10:27:51
 */


const {
    systemOptionLogService
} = require('@service');
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let systemOptionLogList = await systemOptionLogService.find(payload);

        renderSuccess(req, res, {
            data: systemOptionLogList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;
        await systemOptionLogService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}

exports.removeAll = async (req, res, next) => {
    try {

        await systemOptionLogService.removeAll();
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}