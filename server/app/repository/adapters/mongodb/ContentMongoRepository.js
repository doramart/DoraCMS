/**
 * 标准化的 Content MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 *
 * Content模块特点：
 * - 复杂的关联关系：tags、categories、author、uAuthor
 * - 多种状态管理：草稿、待审核、已发布、已下架
 * - 推荐和置顶机制
 * - 媒体内容处理：图片、视频
 * - 统计功能：点击量、评论数、点赞数
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
// const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
// const _ = require('lodash');

class ContentMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Content');

    // 设置 MongoDB 模型
    this.model = this.app.model.Content;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // 定义关联关系
        author: {
          model: this.app.model.Admin,
          path: 'author',
          select: ['userName', 'name', 'logo', 'id', 'group'],
        },
        uAuthor: {
          model: this.app.model.User,
          path: 'uAuthor',
          select: ['userName', 'name', 'logo', 'id', 'group'],
        },
        categories: {
          model: this.app.model.ContentCategory,
          path: 'categories',
          select: ['name', 'id', 'defaultUrl'],
        },
        tags: {
          model: this.app.model.ContentTag,
          path: 'tags',
          select: ['name', 'id'],
        },
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        path: 'author',
        select: ['userName', 'name', 'logo', 'id', 'group'],
      },
      {
        path: 'uAuthor',
        select: ['userName', 'name', 'logo', 'id', 'group'],
      },
      {
        path: 'categories',
        select: ['name', 'id', 'defaultUrl'],
      },
      {
        path: 'tags',
        select: ['name', 'id'],
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['title', 'stitle', 'discription', 'comments', 'simpleComments'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'roofPlacement', order: 'desc' },
      { field: 'createdAt', order: 'desc' },
    ];
  }

  // ===== 🔥 重写基类方法以处理特殊业务逻辑 =====

  /**
   * 重写find方法，处理categories字段的$eq到$in转换
   * MongoDB中categories是数组字段，需要将$eq转换为$in
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    try {
      // 处理categories字段的特殊逻辑
      if (options.filters && options.filters.categories) {
        options.filters = this._transformCategoriesFilter(options.filters);
      }

      // 调用父类的find方法
      return await super.find(payload, options);
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  /**
   * 重写findOne方法，处理categories字段的$eq到$in转换
   * @param {Object} params 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 查询结果
   */
  async findOne(params = {}, options = {}) {
    try {
      // 处理categories字段的特殊逻辑
      const transformedParams = this._transformCategoriesFilter(params);

      // 调用父类的findOne方法
      return await super.findOne(transformedParams, options);
    } catch (error) {
      this._handleError(error, 'findOne', { params, options });
    }
  }

  /**
   * 重写count方法，处理categories字段的$eq到$in转换
   * @param {Object} query 查询条件
   * @return {Promise<Number>} 记录数量
   */
  async count(query = {}) {
    try {
      // 处理categories字段的特殊逻辑
      const transformedQuery = this._transformCategoriesFilter(query);

      // 调用父类的count方法
      return await super.count(transformedQuery);
    } catch (error) {
      this._handleError(error, 'count', { query });
    }
  }

  /**
   * 转换categories字段的查询条件
   * 将$eq转换为$in，因为MongoDB中categories是数组字段
   * @param {Object} filters 原始过滤条件
   * @return {Object} 转换后的过滤条件
   * @private
   */
  _transformCategoriesFilter(filters) {
    if (!filters || typeof filters !== 'object') {
      return filters;
    }

    const transformedFilters = { ...filters };

    // 处理categories字段的$eq操作符
    if (transformedFilters.categories && transformedFilters.categories.$eq) {
      const categoryId = transformedFilters.categories.$eq;
      // 🔥 关键转换：$eq -> $in，适配MongoDB数组字段查询
      transformedFilters.categories = { $in: [categoryId] };

      console.log(`🔄 [ContentMongoRepository] 转换categories查询: $eq "${categoryId}" -> $in ["${categoryId}"]`);
    }

    return transformedFilters;
  }

  // ===== 🔥 Content 业务特有方法实战模板 =====

  /**
   * 根据作者查找内容
   * @param {String} authorId 作者ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByAuthor(authorId, options = {}) {
    try {
      const filters = {
        author: { $eq: authorId },
        draft: { $ne: '1' },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByAuthor', { authorId, options });
    }
  }

  /**
   * 根据用户作者查找内容
   * @param {String} uAuthorId 用户作者ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByUAuthor(uAuthorId, options = {}) {
    try {
      const filters = {
        uAuthor: { $eq: uAuthorId },
        draft: { $ne: '1' },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByUAuthor', { uAuthorId, options });
    }
  }

  /**
   * 根据分类查找内容
   * @param {String|Array} categoryIds 分类ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByCategories(categoryIds, options = {}) {
    try {
      const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      const filters = {
        categories: { $in: ids },
        state: { $eq: '2' },
        draft: { $ne: '1' },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByCategories', { categoryIds, options });
    }
  }

  /**
   * 根据标签查找内容
   * @param {String|Array} tagIds 标签ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByTags(tagIds, options = {}) {
    try {
      const ids = Array.isArray(tagIds) ? tagIds : [tagIds];
      const filters = {
        tags: { $in: ids },
        state: { $eq: '2' },
        draft: { $ne: '1' },
        ...options.filters,
      };
      return await this.find({}, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByTags', { tagIds, options });
    }
  }

  /**
   * 根据状态查找内容
   * @param {String} state 状态
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByState(state, payload = {}, options = {}) {
    try {
      const filters = {
        state: { $eq: state },
        draft: { $ne: '1' },
        ...options.filters,
      };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByState', { state, payload, options });
    }
  }

  /**
   * 查找推荐内容
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findTopContents(payload = {}, options = {}) {
    try {
      const filters = {
        isTop: { $eq: 1 },
        state: { $eq: '2' },
        draft: { $ne: '1' },
        ...options.filters,
      };
      const sort = options.sort || [
        { field: 'roofPlacement', order: 'desc' },
        { field: 'createdAt', order: 'desc' },
      ];
      return await this.find(payload, { ...options, filters, sort });
    } catch (error) {
      this._handleError(error, 'findTopContents', { payload, options });
    }
  }

  /**
   * 查找置顶内容
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findRoofContents(payload = {}, options = {}) {
    try {
      const filters = {
        roofPlacement: { $eq: '1' },
        state: { $eq: '2' },
        draft: { $ne: '1' },
        ...options.filters,
      };
      const sort = options.sort || [
        { field: 'roofPlacement', order: 'desc' },
        { field: 'createdAt', order: 'desc' },
      ];
      return await this.find(payload, { ...options, filters, sort });
    } catch (error) {
      this._handleError(error, 'findRoofContents', { payload, options });
    }
  }

  /**
   * 查找草稿内容
   * @param {String} authorId 作者ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findDraftContents(authorId, payload = {}, options = {}) {
    try {
      const filters = {
        uAuthor: { $eq: authorId },
        $or: [{ state: { $eq: '0' } }, { draft: { $eq: '1' } }],
        ...options.filters,
      };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findDraftContents', { authorId, payload, options });
    }
  }

  /**
   * 按关键词搜索内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async searchByKeyword(keyword, payload = {}, options = {}) {
    try {
      const searchOptions = {
        ...options,
        searchKeys: options.searchKeys || this._getDefaultSearchKeys(),
        filters: {
          state: { $eq: '2' },
          draft: { $ne: '1' },
          ...options.filters,
        },
      };
      return await this.find({ ...payload, searchkey: keyword }, searchOptions);
    } catch (error) {
      this._handleError(error, 'searchByKeyword', { keyword, payload, options });
    }
  }

  /**
   * 增加字段值（如点击量）
   * @param {String} id 内容ID
   * @param {Object} incData 增加的字段和值
   * @return {Promise<Object>} 更新结果
   */
  async inc(id, incData) {
    try {
      const result = await this.model.updateOne({ _id: id }, { $inc: incData });
      this._logOperation('inc', { id, incData }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'inc', { id, incData });
    }
  }

  /**
   * 批量更新内容状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} state 新状态
   * @param {String} dismissReason 驳回原因
   * @return {Promise<Object>} 更新结果
   */
  async updateContentStatus(contentIds, state, dismissReason = null) {
    try {
      const updateData = { state, updatedAt: new Date() };
      if (dismissReason) {
        updateData.dismissReason = dismissReason;
      }

      const result = await this.model.updateMany({ _id: { $in: contentIds } }, { $set: updateData });

      this._logOperation('updateContentStatus', { contentIds, state, dismissReason }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateContentStatus', { contentIds, state, dismissReason });
    }
  }

  /**
   * 批量设置推荐状态
   * @param {Array} contentIds 内容ID数组
   * @param {Number} isTop 推荐状态
   * @return {Promise<Object>} 更新结果
   */
  async updateTopStatus(contentIds, isTop) {
    try {
      const result = await this.model.updateMany(
        { _id: { $in: contentIds } },
        { $set: { isTop, updatedAt: new Date() } }
      );

      this._logOperation('updateTopStatus', { contentIds, isTop }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateTopStatus', { contentIds, isTop });
    }
  }

  /**
   * 批量设置置顶状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} roofPlacement 置顶状态
   * @return {Promise<Object>} 更新结果
   */
  async updateRoofStatus(contentIds, roofPlacement) {
    try {
      const result = await this.model.updateMany(
        { _id: { $in: contentIds } },
        { $set: { roofPlacement, updatedAt: new Date() } }
      );

      this._logOperation('updateRoofStatus', { contentIds, roofPlacement }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateRoofStatus', { contentIds, roofPlacement });
    }
  }

  /**
   * 聚合统计数量
   * @param {String} key 分组字段
   * @param {String} typeId 字段值
   * @return {Promise<Number>} 统计数量
   */
  async aggregateCounts(key, typeId) {
    try {
      const pipeline = [
        {
          $match: {
            [key]: typeId,
            state: '2',
            draft: { $ne: '1' },
          },
        },
        {
          $count: 'total',
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const count = result.length > 0 ? result[0].total : 0;

      this._logOperation('aggregateCounts', { key, typeId }, count);
      return count;
    } catch (error) {
      this._handleError(error, 'aggregateCounts', { key, typeId });
      return 0;
    }
  }

  /**
   * 获取热门标签统计
   * @param {Object} payload 参数
   * @return {Promise<Array>} 热门标签列表
   */
  async getHotTagStats(payload = {}) {
    try {
      const { limit = 20 } = payload;
      const pipeline = [
        {
          $match: {
            state: '2',
            draft: { $ne: '1' },
            tags: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: '$tags',
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
      ];

      const result = await this.model.aggregate(pipeline);
      this._logOperation('getHotTagStats', { payload }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getHotTagStats', { payload });
      return [];
    }
  }

  /**
   * 获取内容统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计结果
   */
  async getContentStats(filter = {}) {
    try {
      const pipeline = [
        { $match: { ...filter, draft: { $ne: '1' } } },
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, draft: 0, pending: 0, published: 0, offline: 0 };

      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        switch (item._id) {
          case '0':
            stats.draft = count;
            break;
          case '1':
            stats.pending = count;
            break;
          case '2':
            stats.published = count;
            break;
          case '3':
            stats.offline = count;
            break;
        }
      });

      this._logOperation('getContentStats', { filter }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getContentStats', { filter });
      return { total: 0, draft: 0, pending: 0, published: 0, offline: 0 };
    }
  }

  /**
   * 获取作者内容统计
   * @param {String} authorId 作者ID
   * @param {String} authorType 作者类型
   * @return {Promise<Object>} 作者统计信息
   */
  async getAuthorContentStats(authorId, authorType = 'user') {
    try {
      const authorField = authorType === 'admin' ? 'author' : 'uAuthor';
      const filter = { [authorField]: authorId, draft: { $ne: '1' } };

      const stats = await this.getContentStats(filter);
      stats.authorId = authorId;
      stats.authorType = authorType;

      return stats;
    } catch (error) {
      this._handleError(error, 'getAuthorContentStats', { authorId, authorType });
      return { authorId, authorType, total: 0, draft: 0, pending: 0, published: 0, offline: 0 };
    }
  }

  /**
   * 获取分类内容统计
   * @param {String} categoryId 分类ID
   * @return {Promise<Object>} 分类统计信息
   */
  async getCategoryContentStats(categoryId) {
    try {
      const filter = { categories: categoryId };
      const stats = await this.getContentStats(filter);
      stats.categoryId = categoryId;

      return stats;
    } catch (error) {
      this._handleError(error, 'getCategoryContentStats', { categoryId });
      return { categoryId, total: 0, draft: 0, pending: 0, published: 0, offline: 0 };
    }
  }

  /**
   * 获取随机内容
   * @param {Number} limit 数量限制
   * @param {Object} filter 过滤条件
   * @return {Promise<Array>} 随机内容列表
   */
  async getRandomContents(limit = 10, filter = {}) {
    try {
      const pipeline = [
        {
          $match: {
            state: '2',
            draft: { $ne: '1' },
            ...filter,
          },
        },
        { $sample: { size: limit } },
      ];

      const result = await this.model.aggregate(pipeline);
      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('getRandomContents', { limit, filter }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'getRandomContents', { limit, filter });
      return [];
    }
  }

  /**
   * 获取相关内容推荐
   * @param {String} contentId 内容ID
   * @param {Number} limit 推荐数量
   * @return {Promise<Array>} 相关内容列表
   */
  async getRelatedContents(contentId, limit = 5) {
    try {
      // 先获取当前内容的标签和分类
      const currentContent = await this.findById(contentId, {
        fields: ['tags', 'categories'],
      });

      if (!currentContent) {
        return [];
      }

      const matchConditions = [];

      // 基于标签推荐
      if (currentContent.tags && currentContent.tags.length > 0) {
        matchConditions.push({ tags: { $in: currentContent.tags } });
      }

      // 基于分类推荐
      if (currentContent.categories && currentContent.categories.length > 0) {
        matchConditions.push({ categories: { $in: currentContent.categories } });
      }

      if (matchConditions.length === 0) {
        return [];
      }

      const pipeline = [
        {
          $match: {
            _id: { $ne: contentId },
            state: '2',
            draft: { $ne: '1' },
            $or: matchConditions,
          },
        },
        { $sample: { size: limit } },
      ];

      const result = await this.model.aggregate(pipeline);
      const processedResult = result.map(item => this._postprocessData(item));

      this._logOperation('getRelatedContents', { contentId, limit }, processedResult);
      return processedResult;
    } catch (error) {
      this._handleError(error, 'getRelatedContents', { contentId, limit });
      return [];
    }
  }

  /**
   * 内容审核操作
   * @param {String} contentId 内容ID
   * @param {String} action 审核动作 (approve/reject)
   * @param {String} reason 审核原因
   * @param {String} reviewerId 审核人ID
   * @return {Promise<Object>} 审核结果
   */
  async reviewContent(contentId, action, reason = '', reviewerId = '') {
    try {
      const updateData = {
        updatedAt: new Date(),
      };

      if (action === 'approve') {
        updateData.state = '2'; // 审核通过
      } else if (action === 'reject') {
        updateData.state = '3'; // 审核不通过
        updateData.dismissReason = reason;
      }

      if (reviewerId) {
        updateData.reviewer = reviewerId;
      }

      const result = await this.update(contentId, updateData);

      this._logOperation('reviewContent', { contentId, action, reason, reviewerId }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'reviewContent', { contentId, action, reason, reviewerId });
    }
  }

  /**
   * 从回收站恢复内容
   * @param {Array} contentIds 内容ID数组
   * @return {Promise<Object>} 恢复结果
   */
  async restoreFromTrash(contentIds) {
    try {
      const result = await this.model.updateMany(
        { _id: { $in: contentIds } },
        { $set: { draft: '0', updatedAt: new Date() } }
      );

      this._logOperation('restoreFromTrash', { contentIds }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'restoreFromTrash', { contentIds });
    }
  }

  /**
   * 复制内容
   * @param {String} contentId 原内容ID
   * @param {Object} newData 新内容数据
   * @return {Promise<Object>} 新内容
   */
  async duplicateContent(contentId, newData = {}) {
    try {
      const originalContent = await this.findById(contentId);
      if (!originalContent) {
        throw this.exceptions.content.notFound(contentId);
      }

      const duplicateData = {
        ...originalContent,
        title: `${originalContent.title} (副本)`,
        state: '0', // 设为草稿
        isTop: 0, // 取消推荐
        roofPlacement: '0', // 取消置顶
        clickNum: 1, // 重置点击量
        commentNum: 0, // 重置评论数
        likeNum: 0, // 重置点赞数
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newData,
      };

      // 移除原有的ID
      delete duplicateData.id;
      delete duplicateData._id;

      const result = await this.create(duplicateData);

      this._logOperation('duplicateContent', { contentId, newData }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'duplicateContent', { contentId, newData });
    }
  }

  /**
   * 按时间范围统计内容
   * @param {Date} startDate 开始时间
   * @param {Date} endDate 结束时间
   * @param {String} groupBy 分组方式
   * @return {Promise<Array>} 时间统计数据
   */
  async getContentStatsByTime(startDate, endDate, groupBy = 'day') {
    try {
      let groupFormat;
      switch (groupBy) {
        case 'hour':
          groupFormat = '%Y-%m-%d %H';
          break;
        case 'day':
          groupFormat = '%Y-%m-%d';
          break;
        case 'month':
          groupFormat = '%Y-%m';
          break;
        case 'year':
          groupFormat = '%Y';
          break;
        default:
          groupFormat = '%Y-%m-%d';
      }

      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
            draft: { $ne: '1' },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupFormat,
                date: '$createdAt',
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      this._logOperation('getContentStatsByTime', { startDate, endDate, groupBy }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getContentStatsByTime', { startDate, endDate, groupBy });
      return [];
    }
  }

  /**
   * 批量更新多个内容
   * @param {String|Array} ids 内容ID或ID数组
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const updateQuery = {
        _id: { $in: idArray },
        ...query,
      };

      // 🔥 检查是否包含 MongoDB 操作符（如 $inc, $set, $unset）
      const hasMongoOperators = data.$inc || data.$set || data.$unset || data.$push || data.$pull;
      let updateData;

      if (hasMongoOperators) {
        // 如果包含操作符，直接使用，并添加 $set 更新时间
        updateData = {
          ...data,
          $set: {
            ...(data.$set || {}),
            updatedAt: new Date(),
          },
        };
      } else {
        // 如果不包含操作符，使用 $set 包装所有字段
        updateData = {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        };
      }

      const result = await this.model.updateMany(updateQuery, updateData);

      this._logOperation('updateMany', { ids, data, query }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateMany', { ids, data, query });
      return { modifiedCount: 0 };
    }
  }

  // ===== 🔥 基类钩子方法重写 - 用于业务特定逻辑 =====

  /**
   * 重写状态映射（可选，如果状态映射不同）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.CONTENT.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加Content特有的数据处理

    // 添加类型文本
    if (item.type) {
      const typeMap = {
        1: '普通文章',
        2: '专题文章',
      };
      item.typeText = typeMap[item.type] || '未知类型';
    }

    // 确保数组字段的默认值
    item.categories = item.categories || [];
    item.tags = item.tags || [];
    item.keywords = item.keywords || [];
    item.imageArr = item.imageArr || [];
    item.videoArr = item.videoArr || [];

    // 添加虚拟字段
    if (item.title) {
      item.url = `/details/${item.id}.html`;
    }

    // 处理点击量显示
    if (typeof item.clickNum === 'number') {
      if (item.clickNum > 10000) {
        item.clickNumText = `${Math.floor(item.clickNum / 1000) / 10}万`;
      } else {
        item.clickNumText = item.clickNum.toString();
      }
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加Content特有的创建前处理

    // 验证必填字段
    if (!data.title || data.title.trim() === '') {
      throw this.exceptions.content.titleRequired();
    }

    // 验证作者
    if (!data.author && !data.uAuthor) {
      throw this.exceptions.content.authorRequired();
    }

    // 设置默认值
    if (!data.type) data.type = '1';
    if (!data.state) data.state = '0';
    if (!data.draft) data.draft = '0';
    if (!data.isTop) data.isTop = 0;
    if (!data.roofPlacement) data.roofPlacement = '0';
    if (!data.clickNum) data.clickNum = 1;
    if (!data.commentNum) data.commentNum = 0;
    if (!data.likeNum) data.likeNum = 0;

    // 确保数组字段的正确格式
    data.categories = Array.isArray(data.categories) ? data.categories : [];
    data.tags = Array.isArray(data.tags) ? data.tags : [];
    data.keywords = Array.isArray(data.keywords) ? data.keywords : [];
    data.imageArr = Array.isArray(data.imageArr) ? data.imageArr : [];
    data.videoArr = Array.isArray(data.videoArr) ? data.videoArr : [];

    // 设置副标题
    if (!data.stitle && data.title) {
      data.stitle = data.title;
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加Content特有的更新前处理

    // 验证标题（更新时可能为空）
    if (data.title !== undefined && (!data.title || data.title.trim() === '')) {
      throw this.exceptions.content.titleRequired();
    }

    // 确保数组字段的正确格式
    if (data.categories !== undefined) {
      data.categories = Array.isArray(data.categories) ? data.categories : [];
    }
    if (data.tags !== undefined) {
      data.tags = Array.isArray(data.tags) ? data.tags : [];
    }
    if (data.keywords !== undefined) {
      data.keywords = Array.isArray(data.keywords) ? data.keywords : [];
    }
    if (data.imageArr !== undefined) {
      data.imageArr = Array.isArray(data.imageArr) ? data.imageArr : [];
    }
    if (data.videoArr !== undefined) {
      data.videoArr = Array.isArray(data.videoArr) ? data.videoArr : [];
    }

    return data;
  }
}

module.exports = ContentMongoRepository;
