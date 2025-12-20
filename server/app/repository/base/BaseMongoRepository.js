/**
 * MongoDB 专用基础 Repository 类
 * 继承 BaseStandardRepository，提供 MongoDB 特定的通用功能
 * 整合 general.js 的所有方法，使用标准化参数和钩子方法
 */
'use strict';

const BaseStandardRepository = require('./BaseStandardRepository');
// const shortid = require('shortid');
const _ = require('lodash');

class BaseMongoRepository extends BaseStandardRepository {
  constructor(ctx, entityName) {
    super(ctx, entityName);

    // 设置数据库类型为 MongoDB
    this.databaseType = 'mongodb';
  }

  // ===== 🍃 MongoDB 特定的通用方法实现 =====

  /**
   * 构建数据库特定的搜索条件 - MongoDB版本
   * @param {Object} searchVariants 搜索变体
   * @param {Array} searchKeys 搜索字段
   * @param {Object} options 搜索选项
   * @return {Object} MongoDB搜索条件
   * @protected
   */
  _buildDatabaseSpecificSearchConditions(searchVariants, searchKeys, options = {}) {
    const conditions = [];
    const { original, words, phrases, combinations } = searchVariants;

    // 定义字段权重（标题字段权重更高）
    const fieldPriority = {
      title: 3, // 最高优先级
      stitle: 2, // 副标题
      description: 2, // 标准描述字段
      discription: 1, // 兼容历史拼写错误
      comments: 1, // 评论
      keywords: 2, // 关键词字段
    };

    searchKeys.forEach(field => {
      const priority = fieldPriority[field] || 1;

      // 1. 完整匹配（最高权重）
      if (original) {
        conditions.push({
          [field]: { $regex: this._escapeRegex(original), $options: 'i' },
        });

        // 精确匹配（针对短关键词）- 使用词边界
        if (original.length <= 10) {
          conditions.push({
            [field]: { $regex: `\\b${this._escapeRegex(original)}\\b`, $options: 'i' },
          });
        }
      }

      // 2. 短语匹配（高权重）
      phrases.forEach(phrase => {
        conditions.push({
          [field]: { $regex: this._escapeRegex(phrase), $options: 'i' },
        });
      });

      // 3. 单词匹配（中等权重）
      words.forEach(word => {
        if (word.length >= 2) {
          // 保留长度>=2的词（包括常见的英文短词如 js, ui, go 等）
          conditions.push({
            [field]: { $regex: this._escapeRegex(word), $options: 'i' },
          });
        }
      });

      // 4. 技术变体匹配（中等权重）
      combinations.forEach(variant => {
        conditions.push({
          [field]: { $regex: this._escapeRegex(variant), $options: 'i' },
        });
      });

      // 5. 高优先级字段的开头匹配
      if (priority >= 2 && original) {
        conditions.push({
          [field]: { $regex: `^${this._escapeRegex(original)}`, $options: 'i' },
        });
      }
    });

    return conditions.length > 0 ? { $or: conditions } : {};
  }

  /**
   * 检查搜索条件是否为空 - MongoDB特定实现
   * @param {Object} conditions 搜索条件
   * @return {Boolean} 是否为空
   * @protected
   */
  _isEmptySearchCondition(conditions) {
    if (!conditions || typeof conditions !== 'object') {
      return true;
    }

    // 检查 MongoDB $or 结构
    if (conditions.$or) {
      return !Array.isArray(conditions.$or) || conditions.$or.length === 0;
    }

    return Object.keys(conditions).length === 0;
  }

  /**
   * 转义正则表达式特殊字符
   * @param {String} text 需要转义的文本
   * @return {String} 转义后的文本
   * @private
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 将标准排序格式转换为 MongoDB 格式
   * @param {Array} sortArray 标准排序数组 [{ field: 'name', order: 'asc' }]
   * @return {Object} MongoDB 排序对象 { name: 1, createdAt: -1 }
   * @protected
   */
  _transformSortToMongo(sortArray) {
    if (!Array.isArray(sortArray)) {
      return {};
    }

    const mongoSort = {};
    sortArray.forEach(config => {
      if (config.field && config.order) {
        mongoSort[config.field] = config.order === 'asc' ? 1 : -1;
      }
    });
    return mongoSort;
  }

