/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:23:15
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
  _removes,
  _safeDelete,
  _addToSet,
  _pull,
} = require(path.join(process.cwd(), 'app/service/general'));

class UserService extends Service {
  async find(
    payload = {},
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.User, payload, {
      query: _.assign(
        {
          state: '1',
        },
        query
      ),
      searchKeys: !_.isEmpty(searchKeys)
        ? searchKeys
        : ['userName', 'phoneNum', 'email'],
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'category',
              select: 'name _id',
            },
          ],
      files: files ? files : '-password',
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.User, params);
  }

  async create(payload) {
    return _create(this.ctx.model.User, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.User, values, key);
  }

  async safeDelete(res, values) {
    return _safeDelete(res, this.ctx.model.User, values);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.User, _id, payload);
  }

  async addToSet(res, _id, payload) {
    return _addToSet(res, this.ctx.model.User, _id, payload);
  }

  async pull(res, _id, payload) {
    return _pull(res, this.ctx.model.User, _id, payload);
  }

  async item(res, { query = {}, populate = [], files = null } = {}) {
    return _item(res, this.ctx.model.User, {
      query: _.assign(
        {
          state: '1',
        },
        query
      ),
      populate: !_.isEmpty(populate) ? populate : [],
      files: files ? files : '-password',
    });
  }
}

module.exports = UserService;
