'use strict';

const _ = require('lodash');

/**
 * 提取列表数据（兼容 docs/data/records/list/items 等结构）
 * @param {Object|Array} result 查询结果
 * @return {Array} 记录数组
 */
function extractRecords(result) {
  if (!result) {
    return [];
  }

  if (Array.isArray(result.docs)) {
    return result.docs;
  }
  if (Array.isArray(result.data)) {
    return result.data;
  }
  if (Array.isArray(result.records)) {
    return result.records;
  }
  if (Array.isArray(result.list)) {
    return result.list;
  }
  if (Array.isArray(result.items)) {
    return result.items;
  }
  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

/**
 * 过滤敏感字段，输出普通对象
 * @param {*} admin 管理员实体
 * @return {Object|null} 过滤后的对象
 */
function sanitizeAdminEntity(admin) {
  if (!admin) {
    return null;
  }

  const plain =
    typeof admin.toJSON === 'function'
      ? admin.toJSON()
      : typeof admin.toObject === 'function'
        ? admin.toObject()
        : admin;

  return _.omit(plain, ['password']);
}

module.exports = {
  extractRecords,
  sanitizeAdminEntity,
};
