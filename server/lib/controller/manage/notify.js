/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-30 07:29:21
 */


const {
    notifyService,
    userService,
    userNotifyService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;

        let notifyList = await notifyService.find(payload, {
            query: {
                type: '1'
            },
            populate: [{
                path: 'adminSender',
                select: 'userName -_id'
            }]
        });

        renderSuccess(req, res, {
            data: notifyList
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
            title: fields.title,
            content: fields.content,
            adminSender: req.session.adminUserInfo._id,
            type: '1'
        }

        let errInfo = validateForm(res, 'notify', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let announceObj = await notifyService.create(formObj);
        // 发送公告给用户
        let regUsers = await userService.find({
            isPaging: '0'
        }, {
            query: {
                state: '1'
            }
        });
        if (regUsers.length > 0) {
            for (var i = 0; i < regUsers.length; i++) {
                await userNotifyService.create({
                    user: regUsers[i]._id,
                    notify: announceObj._id
                });
            }
        }

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

        let targetUser = await notifyService.item(res, {
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


exports.removes = async (req, res, next) => {
    try {

        let targetIds = req.query.ids;
        await notifyService.removes(res, targetIds);
        await userNotifyService.removes(res, targetIds, 'notify');
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}