  /**
   * 根据状态值获取状态文本
   * @param {String|Number} status 状态值
   * @return {String} 状态文本
   * @protected
   */
  _getStatusText(status) {
    const statusMap = this._getStatusMapping();
    return statusMap[String(status)] || '未知状态';
  }

  /**
   * 数据预处理（创建前）- MongoDB增强版
   * @param {Object} data 原始数据
   * @return {Object} 处理后的数据
   * @protected
   */
  _preprocessDataForCreate(data) {
    const processedData = { ...data };

    // 设置通用时间戳
    processedData.createdAt = new Date();
    processedData.updatedAt = new Date();

    // 设置默认状态（如果没有设置的话）
    if (processedData.status === undefined) {
      processedData.status = '1';
    }

    // 调用子类的自定义处理
    return this._customPreprocessForCreate(processedData);
  }

  /**
   * 数据预处理（更新前）- MongoDB增强版
   * @param {Object} data 原始数据
   * @return {Object} 处理后的数据
   * @protected
   */
  _preprocessDataForUpdate(data) {
    const processedData = { ...data };

    // 设置通用时间戳
    processedData.updatedAt = new Date();

    // 移除不应更新的字段
    delete processedData._id;
    delete processedData.createdAt;

    // 调用子类的自定义处理
    return this._customPreprocessForUpdate(processedData);
  }

  /**
   * 数据后处理（查询后）- MongoDB增强版
   * @param {*} data 查询结果
   * @param {Object} options 查询选项（包含 fields 等信息）
   * @return {*} 处理后的数据
   * @protected
   */
  _postprocessData(data, options = {}) {
    if (!data) return null;

    // 处理单个对象
    if (data.toObject) {
      return this._processDataItem(data.toObject(), options);
    }

    // 处理数组
    if (Array.isArray(data)) {
      return data.map(item => this._processDataItem(item, options));
    }

    // 处理普通对象
    return this._processDataItem(data, options);
  }

  /**
   * 处理单个数据项
   * @param {Object} item 数据项
   * @param {Object} options 查询选项（包含 fields 等信息）
   * @return {Object} 处理后的数据项
   * @protected
   */
  _processDataItem(item, options = {}) {
    if (!item) return null;

    // 使用transformer进行时间字段格式化
    const processedItem = this.transformer.formatTimeFields(item, ['createdAt', 'updatedAt']);

    // 处理状态文本
    if (processedItem.status !== undefined) {
      processedItem.statusText = this._getStatusText(processedItem.status);
    }

    // 调用子类的自定义处理
    return this._customProcessDataItem(processedItem, options);
  }

  // ===== 🔄 从 general.js 迁移的核心 CRUD 方法 =====

