const BaseComponent = require('../prototype/baseComponent');
const AdminResourceModel = require("../models").AdminResource;
const formidable = require('formidable');
const shortid = require('shortid');
const validator = require('validator')

const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validatorUtil.checkName(fields.label, 2, 10)) {
        errMsg = '2-10个中文字符!';
    }
    if (!fields.type) {
        errMsg = '资源类型为必填!';
    }
    if (!validator.isLength(fields.comments, 2, 30)) {
        errMsg = '请输入2-30个字符!';
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class AdminResource {
    constructor() {
        // super()
    }
    async getAdminResources(req, res, next) {
        try {
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            const AdminResources = await AdminResourceModel.find({}).sort({
                sortId: 1
            });
            const totalItems = await AdminResourceModel.count();
            res.send({
                state: 'success',
                docs: AdminResources,
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
                message: '获取AdminResources失败'
            })
        }
    }

    async getAllResource(req, res, params = {}) {
        let files = req.query.resourcefiles || null;
        return await AdminResourceModel.find(params, files).sort({
            sortId: 1
        });
    }

    async addAdminResource(req, res, next) {
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

            const newAdminResource = new AdminResourceModel(groupObj);
            try {
                await newAdminResource.save();
                res.send({
                    state: 'success',
                    id: newAdminResource._id
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

    async updateAdminResource(req, res, next) {
        console.log('--req.params--', req.params);
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
            const item_id = fields._id;
            try {
                await AdminResourceModel.findOneAndUpdate({
                    _id: item_id
                }, {
                        $set: userObj
                    });
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

    async delAdminResource(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await AdminResourceModel.remove({
                _id: req.query.ids
            });
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

}

module.exports = new AdminResource();