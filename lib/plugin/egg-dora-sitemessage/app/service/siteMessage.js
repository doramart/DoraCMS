/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:26:58
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
  _updateMany,
} = require(path.join(process.cwd(), 'app/service/general'));

class SiteMessageService extends Service {
  async find(
    payload,
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.SiteMessage, payload, {
      query,
      searchKeys,
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'activeUser',
              select: getAuthUserFields('base'),
            },
            {
              path: 'passiveUser',
              select: getAuthUserFields(),
            },
            {
              path: 'content',
              select: 'title _id',
            },
            {
              path: 'message',
              select: 'content _id contentId',
              populate: {
                path: 'contentId',
                select: 'title _id date',
              },
            },
          ],
      files,
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.SiteMessage, params);
  }

  async create(payload) {
    return _create(this.ctx.model.SiteMessage, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.SiteMessage, values, key);
  }

  async safeDelete(res, values) {
    return _safeDelete(res, this.ctx.model.SiteMessage, values);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.SiteMessage, _id, payload);
  }

  async updateMany(res, ids, payload, params) {
    return _updateMany(res, this.ctx.model.SiteMessage, ids, payload, params);
  }

  async item(res, params = {}) {
    return _item(res, this.ctx.model.SiteMessage, params);
  }
}

module.exports = SiteMessageService;
