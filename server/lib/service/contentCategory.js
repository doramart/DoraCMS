/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-24 22:59:24
 */


'use strict';

const {
    ContentCategory
} = require('../models/index');
const _ = require('lodash')
const {
    _list,
    _item,
    _count,
    _create,
    _update,
    _removes,
    _safeDelete
} = require('./general');


class ContentCategoryService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(ContentCategory, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files,
            sort: {
                sortId: 1
            }
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(ContentCategory, params);
    }

    async create(payload) {
        return _create(ContentCategory, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, ContentCategory, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, ContentCategory, values);
    }

    async update(res, _id, payload) {
        return _update(res, ContentCategory, _id, payload);
    }

    async item(res, {
        query = {},
        populate = [],
        files = null
    } = {}) {
        return _item(res, ContentCategory, {
            files: files,
            query: query,
            populate: !_.isEmpty(populate) ? populate : ['contentTemp']
        })
    }


}

module.exports = new ContentCategoryService();