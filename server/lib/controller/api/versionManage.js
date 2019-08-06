/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-16 13:42:41
 */


const {
    versionManageService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let client = req.query.client;
        let queryObj = {};

        if (client) {
            if (client != '0' && client != '1') {
                throw new Error(res.__('validate_error_params'));
            } else {
                queryObj.client = client;
            }
        }


        let versionManageList = await versionManageService.find({
            isPaging: '0'
        }, {
            query: queryObj
        });

        renderSuccess(req, res, {
            data: versionManageList[0]
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

        let targetUser = await versionManageService.item(res, {
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
            title: fields.title,
            description: fields.description,
            version: fields.version,
            versionName: fields.versionName,
            forcibly: fields.forcibly,
            url: fields.url
        }

        let errInfo = validateForm(res, 'versionManage', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await versionManageService.update(res, fields.id, formObj);

        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}