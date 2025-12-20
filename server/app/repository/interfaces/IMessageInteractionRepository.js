/**
 * MessageInteraction Repository 接口定义
 * 定义留言交互记录的数据访问接口
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IMessageInteractionRepository extends IBaseRepository {
  /**
   * 添加交互记录（点赞/踩）
   * @param {Object} interactionData 交互数据
   * @param {String} interactionData.userId 用户ID
   * @param {String} interactionData.messageId 留言ID
   * @param {String} interactionData.interactionType 交互类型 'praise' | 'despise'
   * @param {String} interactionData.ipAddress IP地址
   * @param {String} interactionData.userAgent 用户代理
   * @return {Promise<Object>} 创建的交互记录
   */
  async addInteraction(interactionData) {
    throw new Error('Method addInteraction() must be implemented');
  }

  /**
   * 移除交互记录（取消点赞/踩）
   * @param {String} userId 用户ID
   * @param {String} messageId 留言ID
   * @param {String} interactionType 交互类型 'praise' | 'despise'
   * @return {Promise<Object>} 删除结果
   */
  async removeInteraction(userId, messageId, interactionType) {
    throw new Error('Method removeInteraction() must be implemented');
  }

  /**
   * 检查用户是否已交互
   * @param {String} userId 用户ID
   * @param {String} messageId 留言ID
   * @param {String} interactionType 交互类型 'praise' | 'despise'
   * @return {Promise<Boolean>} 是否已交互
   */
  async hasInteraction(userId, messageId, interactionType) {
    throw new Error('Method hasInteraction() must be implemented');
  }

  /**
   * 获取留言的交互统计
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} { praiseCount, despiseCount }
   */
  async getInteractionStats(messageId) {
    throw new Error('Method getInteractionStats() must be implemented');
  }

  /**
   * 批量获取用户的交互状态
   * @param {String} userId 用户ID
   * @param {Array<String>} messageIds 留言ID数组
   * @param {String} interactionType 交互类型 'praise' | 'despise'
   * @return {Promise<Array<String>>} 已交互的留言ID数组
   */
  async getUserInteractionStatus(userId, messageIds, interactionType) {
    throw new Error('Method getUserInteractionStatus() must be implemented');
  }

  /**
   * 批量统计多个留言的交互数
   * @param {Array<String>} messageIds 留言ID数组
   * @param {String} interactionType 交互类型 'praise' | 'despise'
   * @return {Promise<Map<String, Number>>} 留言ID到交互数的映射
   */
  async batchGetInteractionCounts(messageIds, interactionType) {
    throw new Error('Method batchGetInteractionCounts() must be implemented');
  }

  /**
   * 获取用户的交互历史
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 交互记录列表
   */
  async getUserInteractionHistory(userId, options = {}) {
    throw new Error('Method getUserInteractionHistory() must be implemented');
  }

  /**
   * 删除留言的所有交互记录
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteMessageInteractions(messageId) {
    throw new Error('Method deleteMessageInteractions() must be implemented');
  }

  /**
   * 删除用户的所有交互记录
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteUserInteractions(userId) {
    throw new Error('Method deleteUserInteractions() must be implemented');
  }
}

module.exports = IMessageInteractionRepository;
