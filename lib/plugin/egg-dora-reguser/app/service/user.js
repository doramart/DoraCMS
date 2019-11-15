/*
 * @Author: doramart 
 * @Date: 2019-06-24 13:20:49 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-27 09:23:44
 */

'use strict';
const Service = require('egg').Service;
const path = require('path')
const _ = require('lodash')

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
    _pull
} = require(path.join(process.cwd(), 'app/service/general'));


class UserService extends Service {

    async find(payload = {}, {
        query = {},
        searchKeys = [],
        populate = [],
        files = null
    } = {}) {

        let listdata = _list(this.ctx.model.User, payload, {
            query: _.assign({
                state: '1'
            }, query),
            searchKeys: !_.isEmpty(searchKeys) ? searchKeys : ['userName', 'phoneNum', 'email'],
            populate: !_.isEmpty(populate) ? populate : [{
                path: 'category',
                select: 'name _id'
            }],
            files: files ? files : '-password',
        });
        return listdata;

    }

    async findRecomend(payload) {
        const {
            current,
            pageSize,
            searchkey,
            area, // 查询来源
            category,
            sortby,
            follow
        } = payload
        let res = [];
        let queryObj = {};
        let count = 0;
        let skip = ((Number(current)) - 1) * Number(pageSize || 10);


        let sortObj = {
            date: -1
        }

        if (sortby == '1') {
            sortObj.followers = 1;
        }

        let populateArr = [{
            path: 'category',
            select: 'name _id'
        }];

        if (searchkey) {
            let reKey = new RegExp(searchkey, 'i');
            if (area == '1') {
                queryObj.$or = [{
                    userName: {
                        $regex: reKey
                    }
                }, {
                    phoneNum: {
                        $regex: reKey
                    }
                }, {
                    email: {
                        $regex: reKey
                    }
                }];
            } else {
                queryObj.userName = {
                    $regex: reKey
                }
            }
        }

        if (category) {
            queryObj.category = category;
        }

        if (group) {
            queryObj.group = group;
        }

        // console.log('--ctx.session.user---', ctx.session.user);
        if (follow) {
            if (follow == '1' && ctx.session.user) {
                queryObj._id = {
                    $in: ctx.session.user.watchers
                };
                populateArr = [{
                    path: 'category',
                    select: 'name _id'
                }];
            }
        }

        res = await User.find(queryObj).skip(skip).limit(Number(pageSize)).sort(sortObj).popupate(populateArr).exec()
        count = await User.count(queryObj).exec()

        return {

            docs: res,
            pageInfo: {
                totalItems: count,
                pageSize: Number(pageSize),
                current: Number(current),
                searchkey
            }

        }

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

    async item(res, {
        query = {},
        populate = [],
        files = null
    } = {}) {
        return _item(res, this.ctx.model.User, {
            query: _.assign({
                state: '1'
            }, query),
            populate: !_.isEmpty(populate) ? populate : [{
                path: 'category',
                select: 'name _id'
            }],
            files: files ? files : '-password',
        })
    }

}

module.exports = UserService;