/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 00:35:29
 */


const {
    adsService,
    adsItemService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let adsList = await adsService.find(payload, {
            populate: [{
                path: 'items'
            }]
        });

        renderSuccess(req, res, {
            data: adsList
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
            state: fields.state,
            height: fields.height,
            carousel: fields.carousel,
            type: fields.type,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'ads', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let itemIdArr = [],
            adsItems = fields.items;
        if (adsItems.length > 0) {
            for (let i = 0; i < adsItems.length; i++) {
                let newItem = await adsItemService.create(adsItems[i]);
                itemIdArr.push(newItem._id);
            }
        }
        formObj.items = itemIdArr;
        await adsService.create(formObj);

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

        let targetItem = await adsService.item(res, {
            query: {
                _id: _id
            },
            populate: [{
                path: 'items'
            }]
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
            height: fields.height,
            carousel: fields.carousel,
            type: fields.type,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'ads', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }


        let itemIdArr = [],
            adsItems = fields.items;
        if (adsItems.length > 0) {
            for (let i = 0; i < adsItems.length; i++) {
                let targetItem = adsItems[i],
                    currentId = '';
                if (targetItem._id) {
                    currentId = targetItem._id;
                    await adsItemService.update(res, targetItem._id, targetItem);
                } else {
                    let newItem = await adsItemService.create(targetItem);
                    currentId = newItem._id;
                }
                itemIdArr.push(currentId);
            }
        }
        formObj.items = itemIdArr;

        await adsService.update(res, fields._id, formObj);

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

        if (!checkCurrentId(targetIds)) {
            throw new Error(res.__("validate_error_params"));
        } else {
            let ids = targetIds.split(',');

            for (let i = 0; i < ids.length; i++) {
                let currentId = ids[i];

                let targetAd = adsService.item(res, {
                    query: {
                        _id: currentId
                    }
                })
                if (!_.isEmpty(targetAd)) {
                    await adsItemService.removes(res, targetAd.items)
                }

            }

        }

        await adsService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}