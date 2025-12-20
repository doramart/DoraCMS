'use strict';

/**
 * Security utilities for template tags
 * 模板标签安全工具类
 */
class SecurityValidator {
  constructor() {
    // API路径白名单
    this.allowedApiPaths = [
      'content/getList',
      'content/getHotList',
      'content/getRandomList',
      'content/getRecommendList',
      'content/getNearPost',
      'contentTag/getList',
      'contentTag/getHotList',
      'contentCategory/getList',
      'contentCategory/getTree',
      'contentCategory/getChild',
      'ads/getList',
      'systemConfig/find',
      'external/weather', // 示例外部API
    ];

    // 危险查询字段
    this.dangerousFields = [
      '$where',
      '$eval',
      'function',
      'eval',
      'javascript:',
      'script',
      'Function',
      'constructor',
      'prototype',
    ];

    // 最大查询复杂度
    this.maxQueryComplexity = 10;
    this.maxStringLength = 1000;
  }

  /**
   * 验证API路径是否安全
   * @param {string} apiPath - API路径
   * @return {boolean} - 是否安全
   */
  isValidApiPath(apiPath) {
    if (typeof apiPath !== 'string') {
      return false;
    }

    // 检查是否在白名单中
    return this.allowedApiPaths.some(allowedPath => apiPath === allowedPath || apiPath.startsWith(allowedPath + '/'));
  }

  /**
   * 验证查询对象是否安全
   * @param {Object} queryObj - 查询对象
   * @return {boolean} - 是否安全
   */
  isValidQueryObject(queryObj) {
    if (!queryObj || typeof queryObj !== 'object') {
      return true; // 空对象是安全的
    }

    try {
      // 检查复杂度
      if (Object.keys(queryObj).length > this.maxQueryComplexity) {
        return false;
      }

      // 检查危险字段
      const queryString = JSON.stringify(queryObj);
      if (queryString.length > this.maxStringLength) {
        return false;
      }

      // 检查是否包含危险字段
      for (const dangerousField of this.dangerousFields) {
        if (queryString.toLowerCase().includes(dangerousField.toLowerCase())) {
          return false;
        }
      }

      // 递归检查嵌套对象
      return this._validateNestedObject(queryObj, 0);
    } catch (error) {
      return false;
    }
  }

  /**
   * 递归验证嵌套对象
   * @param {Object} obj - 对象
   * @param {number} depth - 当前深度
   * @return {boolean} - 是否安全
   */
  _validateNestedObject(obj, depth) {
    // 限制嵌套深度
    if (depth > 5) {
      return false;
    }

    for (const [key, value] of Object.entries(obj)) {
      // 验证键名
      if (!this._isValidKey(key)) {
        return false;
      }

      // 验证值
      if (typeof value === 'string') {
        if (!this._isValidStringValue(value)) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (!this._validateNestedObject(value, depth + 1)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证键名是否安全
   * @param {string} key - 键名
   * @return {boolean} - 是否安全
   */
  _isValidKey(key) {
    if (typeof key !== 'string') {
      return false;
    }

    // 检查长度
    if (key.length > 50) {
      return false;
    }

    // 检查危险字符
    const dangerousChars = ['$', '.', '\\', '/', '<', '>', '"', "'"];
    for (const char of dangerousChars) {
      if (key.includes(char)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证字符串值是否安全
   * @param {string} value - 字符串值
   * @return {boolean} - 是否安全
   */
  _isValidStringValue(value) {
    if (typeof value !== 'string') {
      return true;
    }

    // 检查长度
    if (value.length > this.maxStringLength) {
      return false;
    }

    // 检查危险模式
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /eval\s*\(/i, /function\s*\(/i];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证标签参数
   * @param {Object} args - 参数对象
   * @param {Object} schema - 参数模式
   * @return {Object} - 验证结果 {valid: boolean, errors: string[]}
   */
  validateTagArgs(args, schema) {
    const errors = [];

    if (!args || typeof args !== 'object') {
      if (schema.required && schema.required.length > 0) {
        errors.push('Arguments are required');
      }
      return { valid: errors.length === 0, errors };
    }

    // 检查必需参数
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (args[requiredField] === undefined || args[requiredField] === null) {
          errors.push(`Required parameter '${requiredField}' is missing`);
        }
      }
    }

    // 检查参数类型和值
    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const value = args[fieldName];

        if (value !== undefined) {
          const fieldValidation = this._validateField(fieldName, value, fieldSchema);
          if (!fieldValidation.valid) {
            errors.push(...fieldValidation.errors);
          }
        }
      }
    }

    // 🔍 检查是否有未定义的额外参数 (如果开启严格模式)
    if (schema.strict && schema.properties) {
      const allowedFields = Object.keys(schema.properties);
      const providedFields = Object.keys(args);

      for (const fieldName of providedFields) {
        if (!allowedFields.includes(fieldName)) {
          errors.push(`Unknown parameter '${fieldName}' is not allowed`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证单个字段
   * @param {string} fieldName - 字段名
   * @param {*} value - 字段值
   * @param {Object} schema - 字段模式
   * @return {Object} - 验证结果
   */
  _validateField(fieldName, value, schema) {
    const errors = [];

    // 类型检查
    if (schema.type && typeof value !== schema.type) {
      errors.push(`Parameter '${fieldName}' must be of type ${schema.type}`);
      return { valid: false, errors };
    }

    // 字符串长度检查
    if (schema.type === 'string') {
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Parameter '${fieldName}' exceeds maximum length of ${schema.maxLength}`);
      }
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Parameter '${fieldName}' is shorter than minimum length of ${schema.minLength}`);
      }
    }

    // 数值范围检查
    if (schema.type === 'number') {
      if (schema.max && value > schema.max) {
        errors.push(`Parameter '${fieldName}' exceeds maximum value of ${schema.max}`);
      }
      if (schema.min && value < schema.min) {
        errors.push(`Parameter '${fieldName}' is less than minimum value of ${schema.min}`);
      }
    }

    // 枚举值检查
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Parameter '${fieldName}' must be one of: ${schema.enum.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 安全地解析JSON字符串
   * @param {string} jsonString - JSON字符串
   * @return {Object} - 解析结果 {success: boolean, data: any, error: string}
   */
  safeJsonParse(jsonString) {
    try {
      if (typeof jsonString !== 'string') {
        return { success: false, data: null, error: 'Input is not a string' };
      }

      if (jsonString.length > this.maxStringLength) {
        return { success: false, data: null, error: 'JSON string too long' };
      }

      const parsed = JSON.parse(jsonString);

      if (!this.isValidQueryObject(parsed)) {
        return { success: false, data: null, error: 'JSON contains dangerous content' };
      }

      return { success: true, data: parsed, error: null };
    } catch (error) {
      return { success: false, data: null, error: `Invalid JSON: ${error.message}` };
    }
  }
}

// 创建单例实例
const securityValidator = new SecurityValidator();

module.exports = securityValidator;
