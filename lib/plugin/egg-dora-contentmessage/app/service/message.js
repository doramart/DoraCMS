/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 23:07:25
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
} = require(path.join(process.cwd(), 'app/service/general'));

class MessageService extends Service {
  async find(
    payload,
    { query = {}, searchKeys = [], populate = [], files = null } = {}
  ) {
    const listdata = _list(this.ctx.model.Message, payload, {
      query,
      searchKeys,
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'contentId',
              select: 'title stitle _id',
            },
            {
              path: 'author',
              select: 'userName _id enable date logo',
            },
            {
              path: 'replyAuthor',
              select: 'userName _id enable date logo',
            },
            {
              path: 'adminAuthor',
              select: 'userName _id enable date logo',
            },
            {
              path: 'adminReplyAuthor',
              select: 'userName _id enable date logo',
            },
          ],
      files,
    });
    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.Message, params);
  }

  async create(payload) {
    return _create(this.ctx.model.Message, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.Message, values, key);
  }

  async safeDelete(res, values) {
    return _safeDelete(res, this.ctx.model.Message, values);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.Message, _id, payload);
  }

  async item(res, { query = {}, populate = [], files = null } = {}) {
    return _item(res, this.ctx.model.Message, {
      query,
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'contentId',
              select: 'title stitle _id',
            },
            {
              path: 'author',
              select: 'userName _id enable date logo',
            },
            {
              path: 'replyAuthor',
              select: 'userName _id enable date logo',
            },
            {
              path: 'adminAuthor',
              select: 'userName _id enable date logo',
            },
            {
              path: 'adminReplyAuthor',
              select: 'userName _id enable date logo',
            },
          ],
      files,
    });
  }
}

module.exports = MessageService;
