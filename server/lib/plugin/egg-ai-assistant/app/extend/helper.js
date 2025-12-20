/**
 * Helper 扩展
 * 注册 AI 助手插件的辅助工具类
 *
 * @author DoraCMS Team
 * @date 2025-10-16
 */

'use strict';

const CategoryHelper = require('../utils/categoryHelper');

module.exports = {
  /**
   * 分类辅助工具
   */
  get categoryHelper() {
    return CategoryHelper;
  },
};
