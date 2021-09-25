/*
 * @Author: doramart
 * @Date: 2019-06-24 13:20:49
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-18 18:11:24
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
  _updateMany,
  _inc,
} = require(path.join(process.cwd(), 'app/service/general'));

class ContentService extends Service {
  async find(
    payload,
    {
      sort = {
        updateDate: -1,
      },
      query = {},
      searchKeys = [],
      populate = [],
      files = null,
    } = {}
  ) {
    if (this.ctx.originalUrl.indexOf('/manage/content/') !== 0) {
      Object.assign(query, {
        draft: {
          $ne: '1',
        },
      });
    }
    const listdata = _list(this.ctx.model.Content, payload, {
      files,
      query,
      searchKeys,
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'author',
              select: 'userName _id id logo',
            },
            {
              path: 'uAuthor',
              select: 'userName name logo _id group',
            },
            {
              path: 'tags',
              select: 'name _id',
            },
            {
              path: 'categories',
              select: 'name _id contentTemp enable defaultUrl',
              populate: {
                path: 'contentTemp',
              },
            },
          ],
      sort,
    });

    return listdata;
  }

  async count(params = {}) {
    return _count(this.ctx.model.Content, params);
  }

  async create(payload) {
    return _create(this.ctx.model.Content, payload);
  }

  async removes(res, values, key = '_id') {
    return _removes(res, this.ctx.model.Content, values, key);
  }

  async safeDelete(res, values, updateObj = {}) {
    return _safeDelete(res, this.ctx.model.Content, values, updateObj);
  }

  async update(res, _id, payload) {
    return _update(res, this.ctx.model.Content, _id, payload);
  }

  async inc(res, _id, payload) {
    return _inc(res, this.ctx.model.Content, _id, payload);
  }

  async updateMany(res, ids, payload) {
    return _updateMany(res, this.ctx.model.Content, ids, payload);
  }

  async item(res, { query = {}, populate = [], files = null } = {}) {
    return _item(res, this.ctx.model.Content, {
      files,
      query,
      populate: !_.isEmpty(populate)
        ? populate
        : [
            {
              path: 'author',
              select: 'userName _id id logo',
            },
            {
              path: 'uAuthor',
              select: 'userName name logo _id group',
            },
            {
              path: 'tags',
              select: 'name _id',
            },
            {
              path: 'categories',
              select: 'name _id contentTemp enable defaultUrl',
              populate: {
                path: 'contentTemp',
              },
            },
          ],
    });
  }

  async aggregateCounts(key, typeId) {
    return this.ctx.model.Content.aggregate([
      {
        $match: {
          [key]: typeId,
        },
      },
      {
        $group: {
          _id: '$_id',
          sum: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: null,
          total_sum: {
            $sum: '$sum',
          },
        },
      },
    ]);
  }

  async getHotTagIds(payload = {}) {
    const { pageSize } = payload;
    return this.ctx.model.Content.aggregate([
      {
        $unwind: '$tags',
      },
      {
        $group: {
          _id: '$tags',
          num_of_tag: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          tags: '$_id',
          num_of_tag: 1,
        },
      },
      {
        $sort: {
          num_of_tag: -1,
        },
      },
      {
        $limit: Number(pageSize) ? Number(pageSize) : 10,
      },
    ]);
  }
}

module.exports = ContentService;
