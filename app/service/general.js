/*
 * @Author: doramart 
 * @Date: 2019-06-21 11:14:02 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-11-19 14:11:30
 */


const shortid = require('shortid');
const _ = require('lodash')

/**
 * 通用列表
 * @method list
 * @param  {[type]} req     [description]
 * @param  {[type]} res     [description]
 * @param  {[type]} Model [description]
 * @param  {[type]} sort    排序
 * @return {[type]}         [description]
 */


exports._list = async (Model, payload, {
    sort = {
        date: -1
    },
    files = null,
    query = {},
    searchKeys = [],
    populate = []
} = {}) => {


    let {
        current,
        pageSize,
        searchkey,
        isPaging,
        skip
    } = payload;

    let docs = [];
    let count = 0;
    query = query || {};
    current = current || 1, pageSize = Number(pageSize) || 10;
    isPaging = isPaging == '0' ? false : true;
    let skipNum = skip ? skip : ((Number(current)) - 1) * Number(pageSize);
    sort = !_.isEmpty(sort) ? sort : {
        date: -1
    };

    if (searchkey) {
        if (searchKeys) {
            if (typeof searchKeys == 'object' && searchKeys.length > 0) {
                let searchStr = [];
                for (let i = 0; i < searchKeys.length; i++) {
                    const keyItem = searchKeys[i];
                    searchStr.push({
                        [keyItem]: {
                            $regex: searchkey
                        }
                    })
                }
                query.$or = searchStr;
            } else {
                query[searchKeys] = {
                    $regex: new RegExp(searchkey, 'i')
                }
            }
        }
    }
    // console.log('--query--', query);
    if (isPaging) {
        docs = await Model.find(query, files).skip(skipNum).limit(Number(pageSize)).sort(sort).populate(populate).exec();
    } else {
        if (payload.pageSize > 0) {
            docs = await Model.find(query, files).skip(skipNum).limit(pageSize).sort(sort).populate(populate).exec();
        } else {
            docs = await Model.find(query, files).skip(skipNum).sort(sort).populate(populate).exec();
        }
    }
    count = await Model.countDocuments(query).exec();

    if (isPaging) {

        let pageInfoParams = {
            totalItems: count,
            pageSize: Number(pageSize),
            current: Number(current),
            searchkey: searchkey || '',
            totalPage: Math.ceil(count / Number(pageSize)),

        };
        for (const querykey in query) {
            if (query.hasOwnProperty(querykey)) {
                const queryValue = query[querykey];
                _.assign(pageInfoParams, {
                    [querykey]: queryValue || ''
                });
            }
        }
        return {

            docs: docs,
            pageInfo: pageInfoParams

        }
    } else {
        return docs;
    }

}


exports._count = async (Model, query = {}) => {
    return await Model.countDocuments(query);
}

exports._create = async (Model, payload) => {
    return await Model.create(payload);
}

/**
 * 通用单个
 * @method item
 * @param  {[type]} res [description]
 * @param  {[type]} Model [description]
 * @return {[type]}         [description]
 */

exports._item = async (ctx, Model, {
    files = null,
    query = {},
    populate = []
} = {}) => {

    if (query._id && !shortid.isValid(query._id)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    return await Model.findOne(query, files).populate(populate).exec();

}

/**
 * 通用删除
 * @method deletes
 * @param  {[type]}   Model [description]
 * @param  {[type]}   ids [description]
 */

exports._removes = async (ctx, Model, ids, key) => {

    if (!checkCurrentId(ids)) {
        throw new Error(ctx.__("validate_error_params"));
    } else {
        ids = ids.split(',');
    }

    return await Model.deleteMany({
        [key]: {
            $in: ids
        }
    })

}

/**
 * 通用删除
 * @method deletes
 * @param  {[type]}   Model [description]
 */

exports._removeAll = async (Model) => {

    return await Model.deleteMany({})

}

/**
 * 通用删除
 * @method deletes
 * @param  {[type]}   Model [description]
 * @param  {[type]}   ids [description]
 */

exports._safeDelete = async (ctx, Model, ids) => {

    if (!checkCurrentId(ids)) {
        throw new Error(ctx.__("validate_error_params"));
    } else {
        ids = ids.split(',');
    }

    return await Model.updateMany({
        _id: {
            $in: ids
        }
    }, {
        $set: {
            state: '0'
        }
    })

}

/**
 * 通用编辑
 * @method update
 * @param  {[type]} Model [description]
 * @param  {[type]} _id     [description]
 * @param  {[type]} data    [description]
 */

exports._update = async (ctx, Model, _id, data, query = {}) => {

    if (_id) {
        query = _.assign({}, query, {
            _id: _id
        });
    } else {
        if (_.isEmpty(query)) {
            throw new Error(ctx.__('validate_error_params'));
        }
    }

    const user = await this._item(ctx, Model, {
        query: query
    })

    if (_.isEmpty(user)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    return await Model.findOneAndUpdate(query, {
        $set: data
    });

}

/**
 * 通用编辑
 * @method update
 * @param  {[type]} Model [description]
 * @param  {[type]} ids     [description]
 * @param  {[type]} data    [description]
 */

exports._updateMany = async (ctx, Model, ids = [], data, query = {}) => {

    if (_.isEmpty(ids) && _.isEmpty(query)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    if (!_.isEmpty(ids)) {
        query = _.assign({}, query, {
            _id: {
                $in: ids
            }
        });
    }

    return await Model.updateMany(query, {
        $set: data
    });

}

/**
 * 通用数组字段添加
 * @method update
 * @param  {[type]} Model [description]
 * @param  {[type]} id     [description]
 * @param  {[type]} data    [description]
 */

exports._addToSet = async (ctx, Model, id, data, query = {}) => {

    if (_.isEmpty(id) && _.isEmpty(query)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    if (!_.isEmpty(id)) {
        query = _.assign({}, query, {
            _id: id
        });
    }

    return await Model.updateMany(query, {
        $addToSet: data
    });

}


/**
 * 通用数组字段删除
 * @method update
 * @param  {[type]} Model [description]
 * @param  {[type]} id     [description]
 * @param  {[type]} data    [description]
 */

exports._pull = async (ctx, Model, id, data, query = {}) => {

    if (_.isEmpty(id) && _.isEmpty(query)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    if (!_.isEmpty(id)) {
        query = _.assign({}, query, {
            _id: id
        });
    }

    return await Model.updateMany(query, {
        $pull: data
    });

}

/**
 * 通用属性加值
 * @method update
 * @param  {[type]} Model [description]
 * @param  {[type]} id     [description]
 * @param  {[type]} data    [description]
 */

exports._inc = async (ctx, Model, id, data, {
    query = {}
} = {}) => {

    if (_.isEmpty(id) && _.isEmpty(query)) {
        throw new Error(ctx.__('validate_error_params'));
    }

    if (!_.isEmpty(id)) {
        query = _.assign({}, query);
    }

    return await Model.updateMany(query, {
        $inc: data
    });

}