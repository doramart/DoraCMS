/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-26 15:57:07
 */


'use strict';

const {
    AdminResource
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


class AdminResourceService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(AdminResource, payload, {
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
        return _count(AdminResource, params);
    }

    async create(payload) {
        return _create(AdminResource, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, AdminResource, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, AdminResource, values);
    }

    async update(res, _id, payload) {
        return _update(res, AdminResource, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, AdminResource, params)
    }


}

module.exports = new AdminResourceService();