  /**
   * MongoDB通用列表查询（来自 general._list）
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   * @protected
   */
  async _mongoList(payload, options = {}) {
    let { current, pageSize, searchkey, keyword, isPaging, skip, lean = '1' } = payload;

    // 🔥 支持 keyword 和 searchkey 参数（兼容两种命名方式）
    const finalSearchKey = searchkey || keyword;

    // 标准化参数
    const standardParams = this._standardizeParams(payload, options);

    let docs = [];
    let count = 0;
    let query = standardParams.query || {};

    // 参数处理
    current = current || 1;
    pageSize = Number(pageSize) || 10;
    isPaging = isPaging !== '0';
    lean = lean === '1';
    const skipNum = skip ? skip : (Number(current) - 1) * Number(pageSize);

    // 排序处理
    const sort =
      Object.keys(standardParams.sort).length > 0
        ? standardParams.sort
        : this._transformSortToMongo(this._getDefaultSort());

    // 关联查询处理
    const populate = standardParams.populate.length > 0 ? standardParams.populate : this._getDefaultPopulate();

    // 搜索条件处理
    if (finalSearchKey) {
      const searchCondition = this._buildSearchCondition(
        finalSearchKey,
        options.searchKeys || this._getDefaultSearchKeys()
      );
      query = this._mergeQueryConditions(query, searchCondition);
    }

    // 执行查询
    if (isPaging) {
      docs = !lean
        ? await this.model
            .find(query, standardParams.files)
            .skip(skipNum)
            .limit(Number(pageSize))
            .sort(sort)
            .populate(populate)
            .exec()
        : await this.model
            .find(query, standardParams.files)
            .skip(skipNum)
            .limit(Number(pageSize))
            .sort(sort)
            .populate(populate)
            .lean()
            .exec();
    } else {
      if (payload.pageSize > 0) {
        docs = !lean
          ? await this.model
              .find(query, standardParams.files)
              .skip(skipNum)
              .limit(pageSize)
              .sort(sort)
              .populate(populate)
              .exec()
          : await this.model
              .find(query, standardParams.files)
              .skip(skipNum)
              .limit(pageSize)
              .sort(sort)
              .populate(populate)
              .lean()
              .exec();
      } else {
        docs = !lean
          ? await this.model.find(query, standardParams.files).skip(skipNum).sort(sort).populate(populate).exec()
          : await this.model
              .find(query, standardParams.files)
              .skip(skipNum)
              .sort(sort)
              .populate(populate)
              .lean()
              .exec();
      }
    }

    count = await this.model.countDocuments(query).exec();

    // 当使用 lean 查询时，格式化数据
    if (lean && docs) {
      docs = this._postprocessData(docs, options); // 🔥 传递 options 确保 includeSecret 等选项生效
    }

    if (isPaging) {
      const pageInfoParams = {
        totalItems: count,
        pageSize: Number(pageSize),
        current: Number(current),
        searchkey: finalSearchKey || '',
        totalPage: Math.ceil(count / Number(pageSize)),
      };
      for (const querykey in query) {
        if (query.hasOwnProperty(querykey)) {
          const queryValue = query[querykey];
          if (typeof queryValue !== 'object') {
            _.assign(pageInfoParams, {
              [querykey]: queryValue || '',
            });
          }
        }
      }
      return {
        docs,
        pageInfo: pageInfoParams,
        count,
      };
    }
    return docs;
  }

