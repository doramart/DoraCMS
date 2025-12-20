/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Content Repository 接口定义
 */

'use strict';

const IBaseRepository = require('./IBaseRepository');

/**
 * Content Repository 接口
 * 继承基础 Repository 接口，定义 Content 特有的业务方法
 */
class IContentRepository extends IBaseRepository {
  /**
   * 根据作者ID查找内容
   * @param {String} authorId 作者ID (Admin)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByAuthor(authorId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 根据用户作者ID查找内容
   * @param {String} uAuthorId 用户作者ID (User)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByUAuthor(uAuthorId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 根据分类ID查找内容
   * @param {String|Array} categoryIds 分类ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByCategories(categoryIds, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 根据标签ID查找内容
   * @param {String|Array} tagIds 标签ID或ID数组
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findByTags(tagIds, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 根据状态查找内容
   * @param {String} state 状态 (0草稿 1待审核 2审核通过 3下架)
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByState(state, payload = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 查找推荐内容 (isTop = 1)
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findTopContents(payload = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 查找置顶内容 (roofPlacement = '1')
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findRoofContents(payload = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 查找草稿内容 (draft = '1')
   * @param {String} authorId 作者ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findDraftContents(authorId, payload = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 按关键词搜索内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async searchByKeyword(keyword, payload = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 增量更新字段 (如点击数、评论数、点赞数)
   * @param {String} contentId 内容ID
   * @param {Object} incData 增量数据 {clickNum: 1, commentNum: 1, likeNum: 1}
   * @return {Promise<Object>} 更新结果
   */
  async incrementFields(contentId, incData) {
    throw new Error('Method not implemented');
  }

  /**
   * 批量更新内容状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} state 新状态
   * @param {String} dismissReason 驳回原因(可选)
   * @return {Promise<Object>} 更新结果
   */
  async updateContentStatus(contentIds, state, dismissReason = null) {
    throw new Error('Method not implemented');
  }

  /**
   * 批量设置推荐状态
   * @param {Array} contentIds 内容ID数组
   * @param {Number} isTop 推荐状态 (0不推荐 1推荐)
   * @return {Promise<Object>} 更新结果
   */
  async updateTopStatus(contentIds, isTop) {
    throw new Error('Method not implemented');
  }

  /**
   * 批量设置置顶状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} roofPlacement 置顶状态 ('0'不置顶 '1'置顶)
   * @return {Promise<Object>} 更新结果
   */
  async updateRoofStatus(contentIds, roofPlacement) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取内容统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计结果
   */
  async getContentStats(filter = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 聚合统计 - 按字段分组统计数量
   * @param {String} field 分组字段 (如 'categories', 'tags', 'author')
   * @param {String} fieldValue 字段值
   * @return {Promise<Number>} 统计数量
   */
  async aggregateCounts(field, fieldValue) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取热门标签统计
   * @param {Object} payload 参数 {pageSize: 10}
   * @return {Promise<Array>} 热门标签列表 [{tags: 'tagId', num_of_tag: 100}]
   */
  async getHotTagStats(payload = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取作者内容统计
   * @param {String} authorId 作者ID
   * @param {String} authorType 作者类型 ('admin' | 'user')
   * @return {Promise<Object>} 作者统计信息
   */
  async getAuthorContentStats(authorId, authorType = 'user') {
    throw new Error('Method not implemented');
  }

  /**
   * 获取分类内容统计
   * @param {String} categoryId 分类ID
   * @return {Promise<Object>} 分类统计信息
   */
  async getCategoryContentStats(categoryId) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取随机内容
   * @param {Number} limit 数量限制
   * @param {Object} filter 过滤条件
   * @return {Promise<Array>} 随机内容列表
   */
  async getRandomContents(limit = 10, filter = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取相关内容推荐
   * @param {String} contentId 内容ID
   * @param {Number} limit 推荐数量
   * @return {Promise<Array>} 相关内容列表
   */
  async getRelatedContents(contentId, limit = 5) {
    throw new Error('Method not implemented');
  }

  /**
   * 内容审核操作
   * @param {String} contentId 内容ID
   * @param {String} action 审核动作 ('approve' | 'reject' | 'pending')
   * @param {String} reason 审核原因
   * @param {String} reviewerId 审核人ID
   * @return {Promise<Object>} 审核结果
   */
  async reviewContent(contentId, action, reason = '', reviewerId = '') {
    throw new Error('Method not implemented');
  }

  /**
   * 软删除内容 (移至回收站)
   * @param {Array} contentIds 内容ID数组
   * @param {Object} updateData 更新数据
   * @return {Promise<Object>} 删除结果
   */
  async softDelete(contentIds, updateData = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 从回收站恢复内容
   * @param {Array} contentIds 内容ID数组
   * @return {Promise<Object>} 恢复结果
   */
  async restoreFromTrash(contentIds) {
    throw new Error('Method not implemented');
  }

  /**
   * 复制内容
   * @param {String} contentId 原内容ID
   * @param {Object} newData 新内容数据
   * @return {Promise<Object>} 新内容
   */
  async duplicateContent(contentId, newData = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 按时间范围统计内容
   * @param {Date} startDate 开始时间
   * @param {Date} endDate 结束时间
   * @param {String} groupBy 分组方式 ('day' | 'week' | 'month')
   * @return {Promise<Array>} 时间统计数据
   */
  async getContentStatsByTime(startDate, endDate, groupBy = 'day') {
    throw new Error('Method not implemented');
  }
}

module.exports = IContentRepository;
