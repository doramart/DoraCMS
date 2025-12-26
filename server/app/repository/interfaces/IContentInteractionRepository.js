/**
 * 文章交互 Repository 接口定义
 * 定义数据访问层 API
 */
'use strict';

// 模拟接口类
class IContentInteractionRepository {
  /**
   * 添加交互记录（点赞/收藏/踩）
   * @param {Object} interactionData { userId, contentId, interactionType, ipAddress, userAgent }
   * @param _interactionData
   * @return {Promise<Object>} 交互记录
   */
  async addInteraction(_interactionData) {
    throw new Error('Not Implemented');
  }

  /**
   * 移除交互记录（取消点赞/收藏/踩）
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @param {String} interactionType 交互类型
   * @param _userId
   * @param _contentId
   * @param _interactionType
   * @return {Promise<Object>} 删除结果 { deletedCount }
   */
  async removeInteraction(_userId, _contentId, _interactionType) {
    throw new Error('Not Implemented');
  }

  /**
   * 检查用户是否已交互
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @param {String} interactionType 交互类型
   * @param _userId
   * @param _contentId
   * @param _interactionType
   * @return {Promise<Boolean>} 是否已交互
   */
  async hasInteraction(_userId, _contentId, _interactionType) {
    throw new Error('Not Implemented');
  }

  /**
   * 获取文章的交互统计
   * @param {String} contentId 文章ID
   * @param _contentId
   * @return {Promise<Object>} { praiseCount, favoriteCount, despiseCount }
   */
  async getInteractionStats(_contentId) {
    throw new Error('Not Implemented');
  }

  /**
   * 批量获取用户的交互状态（如用户点赞了哪些文章）
   * @param {String} userId 用户ID
   * @param {Array} contentIds 文章ID数组
   * @param {String} interactionType 交互类型
   * @param _userId
   * @param _contentIds
   * @param _interactionType
   * @return {Promise<Array>} 已交互的文章ID数组
   */
  async getUserInteractionStatus(_userId, _contentIds, _interactionType) {
    throw new Error('Not Implemented');
  }

  /**
   * 批量统计多个文章的某类交互数
   * @param {Array} contentIds 文章ID数组
   * @param {String} interactionType 交互类型
   * @param _contentIds
   * @param _interactionType
   * @return {Promise<Map>} 文章ID -> 数量 的映射
   */
  async batchGetInteractionCounts(_contentIds, _interactionType) {
    throw new Error('Not Implemented');
  }

  /**
   * 获取用户的交互历史
   * @param {String} userId 用户ID
   * @param {Object} options { interactionType, limit, offset/skip }
   * @param _userId
   * @param _options
   * @return {Promise<Array>} 交互记录列表
   */
  async getUserInteractionHistory(_userId, _options) {
    throw new Error('Not Implemented');
  }

  /**
   * 删除文章的所有交互记录
   * @param {String} contentId 文章ID
   * @param _contentId
   * @return {Promise<Object>} 删除结果
   */
  async deleteContentInteractions(_contentId) {
    throw new Error('Not Implemented');
  }

  /**
   * 删除用户的所有交互记录
   * @param {String} userId 用户ID
   * @param _userId
   * @return {Promise<Object>} 删除结果
   */
  async deleteUserInteractions(_userId) {
    throw new Error('Not Implemented');
  }
}

module.exports = IContentInteractionRepository;
