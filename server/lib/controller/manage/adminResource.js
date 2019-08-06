/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-26 09:01:55
 */


const {
    adminResourceService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        _.assign(payload, {
            pageSize: 1000
        });
        let adminResourceList = await adminResourceService.find(payload);

        renderSuccess(req, res, {
            data: adminResourceList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.alllist = async (req, res) => {
    return await adminResourceService.find({
        isPaging: '0'
    }, {
        type: '1'
    })
}

exports.create = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
            label: fields.label,
            type: fields.type,
            api: fields.api,
            parentId: fields.parentId,
            sortId: fields.sortId,
            routePath: fields.routePath,
            icon: fields.icon,
            componentPath: fields.componentPath,
            enable: fields.enable,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'adminResource', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await adminResourceService.create(formObj);

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

        let targetItem = await adminResourceService.item(res, {
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
            label: fields.label,
            type: fields.type,
            api: fields.api,
            parentId: fields.parentId,
            sortId: fields.sortId,
            routePath: fields.routePath,
            icon: fields.icon,
            componentPath: fields.componentPath,
            enable: fields.enable,
            comments: fields.comments
        }

        let errInfo = validateForm(res, 'adminResource', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let oldResource = adminResourceService.item(res, {
            query: {
                label: fields.label
            }
        })

        if (!_.isEmpty(oldResource) && oldResource._id != fields._id) {
            throw new Error(res.__("user_action_tips_repeat", {
                label: res.__('label_resourceName')
            }));
        }

        await adminResourceService.update(res, fields._id, formObj);

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
        // 删除主类
        await adminResourceService.removes(res, targetIds);
        // 删除子类
        await adminResourceService.removes(res, targetIds, 'parentId');
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}