/*
 * @Author: doramart 
 * @Date: 2019-07-07 14:27:30 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-15 09:54:59
 */

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');
const _ = require('lodash')

const {
    userNotifyService,
    notifyService
} = require('@service');




exports.getUserNotifys = async (req, res, next) => {
    try {

        let payload = req.query;
        let userNotifyList = await userNotifyService.find(payload, {
            query: {
                user: req.session.user._id
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

exports.delUserNotify = async (req, res, next) => {
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
                        '_id': userNotifyId,
                        user: req.session.user._id
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
        let queryObj = {};
        let errMsg = '';
        // 用户只能操作自己的消息
        let userInfo = req.session.user || {};
        if (_.isEmpty(userInfo)) {
            throw new Error(res.__(res.__("validate_error_params")))
        } else {
            queryObj.user = req.session.user._id;
        }

        if (targetIds == 'all') {
            queryObj.isRead = true;
        } else {
            if (!checkCurrentId(targetIds)) {
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new Error(errMsg);
            }
            queryObj['_id'] = {
                $in: targetIds
            };
        }

        await userNotifyService.updateMany(res, targetIds, {
            'isRead': true
        }, {
            query: queryObj
        });

        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}