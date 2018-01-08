const BaseComponent = require('../prototype/baseComponent');
const AdminGroupModel = require("../models").AdminGroup;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validatorUtil.checkName(fields.name, 2, 10)) {
        errMsg = '2-10个中文字符!';
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 30)) {
        errMsg = '请输入5-30个字符!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class AdminGroup {
    constructor() {
        // super()
    }
    async getAdminGroups(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            const AdminGroups = await AdminGroupModel.find({});
            const totalItems = await AdminGroupModel.count();
            res.send({
                state: 'success',
                docs: AdminGroups,
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
                message: '获取AdminGroups失败'
            })
        }
    }

    async addAdminGroup(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }
            const groupObj = {
                name: fields.name,
                comments: fields.comments
            }

            const newAdminGroup = new AdminGroupModel(groupObj);
            try {
                await newAdminGroup.save();
                res.send({
                    state: 'success',
                    id: newAdminGroup._id
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '保存数据失败:',
                })
            }
        })
    }

    async updateAdminGroup(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }
            const userObj = {
                name: fields.name,
                comments: fields.comments,
                power: fields.power
            }
            const item_id = fields._id;
            try {
                await AdminGroupModel.findOneAndUpdate({ _id: item_id }, { $set: userObj });
                res.send({
                    state: 'success'
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '更新数据失败:',
                })
            }
        })
    }

    async delAdminGroup(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await AdminGroupModel.remove({ _id: req.query.ids });
            res.send({
                state: 'success'
            });
        } catch (err) {
            logUtil.error(err, req);
            res.send({
                state: 'error',
                type: 'ERROR_IN_SAVE_DATA',
                message: '删除数据失败:' + err,
            })
        }
    }

}

module.exports = new AdminGroup();