const BaseComponent = require('../prototype/baseComponent');
const UserNotifyModel = require("../models").UserNotify;
const NotifyModel = require("../models").Notify;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

class UserNotify {
    constructor() {
        // super()
    }
    async getUserNotifys(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let user = req.query.user;
            let systemUser = req.query.systemUser;
            let queryObj = {};
            if (user) {
                queryObj.user = req.query.user;
            } else if (systemUser) {
                queryObj.systemUser = req.query.systemUser;
            }
            const userNotifys = await UserNotifyModel.find(queryObj).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'notify',
                select: 'title content _id'
            }]).exec();;
            const totalItems = await UserNotifyModel.count(queryObj);
            res.send({
                state: 'success',
                docs: userNotifys,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            })
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_DATA',
                message: '获取UserNotify失败'
            })
        }
    }

    async getOneUserNotifyByParams(req, res, params) {
        let userNotify_id = req.query._id;
        return await UserNotify.findOne(params);
    }

    async delUserNotify(req, res, next) {
        try {
            let errMsg = '', targetIds = req.query.ids;
            if (!siteFunc.checkCurrentId(targetIds)) {
                errMsg = '非法请求，请稍后重试！';
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            // 删除消息记录
            await UserNotifyModel.remove({ '_id': { $in: targetIds } });
            // 删除消息源数据
            await NotifyModel.remove({ 'notify': { $in: targetIds } });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:',
            })
        }
    }

    async addNotifyByUsers(res, users, notify) {
        if (users.length > 0) {
            for (let i = 0; i < users.length; i++) {
                let userNotify = new MessageModel();
                userNotify.systemUser = users[i]._id;
                userNotify.notify = notify;
                await userNotify.save();
            }
        }
    }

    async setMessageHasRead(req, res, next) {
        let errMsg = '', targetIds = req.query.ids;
        if (!siteFunc.checkCurrentId(targetIds)) {
            errMsg = '非法请求，请稍后重试！';
        } else {
            targetIds = targetIds.split(',');
        }
        if (errMsg) {
            res.send({
                state: 'error',
                message: errMsg,
            })
        }
        let query = { '_id': { $in: targetIds } };
        // 用户只能操作自己的消息
        let user = req.query.user;
        let systemUser = req.query.systemUser;
        if (user) {
            query.user = req.query.user;
        } else if (systemUser) {
            query.systemUser = req.query.systemUser;
        }
        try {
            await UserNotifyModel.update(query, { $set: { 'isRead': true } }, { multi: true });
            res.send({
                state: 'success',
                message: '设置已读成功',
            })
        } catch (error) {
            res.send({
                state: 'error',
                message: '设置已读失败' + error,
            })
        }

    }

    // 根据用户信息获取未读消息
    async getNoReadNotifyCountByUserId(userId, type) {
        let msgQuery = {};
        if (type == 'user') {
            msgQuery = { 'user': userId, 'isRead': false };
        } else if (type == 'adminUser') {
            msgQuery = { 'systemUser': userId, 'isRead': false };
        }
        let noticeCounts = await UserNotifyModel.count(msgQuery);
    }



}

module.exports = new UserNotify();