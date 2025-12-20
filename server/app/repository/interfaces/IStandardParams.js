/**
 * 标准化的 Repository 参数接口定义
 * 参考 Strapi 设计，统一 MongoDB 和 MariaDB 的参数格式
 */
'use strict';

/**
 * 标准查询参数接口
 * @typedef {Object} StandardQueryParams
 * @property {Object} filters - 查询条件（统一格式）
 * @property {Array} populate - 关联查询配置
 * @property {Array} sort - 排序配置
 * @property {Array} fields - 字段选择
 * @property {Object} pagination - 分页配置
 */

/**
 * 过滤条件接口
 * @typedef {Object} FilterCondition
 * @property {*} $eq - 等于
 * @property {*} $ne - 不等于
 * @property {Array} $in - 包含于数组
 * @property {Array} $nin - 不包含于数组
 * @property {*} $gt - 大于
 * @property {*} $gte - 大于等于
 * @property {*} $lt - 小于
 * @property {*} $lte - 小于等于
 * @property {string} $regex - 正则匹配
 * @property {boolean} $exists - 字段存在性
 * @property {Array} $or - 或条件
 * @property {Array} $and - 且条件
 */

/**
 * 关联查询配置接口
 * @typedef {Object} PopulateConfig
 * @property {string} path - 关联字段路径
 * @property {Array<string>} select - 要选择的字段
 * @property {Object} filters - 关联数据的过滤条件
 * @property {Array} populate - 嵌套关联查询
 * @property {Object} sort - 关联数据排序
 * @property {number} limit - 关联数据限制数量
 */

/**
 * 排序配置接口
 * @typedef {Object} SortConfig
 * @property {string} field - 排序字段
 * @property {'asc'|'desc'} order - 排序方向
 */

/**
 * 分页配置接口
 * @typedef {Object} PaginationConfig
 * @property {number} page - 页码（从1开始）
 * @property {number} pageSize - 每页数量
 * @property {number} limit - 限制数量
 * @property {number} offset - 偏移量
 */

/**
 * 标准参数验证器
 */
class StandardParamsValidator {
  /**
   * 验证查询参数
   * @param {Object} params 原始参数
   * @return {StandardQueryParams} 验证后的标准参数
   */
  validate(params = {}) {
    const standardParams = {
      filters: this._validateFilters(params.filters || params.query || {}),
      populate: this._validatePopulate(params.populate || []),
      sort: this._validateSort(params.sort || {}),
      fields: this._validateFields(params.fields || params.files),
      pagination: this._validatePagination(params.pagination || {}),
    };

    return standardParams;
  }

  /**
   * 验证过滤条件
   * @param {Object} filters 过滤条件
   * @return {Object} 标准化的过滤条件
   * @private
   */
  _validateFilters(filters) {
    if (!filters || typeof filters !== 'object') {
      return {};
    }

    const standardFilters = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        continue;
      }

      // 处理特殊操作符
      if (key.startsWith('$')) {
        standardFilters[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 处理字段级操作符
        standardFilters[key] = this._normalizeFieldOperators(value);
      } else {
        // 简单相等条件
        standardFilters[key] = { $eq: value };
      }
    }

    return standardFilters;
  }

  /**
   * 验证关联查询配置
   * @param {Array} populate 关联查询配置
   * @return {Array<PopulateConfig>} 标准化的关联查询配置
   * @private
   */
  _validatePopulate(populate) {
    if (!Array.isArray(populate)) {
      return [];
    }

    return populate
      .map(config => {
        if (typeof config === 'string') {
          return { path: config, select: [] };
        }

        if (typeof config === 'object' && config.path) {
          return {
            path: config.path,
            select: Array.isArray(config.select)
              ? config.select
              : typeof config.select === 'string'
                ? config.select.split(' ').filter(Boolean)
                : [],
            filters: config.filters || {},
            populate: config.populate || [],
            sort: config.sort || {},
            limit: config.limit || 0,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  /**
   * 验证排序配置
   * @param {Object|Array} sort 排序配置
   * @return {Array<SortConfig>} 标准化的排序配置
   * @private
   */
  _validateSort(sort) {
    if (Array.isArray(sort)) {
      return sort.map(item => ({
        field: item.field,
        order: item.order === 'asc' ? 'asc' : 'desc',
      }));
    }

    if (typeof sort === 'object') {
      return Object.entries(sort).map(([field, order]) => ({
        field,
        order: order === 1 || order === 'asc' || order === 'ASC' ? 'asc' : 'desc',
      }));
    }

    return [];
  }

  /**
   * 验证字段选择
   * @param {string|Array} fields 字段选择
   * @return {Array<string>} 标准化的字段数组
   * @private
   */
  _validateFields(fields) {
    if (!fields) {
      return [];
    }

    if (typeof fields === 'string') {
      // 处理 MongoDB 风格的字段选择 "-password id name"
      return fields.split(' ').filter(Boolean);
    }

    if (Array.isArray(fields)) {
      return fields.filter(field => typeof field === 'string');
    }

    return [];
  }

  /**
   * 验证分页配置
   * @param {Object} pagination 分页配置
   * @return {PaginationConfig} 标准化的分页配置
   * @private
   */
  _validatePagination(pagination) {
    const page = Math.max(1, parseInt(pagination.page || pagination.current || 1));
    const pageSize = Math.max(1, Math.min(1000, parseInt(pagination.pageSize || pagination.limit || 10)));

    return {
      page,
      pageSize,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      isPaging: pagination.isPaging,
    };
  }

  /**
   * 标准化字段操作符
   * @param {Object} operators 字段操作符
   * @return {Object} 标准化的操作符
   * @private
   */
  _normalizeFieldOperators(operators) {
    const standardOperators = {};

    for (const [op, value] of Object.entries(operators)) {
      switch (op) {
        case '$eq':
        case '$ne':
        case '$gt':
        case '$gte':
        case '$lt':
        case '$lte':
        case '$in':
        case '$nin':
        case '$regex':
        case '$exists':
          standardOperators[op] = value;
          break;

        // 兼容 MongoDB 操作符
        case 'eq':
          standardOperators.$eq = value;
          break;
        case 'ne':
          standardOperators.$ne = value;
          break;
        case 'gt':
          standardOperators.$gt = value;
          break;
        case 'gte':
          standardOperators.$gte = value;
          break;
        case 'lt':
          standardOperators.$lt = value;
          break;
        case 'lte':
          standardOperators.$lte = value;
          break;
        case 'in':
          standardOperators.$in = value;
          break;
        case 'nin':
          standardOperators.$nin = value;
          break;

        default:
          // 未知操作符，保持原样
          standardOperators[op] = value;
      }
    }

    return standardOperators;
  }
}

module.exports = {
  StandardParamsValidator,
};
