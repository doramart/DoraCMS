const BaseComponent = require('../prototype/baseComponent');
const HelpCenterModel = require("../models").HelpCenter;
const formidable = require('formidable');
const {
    service,
    validatorUtil,
    siteFunc
} = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')
const _ = require('lodash')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.name, 1, 50)) {
        errMsg = res.__("validate_rangelength", {
            min: 1,
            max: 50,
            label: res.__("label_tag_name")
        });
    }
    if (!validator.isLength(fields.comments, 2, 200000)) {
        errMsg = res.__("validate_rangelength", {
            min: 2,
            max: 200000,
            label: res.__("label_comments")
        });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class HelpCenter {
    constructor() {
        // super()
    }
    async getHelpCenters(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let searchkey = req.query.searchkey,
                queryObj = {};
            let useClient = req.query.useClient;
            let helpType = req.query.helpType;
            let helpLang = req.query.helpLang || '1';

            if (model === 'full') {
                pageSize = '1000'
            }

            if (useClient != '0') {
                queryObj.lang = helpLang;
            }

            if (searchkey) {
                let reKey = new RegExp(searchkey, 'i')
                queryObj.name = {
                    $regex: reKey
                }
            }

            if (helpType) {
                queryObj.type = helpType;
            }
            // console.log('----queryObj--', queryObj);
            const helpCenters = await HelpCenterModel.find(queryObj).sort({
                date: -1
            }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'user',
                select: 'name userName _id'
            }]).exec();
            const totalItems = await HelpCenterModel.count(queryObj);
            // console.log('--helpCenters----', helpCenters)
            let helpCenterData = {
                docs: helpCenters,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10,
                    searchkey: searchkey || ''
                }
            };
            let renderHelpCenterData = siteFunc.renderApiData(req, res, 200, 'HelpCenter', helpCenterData);
            if (modules && modules.length > 0) {
                return helpCenters;
            } else {
                if (useClient == '2') {
                    res.send(siteFunc.renderApiData(req, res, 200, 'getHelpCenters', helpCenters));
                } else {
                    res.send(renderHelpCenterData);
                }
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async addHelpCenter(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);

                const tagObj = {
                    name: fields.name,
                    type: fields.type,
                    lang: fields.lang,
                    state: fields.state,
                    user: req.session.adminUserInfo._id,
                    comments: fields.comments
                }

                const newHelpCenter = new HelpCenterModel(tagObj);

                await newHelpCenter.save();

                res.send(siteFunc.renderApiData(req, res, 200, 'HelpCenter', {
                    id: newHelpCenter._id
                }, 'save'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateHelpCenter(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
                const userObj = {
                    name: fields.name,
                    state: fields.state,
                    lang: fields.lang,
                    type: fields.type,
                    user: req.session.adminUserInfo._id,
                    comments: fields.comments,
                    updateTime: new Date()
                }
                const item_id = fields._id;

                await HelpCenterModel.findOneAndUpdate({
                    _id: item_id
                }, {
                    $set: userObj
                });
                res.send(siteFunc.renderApiData(req, res, 200, 'HelpCenter', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delHelpCenter(req, res, next) {
        try {
            let errMsg = '';
            if (!siteFunc.checkCurrentId(req.query.ids)) {
                errMsg = res.__("validate_error_params");
            }
            if (errMsg) {
                throw new siteFunc.UserException(errMsg);
            }
            await HelpCenterModel.remove({
                _id: req.query.ids
            });
            res.send(siteFunc.renderApiData(req, res, 200, 'HelpCenter', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }


}

module.exports = new HelpCenter();