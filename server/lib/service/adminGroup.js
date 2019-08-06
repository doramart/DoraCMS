/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-26 11:00:11
 */


'use strict';

const {
    AdminGroup
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


class AdminGroupService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(AdminGroup, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(AdminGroup, params);
    }

    async create(payload) {
        return _create(AdminGroup, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, AdminGroup, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, AdminGroup, values);
    }

    async update(res, _id, payload) {
        return _update(res, AdminGroup, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, AdminGroup, params)
    }


}

module.exports = new AdminGroupService();