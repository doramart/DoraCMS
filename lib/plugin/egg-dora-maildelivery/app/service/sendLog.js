/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-02-11 11:31:18
 */

'use strict';
const Service = require('egg').Service;
const path = require('path')

// general是一个公共库，可用可不用
const {
    _list,
    _item,
    _count,
    _create,
    _update,
    _removes,
    _removeAll
} = require(path.join(process.cwd(), 'app/service/general'));


class SendLogService extends Service {

    async find(payload, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null,
        sort = {}
    } = {}) {

        let listdata = _list(this.ctx.model.SendLog, payload, {
            query: query,
            searchKeys: searchKeys,
            populate: populate,
            files,
            sort
        });
        return listdata;

    }


    async count(params = {}) {
        return _count(this.ctx.model.SendLog, params);
    }

    async create(payload) {
        return _create(this.ctx.model.SendLog, payload);
    }

    async removes(res, values, key = '_id') {
        return _removes(res, this.ctx.model.SendLog, values, key);
    }

    async removeAll() {
        return _removeAll(this.ctx.model.SendLog);
    }

    async update(res, _id, payload) {
        return _update(res, this.ctx.model.SendLog, _id, payload);
    }

    async item(res, params = {}) {
        return _item(res, this.ctx.model.SendLog, params)
    }


}

module.exports = SendLogService;