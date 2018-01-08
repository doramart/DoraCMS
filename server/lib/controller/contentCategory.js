const BaseComponent = require('../prototype/baseComponent');
const ContentCategoryModel = require("../models").ContentCategory;
const formidable = require('formidable');
const { service, settings, validatorUtil, logUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = '非法请求，请稍后重试！';
    }
    if (!validator.isLength(fields.name, 2, 20)) {
        errMsg = '2-20个非特殊字符!';
    }
    if (!fields.defaultUrl) {
        errMsg = '请输入用于seo的url!';
    }
    if (fields.comments && !validator.isLength(fields.comments, 4, 100)) {
        errMsg = '4-100个非特殊字符!';
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
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let parentId = req.query.parentId; // 分类ID
            let enable = req.query.enable;
            let queryObj = {};
            if (parentId) {
                queryObj['parentId'] = parentId;
            }
            if (enable) {
                queryObj['enable'] = enable;
            }
            if (model === 'full') {
                pageSize = '1000'
            }

            const ContentCategories = await ContentCategoryModel.find(queryObj).sort({ sortId: 1 });
            const totalItems = await ContentCategoryModel.count(queryObj);
            res.send({
                state: 'success',
                docs: ContentCategories,
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
                message: '获取ContentCategories失败'
            })
        }
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
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }

            const groupObj = {
                name: fields.name,
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                comments: fields.comments
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
                res.send({
                    state: 'success',
                    id: cateObj._id
                });
            } catch (err) {
                logUtil.error(err, req);
                res.send({
                    state: 'error',
                    type: 'ERROR_IN_SAVE_DATA',
                    message: '保存数据失败:' + err,
                })
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
                res.send({
                    state: 'error',
                    type: 'ERROR_PARAMS',
                    message: err.message
                })
                return
            }

            const cateObj = {
                name: fields.name,
                keywords: fields.keywords,
                sortId: fields.sortId,
                parentId: fields.parentId,
                enable: fields.enable,
                defaultUrl: fields.defaultUrl,
                sortPath: fields.sortPath,
                comments: fields.comments
            }
            const item_id = fields._id;
            try {
                await ContentCategoryModel.findOneAndUpdate({ _id: item_id }, { $set: cateObj });
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

    async delContentCategory(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = '非法请求，请稍后重试！';
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await ContentCategoryModel.remove({ _id: req.query.ids });
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

module.exports = new ContentCategory();