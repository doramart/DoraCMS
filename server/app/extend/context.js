'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { contextManager } = require('./helper/tags/context');
const shortid = require('shortid');

/**
 * Context extension for handling page rendering and data management
 */
module.exports = {
  validateId(id) {
    if (!id) {
      return false;
    }

    // Handle array of IDs
    if (Array.isArray(id)) {
      return id.every(singleId => this.validateId(singleId));
    }

    // Convert to string for consistent checking
    const idStr = String(id);

    // MongoDB ObjectId format - 24 char hex string
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);

    // MongoDB shortId format
    const isValidShortId = shortid.isValid(idStr);

    // MariaDB auto increment format - positive integer
    const isValidAutoIncrement = /^\d+$/.test(idStr) && parseInt(idStr) > 0;

    return isValidObjectId || isValidShortId || isValidAutoIncrement;
  },

  /**
   * Renders category name based on page type and data
   * @param {Object} pageData - The page data object
   * @return {void}
   */
  /**
   * 安全地获取当前登录用户的ID
   * @return {string|null} 用户ID，如果未登录则返回null
   */
  getCurrentUserId() {
    return this.session?.user?.id || null;
  },

  /**
   * 检查用户是否已登录
   * @return {boolean} 如果用户已登录返回true，否则返回false
   */
  isUserLoggedIn() {
    return !!this.session?.user?.id;
  },

  /**
   * 获取当前用户ID，如果未登录则抛出错误
   * @return {string} 用户ID
   * @throws {Error} 如果用户未登录
   */
  requireCurrentUserId() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }
    return userId;
  },
};
