/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2019-10-09 17:14:14
 */

'use strict';
const Service = require('egg').Service;
const path = require('path');
const _ = require('lodash');

// general是一个公共库，可用可不用
const {
  _list,
  _item,
  _count,
  _create,
  _update,
  _updateMany,
  _removes,
  _safeDelete,
} = require(path.join(process.cwd(), 'app/service/general'));

class ContentCategoryService extends Service {
  async find(
    payload,
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.ContentCategory, payload, {
      query,
      searchKeys,
      populate,
      files,
      sort: {
        sortId: 1,
      },
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.ContentCategory, params);
  }

  async create(payload) {
    return _create(this.ctx.model.ContentCategory, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.ContentCategory, values, key);
  }

  async safeDelete(res, values) {
    return _safeDelete(res, this.ctx.model.ContentCategory, values);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.ContentCategory, _id, payload);
  }

  async updateMany(res, ids, payload, params) {
    return _updateMany(
      res,
      this.ctx.model.ContentCategory,
      ids,
      payload,
      params
    );
  }

  async item(res, { query = {}, populate = [], files = null } = {}) {
    return _item(res, this.ctx.model.ContentCategory, {
      files,
      query,
      populate: !_.isEmpty(populate) ? populate : ['contentTemp'],
    });
  }
}

module.exports = ContentCategoryService;
