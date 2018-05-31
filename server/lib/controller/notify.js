const BaseComponent = require('../prototype/baseComponent');
const NotifyModel = require("../models").Notify;
const AdminUserModel = require("../models").AdminUser;
const UserModel = require("../models").User;
const UserNotifyModel = require("../models").UserNotify;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.title, 5, 100)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 100, label: res.__("label_notify_title") });
    }
    if (!validator.isLength(fields.content, 5, 500)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 500, label: res.__("label_notify_content") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class Notify {
    constructor() {
        // super()
    }
    async getNotifys(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let type = req.query.type, queryObj = {};
            if (type) {
                queryObj.type = type;
            }
            const notifies = await NotifyModel.find(queryObj).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'adminSender',
                select: 'userName -_id'
            }]).exec();
            const totalItems = await NotifyModel.count(queryObj);
            let renderData = {
                docs: notifies,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    totalPage: Math.ceil(totalItems / pageSize)
                }
            };
            res.send(siteFunc.renderApiData(res, 200, 'notify', renderData, 'getlist'))
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async getOneNotifyByParams(req, res, params) {
        let Notify_id = req.query._id;
        return await Notify.findOne(params);
    }

    async delNotify(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await NotifyModel.remove({ _id: req.query.ids });

            res.send(siteFunc.renderApiData(res, 200, 'notify', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

    async addOneSysNotify(req, res, next) {

        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const announceObj = {
                title: fields.title,
                content: fields.content,
                adminSender: req.session.adminUserInfo._id,
                type: '1'
            }
            const newAnnounce = new NotifyModel(announceObj);
            try {
                let announceObj = await newAnnounce.save();
                // 发送公告给用户
                let regUsers = await UserModel.find({}, '_id');
                if (regUsers.length > 0) {
                    for (var i = 0; i < regUsers.length; i++) {
                        let userNotify = new UserNotifyModel({
                            user: regUsers[i]._id,
                            notify: announceObj._id
                        });
                        userNotify.save();
                    }
                }

                res.send(siteFunc.renderApiData(res, 200, 'notify', {}, 'save'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

}

module.exports = new Notify();