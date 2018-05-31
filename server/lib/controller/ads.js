const BaseComponent = require('../prototype/baseComponent');
const AdsModel = require("../models").Ads;
const AdsItemsModel = require("../models").AdsItems;
const formidable = require('formidable');
const { service, validatorUtil, siteFunc } = require('../../../utils');
const shortid = require('shortid');
const validator = require('validator')

function checkFormData(req, res, fields) {
    let errMsg = '';
    if (fields._id && !siteFunc.checkCurrentId(fields._id)) {
        errMsg = res.__("validate_error_params");
    }
    if (!validator.isLength(fields.name, 2, 15)) {
        errMsg = res.__("validate_rangelength", { min: 2, max: 15, label: res.__("label_ads_name") });
    }
    if (!validator.isLength(fields.comments, 5, 30)) {
        errMsg = res.__("validate_rangelength", { min: 5, max: 30, label: res.__("label_comments") });
    }
    if (errMsg) {
        throw new siteFunc.UserException(errMsg);
    }
}

class Ads {
    constructor() {
        // super()
    }
    async getAds(req, res, next) {
        try {
            let modules = req.query.modules;
            let current = req.query.current || 1;
            let pageSize = req.query.pageSize || 10;
            let model = req.query.model; // 查询模式 full/simple
            let state = req.query.state;
            let queryObj = {};
            if (model === 'full') {
                pageSize = '1000'
            }
            if (state) queryObj.state = state

            const Ads = await AdsModel.find(queryObj).sort({ date: -1 }).skip(Number(pageSize) * (Number(current) - 1)).limit(Number(pageSize)).populate([{
                path: 'items'
            }]).exec();
            const totalItems = await AdsModel.count();
            let adsData = {
                docs: Ads,
                pageInfo: {
                    totalItems,
                    current: Number(current) || 1,
                    pageSize: Number(pageSize) || 10
                }
            };
            let renderData = siteFunc.renderApiData(res, 200, 'ads', adsData, 'getlist')
            if (modules && modules.length > 0) {
                return renderData.data;
            } else {
                res.send(renderData);
            }
        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))

        }
    }

    async getOneAd(req, res, next) {
        try {
            let targetId = req.query.id;
            let state = req.query.state, queryObj = { _id: targetId };
            if (state) queryObj.state = state
            const ad = await AdsModel.findOne(queryObj).populate([{
                path: 'items'
            }]).exec();
            let adsData = {
                doc: ad || {}
            }
            let renderAdsData = siteFunc.renderApiData(res, 200, 'ads', adsData)
            res.send(renderAdsData)
        } catch (err) {
            res.send(siteFunc.renderApiErr(req, res, 500, err, 'getlist'))
        }
    }

    async addAds(req, res, next) {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            try {
                checkFormData(req, res, fields);
            } catch (err) {
                console.log(err.message, err);
                res.send(siteFunc.renderApiErr(req, res, 500, err, 'checkform'));
            }
            const adObj = {
                name: fields.name,
                state: fields.state,
                height: fields.height,
                carousel: fields.carousel,
                type: fields.type,
                comments: fields.comments
            }
            let itemIdArr = [], adsItems = fields.items;
            if (adsItems.length > 0) {
                for (let i = 0; i < adsItems.length; i++) {
                    const newAdItem = new AdsItemsModel(adsItems[i]);
                    let newItem = await newAdItem.save();
                    itemIdArr.push(newItem._id);
                }
            }
            adObj.items = itemIdArr;
            const newAds = new AdsModel(adObj);
            try {
                await newAds.save();
                res.send(siteFunc.renderApiData(res, 200, 'ads', { id: newAds._id }, 'save'))
            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'save'));
            }
        })
    }

    async updateAds(req, res, next) {
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
                state: fields.state,
                height: fields.height,
                carousel: fields.carousel,
                type: fields.type,
                comments: fields.comments
            }
            const item_id = fields._id;
            let itemIdArr = [], adsItems = fields.items;
            try {
                if (adsItems.length > 0) {
                    for (let i = 0; i < adsItems.length; i++) {
                        let targetItem = adsItems[i], currentId = '';
                        if (targetItem._id) {
                            currentId = targetItem._id;
                            await AdsItemsModel.findOneAndUpdate({ _id: targetItem._id }, { $set: targetItem });
                        } else {
                            const newAdItem = new AdsItemsModel(targetItem);
                            let newItem = await newAdItem.save();
                            currentId = newItem._id;
                        }
                        itemIdArr.push(currentId);
                    }
                }
                userObj.items = itemIdArr;
                await AdsModel.findOneAndUpdate({ _id: item_id }, { $set: userObj });
                res.send(siteFunc.renderApiData(res, 200, 'ads', {}, 'update'))

            } catch (err) {

                res.send(siteFunc.renderApiErr(req, res, 500, err, 'update'));
            }
        })

    }

    async delAds(req, res, next) {
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
            for (let i = 0; i < targetIds.length; i++) {
                let currentId = targetIds[i];
                let targetAd = await AdsModel.findOne({ _id: currentId });
                await AdsItemsModel.remove({ '_id': { $in: targetAd.items } });
                await AdsModel.remove({ _id: currentId });
            }
            res.send(siteFunc.renderApiData(res, 200, 'ads', {}, 'delete'))

        } catch (err) {

            res.send(siteFunc.renderApiErr(req, res, 500, err, 'delete'));
        }
    }

}

module.exports = new Ads();