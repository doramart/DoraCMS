/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-30 07:28:54
 */


const {
    helpCenterService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let helpType = req.query.helpType;
        let queryObj = {};

        if (helpType) {
            queryObj.type = helpType;
        }

        let helpCenterList = await helpCenterService.find(payload, {
            query: queryObj,
            searchKeys: ['name'],
            populate: [{
                path: 'user',
                select: 'name userName _id'
            }]
        });

        renderSuccess(req, res, {
            data: helpCenterList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.create = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
            name: fields.name,
            type: fields.type,
            lang: fields.lang,
            state: fields.state,
            user: req.session.adminUserInfo._id,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'helpCenter', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await helpCenterService.create(formObj);

        renderSuccess(req, res);

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}



exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetItem = await helpCenterService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetItem
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
            name: fields.name,
            state: fields.state,
            lang: fields.lang,
            type: fields.type,
            user: req.session.adminUserInfo._id,
            comments: fields.comments,
            updateTime: new Date()
        }

        let errInfo = validateForm(res, 'helpCenter', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await helpCenterService.update(res, fields._id, formObj);

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
        await helpCenterService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}