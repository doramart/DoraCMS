/**
 * 日期格式化工具类
 * 提供统一的日期格式化功能，支持多种格式和时区
 */
'use strict';

const moment = require('moment');

class DateFormatter {
  constructor(options = {}) {
    this.defaultFormat = options.defaultFormat || 'YYYY-MM-DD HH:mm:ss';
    this.timezone = options.timezone || 'Asia/Shanghai';
    this.locale = options.locale || 'zh-cn';
  }

  /**
   * 设置默认语言
   * @param {String} locale 语言标识
   */
  setLocale(locale) {
    if (locale) {
      this.locale = locale;
    }
  }

  /**
   * 格式化日期
   * @param {Date|String|Number} date 日期
   * @param {String} format 格式字符串
   * @param {String} timezone 时区
   * @param locale
   * @return {String} 格式化后的日期字符串
   */
  format(date, format = this.defaultFormat, timezone = this.timezone, locale) {
    if (!date) return null;

    const targetLocale = (locale || this.locale || 'zh-cn').toLowerCase();
    return moment(date).tz(timezone).locale(targetLocale).format(format);
  }

  /**
   * 格式化日期为 ISO 字符串（去掉 T 和 Z）
   * @param {Date|String|Number} date 日期
   * @return {String} 格式化后的日期字符串
   */
  formatISO(date) {
    if (!date) return null;
    return new Date(date).toISOString().replace('T', ' ').substr(0, 19);
  }

  /**
   * 批量格式化对象中的日期字段
   * @param {Object|Array} data 数据对象或数组
   * @param {Array} dateFields 需要格式化的日期字段名数组
   * @param {String} format 格式字符串
   * @param locale
   * @return {Object|Array} 格式化后的数据
   */
  formatDateFields(data, dateFields = ['createdAt', 'updatedAt'], format = this.defaultFormat, locale) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.formatDateFields(item, dateFields, format, locale));
    }

    if (typeof data === 'object') {
      const formatted = { ...data };
      dateFields.forEach(field => {
        if (formatted[field]) {
          formatted[field] = this.format(formatted[field], format, this.timezone, locale);
        }
      });
      return formatted;
    }

    return data;
  }

  /**
   * 批量格式化对象中的日期字段为 ISO 格式
   * @param {Object|Array} data 数据对象或数组
   * @param {Array} dateFields 需要格式化的日期字段名数组
   * @return {Object|Array} 格式化后的数据
   */
  formatDateFieldsISO(data, dateFields = ['createdAt', 'updatedAt', 'createdAt', 'updatedAt']) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.formatDateFieldsISO(item, dateFields));
    }

    if (typeof data === 'object') {
      const formatted = { ...data };
      dateFields.forEach(field => {
        if (formatted[field]) {
          formatted[field] = this.formatISO(formatted[field]);
        }
      });
      return formatted;
    }

    return data;
  }

  /**
   * 获取相对时间（如：3分钟前）
   * @param {Date|String|Number} date 日期
   * @param locale
   * @return {String} 相对时间字符串
   */
  fromNow(date, locale) {
    if (!date) return null;
    const targetLocale = (locale || this.locale || 'zh-cn').toLowerCase();
    return moment(date).locale(targetLocale).fromNow();
  }

  /**
   * 获取时间戳
   * @param {Date|String|Number} date 日期
   * @return {Number} 时间戳
   */
  toTimestamp(date) {
    if (!date) return null;
    return moment(date).valueOf();
  }

  /**
   * 检查是否为有效日期
   * @param {Date|String|Number} date 日期
   * @return {Boolean} 是否为有效日期
   */
  isValid(date) {
    return moment(date).isValid();
  }

  /**
   * 获取当前时间
   * @param {String} format 格式字符串
   * @param locale
   * @return {String} 当前时间字符串
   */
  now(format = this.defaultFormat, locale) {
    const targetLocale = (locale || this.locale || 'zh-cn').toLowerCase();
    return moment().locale(targetLocale).format(format);
  }

  /**
   * 获取当前时间戳
   * @return {Number} 当前时间戳
   */
  nowTimestamp() {
    return moment().valueOf();
  }
}

// 创建默认实例
const defaultFormatter = new DateFormatter();

module.exports = {
  DateFormatter,
  defaultFormatter,
  // 兼容性函数
  formatDate: (date, format, locale) => defaultFormatter.format(date, format, defaultFormatter.timezone, locale),
  formatDateFields: (data, dateFields, format, locale) =>
    defaultFormatter.formatDateFields(data, dateFields, format, locale),
  formatDateFieldsISO: (data, dateFields) => defaultFormatter.formatDateFieldsISO(data, dateFields),
  setDefaultLocale: locale => defaultFormatter.setLocale(locale),
};
