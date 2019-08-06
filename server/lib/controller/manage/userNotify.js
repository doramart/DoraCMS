/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-15 17:52:41
 */


const {
    userNotifyService,
    notifyService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let userNotifyList = await userNotifyService.find(payload, {
            query: {
                systemUser: req.session.adminUserInfo._id
            },
            populate: [{
                path: 'notify',
                select: 'title content _id'
            }]
        });

        renderSuccess(req, res, {
            data: userNotifyList
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

        let targetUser = await userNotifyService.item(res, {
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
        if (!checkCurrentId(targetIds)) {
            throw new Error(res.__("validate_error_params"));
        } else {

            let ids = targetIds.split(',');
            // 删除消息记录
            for (let i = 0; i < ids.length; i++) {
                const userNotifyId = ids[i];
                let userNotifyObj = await userNotifyService.item(res, {
                    query: {
                        '_id': userNotifyId
                    }
                })
                if (!_.isEmpty(userNotifyObj)) {
                    await notifyService.removes(res, userNotifyObj.notify);
                }
            }

        }

        await userNotifyService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}


exports.setMessageHasRead = async (req, res, next) => {

    try {
        let targetIds = req.query.ids;

        if (!checkCurrentId(targetIds)) {
            throw new Error(res.__("validate_error_params"));
        } else {
            targetIds = targetIds.split(',');
        }

        await userNotifyService.updateMany(res, targetIds, {
            'isRead': true
        }, {
            query: {
                systemUser: req.session.adminUserInfo._id
            }
        });

        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}