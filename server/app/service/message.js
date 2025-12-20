/*
 * @Author: doramart
 * @Date: 2024-05-xx
 * @Description: 新版 MessageService - 基于 Repository/Adapter 模式
 */

'use strict';
const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class MessageService extends Service {
  constructor(ctx) {
    super(ctx);
    this.repositoryFactory = new RepositoryFactory(this.app);
    this.repository = this.repositoryFactory.createMessageRepository(ctx);
  }

  async find(payload, options = {}) {
    return await this.repository.find(payload, options);
  }

  async count(params = {}) {
    return await this.repository.count(params);
  }

  async create(payload) {
    return await this.repository.create(payload);
  }

  async removes(values, key = 'id') {
    return await this.repository.remove(values, key);
  }

  async safeDelete(values) {
    return await this.repository.safeDelete(values);
  }

  async update(id, payload) {
    return await this.repository.update(id, payload);
  }

  async item(options = {}) {
    const { query = {}, populate = [], files = null } = options;
    // 🔥 修复参数格式：BaseMariaRepository.findOne(query, options)
    return await this.repository.findOne(query, { populate, fields: files });
  }

  // ======================== Message 特有业务方法 ========================

  /**
   * 根据内容ID查找留言
   * @param {String} contentId 内容ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByContentId(contentId, options = {}) {
    return await this.repository.findByContentId(contentId, options);
  }

  /**
   * 根据作者ID查找留言
   * @param {String} authorId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByAuthor(authorId, options = {}) {
    return await this.repository.findByAuthor(authorId, options);
  }

  /**
   * 根据管理员作者ID查找留言
   * @param {String} adminAuthorId 管理员ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 留言列表
   */
  async findByAdminAuthor(adminAuthorId, options = {}) {
    return await this.repository.findByAdminAuthor(adminAuthorId, options);
  }

  /**
   * 根据父留言ID查找回复
   * @param {String} relationMsgId 父留言ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 回复列表
   */
  async findReplies(relationMsgId, options = {}) {
    return await this.repository.findReplies(relationMsgId, options);
  }

  /**
   * 点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   */
  async praiseMessage(messageId, userId) {
    return await this.repository.praiseMessage(messageId, userId);
  }

  /**
   * 取消点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   */
  async unpraiseMessage(messageId, userId) {
    return await this.repository.unpraiseMessage(messageId, userId);
  }

  /**
   * 🔥 新增：踩留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   */
  async despiseMessage(messageId, userId) {
    return await this.repository.despiseMessage(messageId, userId);
  }

  /**
   * 🔥 新增：取消踩留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 更新后的留言
   */
  async undespiseMessage(messageId, userId) {
    return await this.repository.undespiseMessage(messageId, userId);
  }

  /**
   * 批量更新留言状态
   * @param {Array} messageIds 留言ID数组
   * @param {Boolean} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(messageIds, state) {
    return await this.repository.batchUpdateState(messageIds, state);
  }

  /**
   * 获取留言统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getMessageStats(filter = {}) {
    return await this.repository.getMessageStats(filter);
  }

  /**
   * 根据内容ID获取留言数量
   * @param {String} contentId 内容ID
   * @return {Promise<Number>} 留言数量
   */
  async getMessageCountByContent(contentId) {
    const result = await this.repository.count({ contentId: { $eq: contentId } });
    return result;
  }

  /**
   * 根据用户ID获取留言数量
   * @param {String} userId 用户ID
   * @param {String} userType 用户类型 'user' | 'admin'
   * @return {Promise<Number>} 留言数量
   */
  async getMessageCountByUser(userId, userType = 'user') {
    const field = userType === 'admin' ? 'adminAuthor' : 'author';
    const result = await this.repository.count({ [field]: { $eq: userId } });
    return result;
  }

  /**
   * 获取热门留言（按创建时间排序，点赞数在controller层动态计算）
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async getPopularMessages(payload = {}, options = {}) {
    const defaultSort = [
      { field: 'createdAt', order: 'desc' }, // 改为按创建时间排序
    ];
    const mergedOptions = {
      ...options,
      sort: options.sort || defaultSort,
      filters: { state: { $eq: false }, ...options.filters }, // 只显示正常状态的留言
    };
    return await this.repository.find(payload, mergedOptions);
  }

  /**
   * 获取最新留言
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async getLatestMessages(payload = {}, options = {}) {
    const defaultSort = [{ field: 'createdAt', order: 'desc' }];
    const mergedOptions = {
      ...options,
      sort: options.sort || defaultSort,
      filters: { state: { $eq: false }, ...options.filters }, // 只显示正常状态的留言
    };
    return await this.repository.find(payload, mergedOptions);
  }

  // ======================== Repository 统计和管理方法 ========================

  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  clearRepositoryCache() {
    this.repositoryFactory.clearCache('Message');
  }
}

module.exports = MessageService;
