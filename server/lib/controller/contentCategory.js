const BaseComponent = require('../prototype/baseComponent');
const ContentCategoryModel = require("../models").ContentCategory;
const ContentModel = require("../models").Content;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash');

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.name, 2, 20)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 20, label: res.__("label_cate_name") });
    }
    if (!fields.defaultUrl) {
        errMsg = res.__("validate_inputCorrect", { label: res.__("label_cate_seourl") });
    }
    if (fields.comments && !validator.isLength(fields.comments, 4, 100)) {
        errMsg = res.__("validate_rangelength", { min: 4, max: 100, label: res.__("label_comments") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class ContentCategory {
    constructor() {
        // super()
    }
    async getContentCategories(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let parentId = req.query.parentId; // 分类ID
            let enable = req.query.enable;
            let type = req.query.type;
            let queryObj = {};

            if (parentId) {
                queryObj['parentId'] = parentId;
            }
            if (enable) {
                queryObj['enable'] = enable;
            }
            if (type) {
                queryObj['type'] = type;
            }
            if (model === 'full') {
                pageSize = '1000'
            }

            const ContentCategories = await ContentCategoryModel.find(queryObj).sort({ sortId: 1 }).exec();
            const totalItems = await ContentCategoryModel.count(queryObj);

            let cateData = {
                docs: ContentCategories,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            };
            let renderCateData = siteFunc.renderApiData(res, 200, 'contentCategory', cateData);
            if (modules && modules.length > 0) {
                return renderCateData.data.docs;
            } else {
                res.send(renderCateData);
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    // 根据类别id或者文档id查询子类
    async getCurrentCategoriesById(req, res, next) {
        try {
            let contentId = req.query.contentId;
            let typeId = req.query.typeId;
            let cates = [], parents = [];
            let contentObj = await ContentModel.findOne({ '_id': contentId }, 'categories').populate([{
                path: 'categories',
                select: 'name _id'
            }]).exec();

            if (typeId || !_.isEmpty(contentObj)) {
                let fullNav = await ContentCategoryModel.find({});
                let parentTypeId = typeId ? typeId : (contentObj.categories)[0]._id;

                let parentObj = _.filter(fullNav, (doc) => {
                    return doc._id == parentTypeId;
                });

                if (parentObj.length > 0) {
                    let parentId = parentObj[0].sortPath.split(',')[1] || '0';
                    cates = _.filter(fullNav, (doc) => {
                        return (doc.sortPath).indexOf(parentId) > 0
                    });
                    parents = _.filter(cates, (doc) => {
                        return doc.parentId === '0'
                    });
                }
            }

            return {
                parents,
                cates
            };
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async getCategoryInfoById(req, res, next) {
        let typeId = req.query.typeId;
        return await ContentCategoryModel.findOne({ _id: typeId }).populate('contentTemp').exec();
    }

    async getAllCategories(req, res, next) {
        let files = req.query.catefiles || null;
        return await ContentCategoryModel.find({}, files);
    }

    async addContentCategory(req, res, next) {
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
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                contentTemp: fields.contentTemp,
                comments: fields.comments,
                type: fields.type
            }

            const newContentCategory = new ContentCategoryModel(groupObj);
            try {
                let cateObj = await newContentCategory.save();
                // 更新sortPath defaultUrl
                let newQuery = {};
                if (fields.parentId == '0') {
                    newQuery.sortPath = '0,' + cateObj._id
                } else {
                    let parentObj = await ContentCategoryModel.findOne({ '_id': fields.parentId }, 'sortPath defaultUrl');
                    newQuery.sortPath = parentObj.sortPath + "," + cateObj._id;
                    newQuery.defaultUrl = parentObj.defaultUrl + '/' + fields.defaultUrl
                }
                await ContentCategoryModel.findOneAndUpdate({ _id: cateObj._id }, { $set: newQuery });

                res.send(siteFunc.renderApiData(res, 200, 'contentCategory', { id: cateObj._id }, 'save'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateContentCategory(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }

            const cateObj = {
                name: fields.name,
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                contentTemp: fields.contentTemp,
                sortPath: fields.sortPath,
                comments: fields.comments,
                type: fields.type
            }
            const item_id = fields._id;
            try {
                await ContentCategoryModel.findOneAndUpdate({ _id: item_id }, { $set: cateObj });
                res.send(siteFunc.renderApiData(res, 200, 'contentCategory', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delContentCategory(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await ContentCategoryModel.remove({ _id: req.query.ids });
            res.send(siteFunc.renderApiData(res, 200, 'contentCategory', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new ContentCategory();