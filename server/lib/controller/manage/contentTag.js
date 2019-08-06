/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 11:09:19
 */


const {
    contentTagService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let contentTagList = await contentTagService.find(payload, {
            searchKeys: ['name']
        });

        renderSuccess(req, res, {
            data: contentTagList
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
            alias: fields.alias,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'contentTag', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await contentTagService.create(formObj);

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

        let targetItem = await contentTagService.item(res, {
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
            alias: fields.alias,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'contentTag', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await contentTagService.update(res, fields._id, formObj);

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
        await contentTagService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}