/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-08-14 16:52:04
 */

'use strict';
const Service = require('egg').Service;


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


class AdminGroupService extends Service {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(this.ctx.model.AdminGroup, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(this.ctx.model.AdminGroup, params);
    }

    async create(payload) {
        return _create(this.ctx.model.AdminGroup, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, this.ctx.model.AdminGroup, values, key);
    }

    async safeDelete(res, values) {
        return _safeDelete(res, this.ctx.model.AdminGroup, values);
    }

    async update(res, _id, payload) {
        return _update(res, this.ctx.model.AdminGroup, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, this.ctx.model.AdminGroup, params)
    }


}

module.exports = AdminGroupService;