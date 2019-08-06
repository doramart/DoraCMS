/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-09 10:35:12
 */



const xss = require("xss");
const shortid = require('shortid');
const _ = require('lodash');

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');


const {
    siteMessageService,
    userNotifyService
} = require('@service');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        let type = req.query.type;
        let queryObj = {};
        let userInfo = req.session.user || {};

        if (!_.isEmpty(userInfo)) {
            queryObj.passiveUser = userInfo._id;
        }

        if (type) {
            queryObj.type = type;
        }

        let siteMessageList = await siteMessageService.find(payload, {
            query: queryObj
        });

        renderSuccess(req, res, {
            data: siteMessageList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}


exports.setMessageHasRead = async (req, res, next) => {
    try {
        let errMsg = '',
            targetIds = req.query.ids;
        let messageType = req.query.type;
        let queryObj = {};
        // 用户只能操作自己的消息
        let userInfo = req.session.user || {};
        if (!_.isEmpty(userInfo)) {
            queryObj.passiveUser = userInfo._id;
        } else {
            throw new Error(res.__(res.__("validate_error_params")))
        }

        // 设置我所有未读的为已读
        if (targetIds == 'all') {
            if (messageType) {
                queryObj.type = messageType;
            }
            queryObj.isRead = false;
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

        await siteMessageService.updateMany(res, '', {
            'isRead': true
        }, {
            query: queryObj,
        })

        renderSuccess(req, res, {
            data: {}
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}

// 获取私信概要
exports.getSiteMessageOutline = async (req, res, next) => {
    try {

        let userInfo = req.session.user;
        // 获取未读消息数量
        let noReadGoodNum = await siteMessageService.count({
            isRead: false,
            type: '4',
            passiveUser: userInfo._id
        });

        let noReadGoodContent = await siteMessageService.find({
            isPaging: '0',
            pageSize: 1
        }, {
            query: {
                type: '4',
                passiveUser: userInfo._id
            }
        })

        let noReadFollowNum = await siteMessageService.count({
            isRead: false,
            type: '2',
            passiveUser: userInfo._id
        });
        let noReadFollowContent = await siteMessageService.find({
            isPaging: '0',
            pageSize: 1
        }, {
            query: {
                type: '2',
                passiveUser: userInfo._id
            }
        })

        let noReadCommentNum = await siteMessageService.count({
            isRead: false,
            type: '3',
            passiveUser: userInfo._id
        });
        let noReadCommentContent = await siteMessageService.find({
            isPaging: '0',
            pageSize: 1
        }, {
            query: {
                type: '3',
                passiveUser: userInfo._id
            }
        })

        let userNotify_num = await userNotifyService.count({
            isRead: false,
            user: userInfo._id
        });

        let userNotifyContent = await userNotifyService.find({}, {
            query: {
                isRead: false,
                user: userInfo._id
            },
            populate: ['notify']
        })

        let renderData = {
            first_privateLetter: userNotifyContent[0] || {},
            private_no_read_num: userNotify_num,
            no_read_good_num: noReadGoodNum,
            first_good_message: noReadGoodContent[0] || {},
            no_read_follow_num: noReadFollowNum,
            first_follow_message: noReadFollowContent[0] || {},
            no_read_comment_num: noReadCommentNum,
            first_comment_message: noReadCommentContent[0] || {},
        }

        renderSuccess(req, res, {
            data: renderData
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }
}