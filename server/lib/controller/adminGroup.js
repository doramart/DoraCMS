const BaseComponent = require('../prototype/baseComponent');
const AdminGroupModel = require("../models").AdminGroup;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (fields.name && !validator.isLength(fields.name, 2, 50)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 50, label: res.__("label_name") });
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 30)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 30, label: res.__("label_comments") });
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
            let adminGroupData = {
                docs: AdminGroups,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            };
            let renderSendData = siteFunc.renderApiData(res, 200, 'adminGroup', adminGroupData)
            res.send(renderSendData);
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async addAdminGroup(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }
            const groupObj = {
                name: fields.name,
                comments: fields.comments
            }

            const newAdminGroup = new AdminGroupModel(groupObj);
            try {
                await newAdminGroup.save();
                res.send(siteFunc.renderApiData(res, 200, 'adminGroup', { id: newAdminGroup._id }, 'save'))
            } catch (err) {
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
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
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }
            const userObj = {
                name: fields.name,
                comments: fields.comments,
                power: fields.power
            }
            const item_id = fields._id;
            try {
                await AdminGroupModel.findOneAndUpdate({ _id: item_id }, { $set: userObj });
                res.send(siteFunc.renderApiData(res, 200, 'adminGroup', {}, 'update'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async delAdminGroup(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await AdminGroupModel.remove({ _id: req.query.ids });
            res.send(siteFunc.renderApiData(res, 200, 'adminGroup', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new AdminGroup();