/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 22:57:49
 */

'use strict';
const Service = require('egg').Service;
const path = require('path');

// general是一个公共库，可用可不用
const {
  _list,
  _item,
  _count,
  _create,
  _update,
  _removes,
  _safeDelete,
} = require(path.join(process.cwd(), 'app/service/general'));

class BackUpDataService extends Service {
  async find(
    payload,
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.BackUpData, payload, {
      query,
      searchKeys,
      populate,
      files,
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.BackUpData, params);
  }

  async create(payload) {
    return _create(this.ctx.model.BackUpData, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.BackUpData, values, key);
  }

  async safeDelete(res, values) {
    return _safeDelete(res, this.ctx.model.BackUpData, values);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.BackUpData, _id, payload);
  }

  async item(res, params = {}) {
    return _item(res, this.ctx.model.BackUpData, params);
  }
}

module.exports = BackUpDataService;
