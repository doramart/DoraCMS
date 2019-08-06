/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 11:07:54
 */


const {
    adminGroupService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let adminGroupList = await adminGroupService.find(payload);

        renderSuccess(req, res, {
            data: adminGroupList
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
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'adminGroup', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await adminGroupService.create(formObj);

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

        let targetUser = await adminGroupService.item(res, {
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
            name: fields.name,
            comments: fields.comments,
            power: fields.power
        }

        let errInfo = validateForm(res, 'adminGroup', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await adminGroupService.update(res, fields._id, formObj);

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
        await adminGroupService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}