  /**
   * MongoDB通用单条查询（来自 general._item）
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   * @protected
   */
  async _mongoItem(options = {}) {
    const { files = null, query = {}, populate = [] } = options;

    if (query._id && !this.ctx.validateId(query._id)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    const result = await this.model.findOne(query, files).populate(populate).lean().exec();

    // 格式化数据
    if (result) {
      return this._postprocessData(result, options);
    }

    return result;
  }

  /**
   * MongoDB通用计数（来自 general._count）
   * @param {Object} query 查询条件
   * @return {Promise<Number>} 记录数量
   * @protected
   */
  async _mongoCount(query = {}) {
    return await this.model.countDocuments(query);
  }

  /**
   * MongoDB通用创建（来自 general._create）
   * @param {Object} payload 创建数据
   * @return {Promise<Object>} 创建的记录
   * @protected
   */
  async _mongoCreate(payload) {
    const { _id, ...otherPayload } = payload;
    const processedData = this._preprocessDataForCreate(otherPayload);
    const result = await this.model.create(processedData);
    return this._postprocessData(result);
  }

  /**
   * MongoDB通用更新（来自 general._update）
   * @param {String} _id 记录ID
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新后的记录
   * @protected
   */
  async _mongoUpdate(_id, data, query = {}) {
    if (_id) {
      query = _.assign({}, query, { _id });
    } else {
      if (_.isEmpty(query)) {
        throw new Error(this.ctx.__('validation.errorParams'));
      }
    }

    const user = await this._mongoItem({ query });

    if (_.isEmpty(user)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    const processedData = this._preprocessDataForUpdate(data);
    const result = await this.model.findOneAndUpdate(query, { $set: processedData }, { new: true });
    return this._postprocessData(result);
  }

  /**
   * MongoDB通用删除（来自 general._removes）
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   * @protected
   */
  async _mongoRemoves(ids, key = '_id') {
    if (!this.ctx.validateId(ids)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    this.ctx.logger.warn(
      this._addActionUserInfo({
        ids,
        key,
      })
    );
    const targetKey = key === 'id' ? '_id' : key;
    return await this.model.deleteMany({
      [targetKey]: { $in: Array.isArray(ids) ? ids : [ids] },
    });
  }

  /**
   * MongoDB通用软删除（来自 general._safeDelete）
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   * @protected
   */
  async _mongoSafeDelete(ids, updateObj = { status: '0' }) {
    if (!this.ctx.validateId(ids)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    const idArray = Array.isArray(ids) ? ids : ids.split(',');

    return await this.model.updateMany({ _id: { $in: idArray } }, { $set: updateObj });
  }

  /**
   * MongoDB批量更新（来自 general._updateMany）
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async _mongoUpdateMany(ids = '', data, query = {}) {
    if (_.isEmpty(ids) && _.isEmpty(query)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    if (!_.isEmpty(ids)) {
      if (!this.ctx.validateId(ids)) {
        throw new Error(this.ctx.__('validation.errorParams'));
      }
      const idArray = Array.isArray(ids) ? ids : ids.split(',');
      query = _.assign({}, query, {
        _id: { $in: idArray },
      });
    }

    const processedData = this._preprocessDataForUpdate(data);
    return await this.model.updateMany(query, { $set: processedData });
  }

  /**
   * MongoDB数组字段添加（来自 general._addToSet）
   * @param {String} id 记录ID
   * @param {Object} data 添加的数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async _mongoAddToSet(id, data, query = {}) {
    if (_.isEmpty(id) && _.isEmpty(query)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    if (!_.isEmpty(id)) {
      query = _.assign({}, query, { _id: id });
    }

    return await this.model.updateMany(query, { $addToSet: data });
  }

  /**
   * MongoDB数组字段删除（来自 general._pull）
   * @param {String} id 记录ID
   * @param {Object} data 删除的数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async _mongoPull(id, data, query = {}) {
    if (_.isEmpty(id) && _.isEmpty(query)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    if (!_.isEmpty(id)) {
      query = _.assign({}, query, { _id: id });
    }

    return await this.model.updateMany(query, { $pull: data });
  }

  /**
   * MongoDB数值增加（来自 general._inc）
   * @param {String} id 记录ID
   * @param {Object} data 增加的数值
   * @param {Object} options 选项
   * @param options.query
   * @return {Promise<Object>} 更新结果
   * @protected
   */
  async _mongoInc(id, data, { query = {} } = {}) {
    if (_.isEmpty(id) && _.isEmpty(query)) {
      throw new Error(this.ctx.__('validation.errorParams'));
    }

    if (!_.isEmpty(id)) {
      query = _.assign({}, { _id: id }, query);
    }

    return await this.model.updateMany(query, { $inc: data });
  }

  // ===== 🎯 增强版 CRUD 接口（使用标准化参数） =====

  /**
   * 查找多条记录
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    try {
      // 使用MongoDB专用的列表查询
      const result = await this._mongoList(payload, options);

      // 处理结果
      const processedResult = this._processResult(result, payload, options);

      // 记录操作日志
      this._logOperation('find', { payload, options }, processedResult);

      return processedResult;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 查找单条记录
   * @param {Object} params 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(params = {}, options = {}) {
    try {
      // 标准化参数 - 修复：正确传递查询条件作为filters
      const standardParams = this._standardizeParams(
        {}, // 空的 payload，因为findOne不需要分页
        {
          filters: params, // 将查询参数作为filters传入
          populate: options.populate || this._getDefaultPopulate(),
          fields: options.fields || options.files,
          pagination: { isPaging: false },
        }
      );

      // 设置默认值
      const populate = standardParams.populate.length > 0 ? standardParams.populate : this._getDefaultPopulate();

      // 🔥 处理搜索条件 - 支持 searchkey 和 keyword 参数 (MongoDB findOne)
      let finalQuery = standardParams.query;
      if ((params.searchkey || params.keyword) && (options.searchKeys || this._getDefaultSearchKeys().length > 0)) {
        const searchKey = params.searchkey || params.keyword;
        const searchKeys = options.searchKeys || this._getDefaultSearchKeys();
        const searchCondition = this._buildSearchCondition(searchKey, searchKeys);

        if (!this._isEmptyObject(searchCondition)) {
          finalQuery = this._mergeQueryConditions(standardParams.query, searchCondition);
        }
      }

      // 使用MongoDB专用的单条查询
      const result = await this._mongoItem({
        query: finalQuery,
        files: standardParams.files,
        populate,
        ...options, // 🔥 传递完整的 options，确保 includeSecret 等选项能传递到 _customProcessDataItem
      });

      // 记录操作日志
      this._logOperation('findOne', params, result);

      return result;
    } catch (error) {
      this._handleError(error, 'findOne', params);
    }
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findById(id, options = {}) {
    try {
      const query = { _id: id };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findById', { id, options });
    }
  }

  /**
   * 统计记录数量
   * @param {Object} query 查询条件
   * @return {Promise<Number>} 记录数量
   */
  async count(query = {}) {
    try {
      // 标准化查询条件
      const standardParams = this._standardizeParams({}, { filters: query });

      // 执行统计
      const result = await this._mongoCount(standardParams.query);

      // 记录操作日志
      this._logOperation('count', query, result);

      return result;
    } catch (error) {
      this._handleError(error, 'count', query);
    }
  }

  /**
   * 创建记录
   * @param {Object} data 要创建的数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      // 验证数据
      const validation = this._validateData(data, 'create');
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 使用MongoDB专用的创建方法
      const result = await this._mongoCreate(data);

      // 记录操作日志
      this._logOperation('create', data, result);

      return result;
    } catch (error) {
      this._handleError(error, 'create', data);
    }
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    try {
      // 验证数据
      const validation = this._validateData(data, 'update');
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 使用MongoDB专用的更新方法
      const result = await this._mongoUpdate(id, data);

      // 记录操作日志
      this._logOperation('update', { id, data }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'update', { id, data });
    }
  }

  /**
   * 删除记录
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {String} key 主键字段名，默认为 '_id'
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = '_id') {
    try {
      // 使用MongoDB专用的删除方法
      const result = await this._mongoRemoves(ids, key);

      // 记录操作日志
      this._logOperation('remove', { ids, key }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'remove', { ids, key });
    }
  }

  /**
   * 软删除记录（标记删除）
   * @param {String|Array} ids 要删除的记录ID或ID数组
   * @param {Object} updateObj 更新对象，默认 { status: '0' }
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: '0' }) {
    try {
      // 使用MongoDB专用的软删除方法
      const result = await this._mongoSafeDelete(ids, updateObj);

      // 记录操作日志
      this._logOperation('safeDelete', { ids, updateObj }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'safeDelete', { ids, updateObj });
    }
  }

  // ===== 🔧 辅助方法 =====

  /**
   * 添加操作用户信息（来自 general.js）
   * @param {Object} params 参数
   * @return {String} 用户信息字符串
   * @private
   */
  _addActionUserInfo(params = {}) {
    let infoStr = '';

    if (!_.isEmpty(this.ctx.session.adminUserInfo)) {
      infoStr += 'actionUser: ' + JSON.stringify(this.ctx.session.adminUserInfo) + ',';
    }

    if (!_.isEmpty(params)) {
      infoStr += 'actionParams: ' + JSON.stringify(params) + ',';
    }

    return infoStr;
  }

  /**
   * 判断是否应该包含某个字段
   * @param {string} fieldName 字段名
   * @param {Object} options 查询选项
   * @return {boolean} 是否应该包含该字段
   * @protected
   */
  _shouldIncludeField(fieldName, options = {}) {
    const fields = options.files;

    // 如果没有指定 fields，按默认逻辑处理
    if (!fields) {
      return false;
    }

    const fieldArr = fields.split(' ');
    if (Array.isArray(fieldArr)) {
      return fieldArr.includes(fieldName);
    }

    return false;
  }

  /**
   * 检查对象是否为空（支持 Symbol 键）
   * @param {Object} obj 要检查的对象
   * @return {Boolean} 是否为空对象
   * @protected
   */
  _isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && Object.getOwnPropertySymbols(obj).length === 0;
  }
}

module.exports = BaseMongoRepository;
