const BaseComponent = require('../prototype/baseComponent');
const UserNotifyModel = require("../models").UserNotify;
const NotifyModel = require("../models").Notify;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
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
            let renderData = {
                docs: userNotifys,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            }
            res.send(siteFunc.renderApiData(res, 200, 'userNotify', renderData, 'getlist'));

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

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
                errMsg = res.__("validate_error_params");
            } else {
                targetIds = targetIds.split(',');
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }

            // 删除消息记录
            for (let i = 0; i < targetIds.length; i++) {
                const userNotifyId = targetIds[i];
                let userNotifyObj = await UserNotifyModel.findOne({ '_id': userNotifyId });
                await NotifyModel.remove({ '_id': userNotifyObj.notify });
                await UserNotifyModel.remove({ '_id': userNotifyId });
            }

            res.send(siteFunc.renderApiData(res, 200, 'userNotify', {}, 'delete'));

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
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
            errMsg = res.__("validate_error_params");
        } else {
            targetIds = targetIds.split(',');
        }
        if (errMsg) {

            res.send(siteFunc.renderApiErr(req, res, 500, errMsg, 'update'));

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

            res.send(siteFunc.renderApiData(res, 200, res.__("resdata_setnoticeread_success"), {}, 'update'));

        } catch (error) {

            res.send(siteFunc.renderApiErr(req, res, 500, res.__("resdata_setnoticeread_error", { error: error.message }), 'update'));

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