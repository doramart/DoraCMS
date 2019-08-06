/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-06-24 13:27:31
 */


'use strict';

const {
    SystemConfig
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


class SystemConfigService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(SystemConfig, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(SystemConfig, params);
    }

    async create(payload) {
        return _create(SystemConfig, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, SystemConfig, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, SystemConfig, values);
    }

    async update(res, _id, payload) {
        return _update(res, SystemConfig, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, SystemConfig, params)
    }


}

module.exports = new SystemConfigService();