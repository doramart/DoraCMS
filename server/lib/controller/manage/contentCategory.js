/*
 * @Author: doramart 
 * @Date: 2019-06-20 18:55:40 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 11:08:45
 */


const {
    contentCategoryService
} = require('@service');

const {
    validateForm
} = require('../validate/index');
const xss = require("xss");
const _ = require('lodash');


exports.list = async (req, res, next) => {
    try {

        let payload = req.query;
        // let {
        //     parentId,
        //     enable,
        //     type
        // } = payload;

        let queryObj = {};

        let categoryParams = _.assign({}, payload, {
            isPaging: '0'
        })
        let contentCategoryList = await contentCategoryService.find(categoryParams, {
            searchKeys: ['name'],
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

exports.create = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
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

        let errInfo = validateForm(res, 'contentCategory', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        let cateObj = await contentCategoryService.create(formObj);
        // 更新sortPath defaultUrl
        let newQuery = {};
        if (fields.parentId == '0') {
            newQuery.sortPath = '0,' + cateObj._id
        } else {
            let parentObj = await contentCategoryService.item(res, {
                query: {
                    '_id': fields.parentId
                },
                files: 'sortPath defaultUrl'
            })
            newQuery.sortPath = parentObj.sortPath + "," + cateObj._id;
            newQuery.defaultUrl = parentObj.defaultUrl + '/' + fields.defaultUrl
        }
        await contentCategoryService.update(res, cateObj._id, newQuery);

        renderSuccess(req, res);

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

exports.alllist = async (req, res) => {
    return await contentCategoryService.find({
        isPaging: '0'
    })
}


exports.update = async (req, res, next) => {

    try {
        let fields = req.body || {};
        const formObj = {
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

        let errInfo = validateForm(res, 'contentCategory', formObj)

        if (!_.isEmpty(errInfo)) {
            throw new Error(errInfo.errors[0].message)
        }

        await contentCategoryService.update(res, fields._id, formObj);

        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });

    }

}


exports.removes = async (req, res, next) => {
    try {
        let targetIds = req.query.ids;
        await contentCategoryService.removes(res, targetIds);
        renderSuccess(req, res);

    } catch (err) {

        renderFail(req, res, {
            message: err
        });
    }
}