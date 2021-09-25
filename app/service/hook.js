/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 21:45:49
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
  _removeAll,
} = require('./general');

class HookService extends Service {
  async find(
    payload,
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.Hook, payload, {
      query,
      searchKeys,
      populate,
      files,
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.Hook, params);
  }

  async create(payload) {
    return _create(this.ctx.model.Hook, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.Hook, values, key);
  }

  async removeAll() {
    return _removeAll(this.ctx.model.Hook);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.Hook, _id, payload);
  }

  async item(res, params = {}) {
    return _item(res, this.ctx.model.Hook, params);
  }
}

module.exports = HookService;
