'use strict';

const Parameter = require('parameter');
const shortid = require('shortid');

module.exports = app => {
  /**
   * Validate
   *
   * ```js
   * app.validator.addRule('jsonString', (rule, value) => {
   *   try {
   *     JSON.parse(value);
   *   } catch (err) {
   *     return 'must be json string';
   *   }
   * });
   *
   * app.validator.validate({
   * 	 name: 'string',
   * 	 info: { type: 'jsonString', required: false },
   * }, {
   *   name: 'Egg',
   *   info: '{"foo": "bar"}',
   * });
   * ```
   */
  app.validator = new Parameter(app.config.validate);

  // 添加兼容 MongoDB、MariaDB 和 shortid 的 ID 验证规则
  app.validator.addRule('databaseId', (rule, value) => {
    // 允许空值（如果 required: false）
    if (value === undefined || value === null) {
      return;
    }

    // 支持字符串类型（MongoDB ObjectId 或 shortid）
    if (typeof value === 'string') {
      // 去除前后空格
      const trimmedValue = value.trim();

      // 检查是否为空字符串
      if (trimmedValue === '') {
        return 'database id cannot be empty string';
      }

      // 检查 shortid 格式（使用官方 isValid 方法）
      if (shortid.isValid(trimmedValue)) {
        return; // 有效的 shortid
      }

      // 检查 MongoDB ObjectId 格式（24位十六进制字符串）
      if (/^[0-9a-fA-F]{24}$/.test(trimmedValue)) {
        return; // 有效的 MongoDB ObjectId
      }

      // 检查是否为数字字符串（MariaDB 自增 ID）
      if (/^\d+$/.test(trimmedValue) && parseInt(trimmedValue, 10) >= 0) {
        return; // 有效的数字字符串
      }

      return 'database id must be valid shortid, MongoDB ObjectId or positive integer string';
    }

    // 支持数字类型（MariaDB 自增 ID）
    if (typeof value === 'number') {
      if (!Number.isInteger(value) || value < 0) {
        return 'database id must be positive integer';
      }
      return; // 有效的正整数
    }

    return 'database id must be string (shortid, MongoDB ObjectId) or number (MariaDB auto-increment)';
  });

  // 添加可选的数据库 ID 验证规则（允许空值）
  app.validator.addRule('optionalDatabaseId', (rule, value) => {
    // 如果值为空、null、undefined 或空字符串，则认为有效
    if (value === undefined || value === null || value === '') {
      return;
    }

    // 复制 databaseId 的验证逻辑
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (trimmedValue === '') {
        return 'database id cannot be empty string';
      }

      // 检查 shortid 格式（使用官方 isValid 方法）
      if (shortid.isValid(trimmedValue)) {
        return; // 有效的 shortid
      }

      // 检查 MongoDB ObjectId 格式（24位十六进制字符串）
      if (/^[0-9a-fA-F]{24}$/.test(trimmedValue)) {
        return; // 有效的 MongoDB ObjectId
      }

      // 检查是否为数字字符串（MariaDB 自增 ID）
      if (/^\d+$/.test(trimmedValue) && parseInt(trimmedValue, 10) >= 0) {
        return; // 有效的数字字符串
      }

      return 'database id must be valid shortid, MongoDB ObjectId or positive integer string';
    }

    // 支持数字类型（MariaDB 自增 ID）
    if (typeof value === 'number') {
      if (!Number.isInteger(value) || value < 0) {
        return 'database id must be positive integer';
      }
      return; // 有效的正整数
    }

    return 'database id must be string (shortid, MongoDB ObjectId) or number (MariaDB auto-increment)';
  });
};
