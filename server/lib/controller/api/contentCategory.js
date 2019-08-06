/*
 * @Author: doramart 
 * @Date: 2019-07-07 13:07:27 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-11 18:16:58
 */



const xss = require("xss");
const shortid = require('shortid');
const validator = require('validator');

const {
    cache,
    siteFunc,
    validatorUtil
} = require('@utils');
const settings = require('@configs/settings');
const _ = require('lodash')

const {
    contentCategoryService,
    contentService
} = require('@service');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;


        let queryObj = {
            enable: true
        };

        let contentCategoryList = await contentCategoryService.find({
            isPaging: '0'
        }, {
            query: queryObj
        });

        renderSuccess(req, res, {
            data: contentCategoryList
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}

exports.getOne = async (req, res, next) => {
    try {
        let _id = req.query.id;

        let targetItem = await contentCategoryService.item(res, {
            query: {
                _id: _id
            }
        });

        renderSuccess(req, res, {
            data: targetItem
        });

    } catch (err) {
        renderFail(req, res, {
            message: err
        });
    }

}

// 根据类别id或者文档id查询子类
exports.getCurrentCategoriesById = async (req, res, next) => {
    try {
        let contentId = req.query.contentId;
        let typeId = req.query.typeId;
        let cates = [],
            parents = [];

        let contentObj = await contentService.item(res, {
            query: {
                '_id': contentId
            },
            files: 'categories',
            populate: [{
                path: 'categories',
                select: 'name _id'
            }]
        })

        if (typeId || !_.isEmpty(contentObj)) {
            let fullNav = await contentCategoryService.find({
                isPaging: '0'
            });
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

        renderSuccess(req, res, {
            data: {
                parents,
                cates
            }
        });

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }
}