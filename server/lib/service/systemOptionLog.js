/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-13 01:32:55
 */


'use strict';

const {
    SystemOptionLog
} = require('../models/index');
const _ = require('lodash')

const {
    _list,
    _item,
    _count,
    _create,
    _update,
    _removes,
    _safeDelete,
    _removeAll
} = require('./general');


class SystemOptionLogService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(SystemOptionLog, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(SystemOptionLog, params);
    }

    async create(payload) {
        return _create(SystemOptionLog, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, SystemOptionLog, values, key);
    }

    async removeAll() {
        return _removeAll(SystemOptionLog);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, SystemOptionLog, values);
    }

    async update(res, _id, payload) {
        return _update(res, SystemOptionLog, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, SystemOptionLog, params)
    }


}

module.exports = new SystemOptionLogService();