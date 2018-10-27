const BaseComponent = require('../prototype/baseComponent');
const AdminResourceModel = require("../models").AdminResource;
const formidable = require('formidable');
const shortid = require('shortid');
const validator = require('validator')

const { service, validatorUtil, siteFunc } = require('../../../utils');

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validatorUtil.checkResourceName(fields.label, 2, 30)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 30, label: res.__("label_resourceName") });
    }
    if (!fields.type) {
        errMsg = res.__("validate_inputNull", { label: res.__("label_resourceType") });
    }
    if (!validator.isLength(fields.comments, 2, 30)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 30, label: res.__("label_comments") });
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
            let renderData = {
                docs: AdminResources,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            };

            res.send(siteFunc.renderApiData(res, 200, 'adminResource', renderData, 'getlist'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

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
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
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
                res.send(siteFunc.renderApiData(res, 200, 'adminResource', { id: newAdminResource._id }, 'save'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateAdminResource(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
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
                res.send(siteFunc.renderApiData(res, 200, 'adminResource', {}, 'update'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delAdminResource(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await AdminResourceModel.remove({
                _id: req.query.ids
            });
            res.send(siteFunc.renderApiData(res, 200, 'adminResource', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new AdminResource();