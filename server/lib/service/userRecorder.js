/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-13 01:33:11
 */


'use strict';
const _ = require('lodash')
const {
    UserRecorder
} = require('../models/index');
const {
    _list,
    _item,
    _count,
    _create,
    _update,
    _removes,
    _safeDelete
} = require('./general');


class UserRecorderService {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(UserRecorder, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(UserRecorder, params);
    }

    async create(payload) {
        return _create(UserRecorder, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, UserRecorder, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, UserRecorder, values);
    }

    async update(res, _id, payload) {
        return _update(res, UserRecorder, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, UserRecorder, params)
    }


}

module.exports = new UserRecorderService();