const BaseComponent = require('../prototype/baseComponent');
const ContentTagModel = require("../models").ContentTag;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.name, 1, 12)) {
        errMsg = res.__("validate_rangelength", { min: 1, max: 12, label: res.__("label_tag_name") });
    }
    if (!validator.isLength(fields.comments, 2, 30)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 30, label: res.__("label_comments") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class ContentTag {
    constructor() {
        // super()
    }
    async getContentTags(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let searchkey = req.query.searchkey, queryObj = {};

            if (model === 'full') {
                pageSize = '1000'
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.name = { $regex: reKey }
            }

            const contentTags = await ContentTagModel.find(queryObj).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize));
            const totalItems = await ContentTagModel.count(queryObj);

            let tagsData = {
                docs: contentTags,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            };
            let renderTagsData = siteFunc.renderApiData(res, 200, 'contentTag', tagsData);
            if (modules && modules.length > 0) {
                return renderTagsData.data;
            } else {
                res.send(renderTagsData);
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async addContentTag(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const tagObj = {
                name: fields.name,
                alias: fields.alias,
                comments: fields.comments
            }

            const newContentTag = new ContentTagModel(tagObj);
            try {
                await newContentTag.save();

                res.send(siteFunc.renderApiData(res, 200, 'contentTag', { id: newContentTag._id }, 'save'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateContentTag(req, res, next) {
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
                alias: fields.alias,
                comments: fields.comments
            }
            const item_id = fields._id;
            try {
                await ContentTagModel.findOneAndUpdate({ _id: item_id }, { $set: userObj });
                res.send(siteFunc.renderApiData(res, 200, 'contentTag', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delContentTag(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await ContentTagModel.remove({ _id: req.query.ids });
            res.send(siteFunc.renderApiData(res, 200, 'contentTag', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new ContentTag();