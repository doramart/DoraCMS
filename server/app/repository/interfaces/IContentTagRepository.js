/**
 * ContentTag Repository 接口定义
 * 定义内容标签相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IContentTagRepository extends IBaseRepository {
  /**
   * 根据标签名查找标签
   * @param {String} name 标签名
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 标签记录
   */
  async findByName(name, options = {}) {
    throw new Error('Method findByName() must be implemented');
  }

  /**
   * 根据别名查找标签
   * @param {String} alias 标签别名
   * @param {Object} options 查询选项 { files }
   * @return {Promise<Object|null>} 标签记录
   */
  async findByAlias(alias, options = {}) {
    throw new Error('Method findByAlias() must be implemented');
  }

  /**
   * 检查标签名是否已存在
   * @param {String} name 标签名
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否存在
   */
  async checkNameExists(name, excludeId = null) {
    throw new Error('Method checkNameExists() must be implemented');
  }

  /**
   * 检查别名是否已存在
   * @param {String} alias 标签别名
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否存在
   */
  async checkAliasExists(alias, excludeId = null) {
    throw new Error('Method checkAliasExists() must be implemented');
  }

  /**
   * 按标签名数组搜索标签
   * @param {Array<String>} tagNames 标签名数组
   * @param {Object} options 查询选项 { includeAlias: true, caseInsensitive: true }
   * @return {Promise<Array<String>>} 匹配的标签ID数组
   */
  async searchByNames(tagNames, options = {}) {
    throw new Error('Method searchByNames() must be implemented');
  }

  /**
   * 查找热门标签
   * @param {Object} payload 查询参数 { pageSize: 10 }
   * @return {Promise<Array>} 热门标签列表（按使用频率排序）
   */
  async findHotTags(payload = {}) {
    throw new Error('Method findHotTags() must be implemented');
  }

  /**
   * 获取标签统计信息
   * @param {String} tagId 标签ID
   * @return {Promise<Object>} 标签统计信息 { usageCount, contentCount }
   */
  async getTagStats(tagId) {
    throw new Error('Method getTagStats() must be implemented');
  }

  /**
   * 批量创建标签（如果不存在）
   * @param {Array<Object>} tagData 标签数据数组 [{ name, alias, comments }, ...]
   * @return {Promise<Array<Object>>} 创建或查找到的标签记录
   */
  async createOrFindTags(tagData) {
    throw new Error('Method createOrFindTags() must be implemented');
  }

  /**
   * 获取标签使用频率排行榜
   * @param {Object} payload 查询参数 { pageSize: 20, timeRange?: String }
   * @return {Promise<Array>} 标签使用排行榜
   */
  async getTagRankings(payload = {}) {
    throw new Error('Method getTagRankings() must be implemented');
  }

  /**
   * 按用途查找相关标签
   * @param {String} keyword 关键词
   * @param {Object} options 查询选项 { limit: 10, fuzzy: true }
   * @return {Promise<Array>} 相关标签列表
   */
  async findRelatedTags(keyword, options = {}) {
    throw new Error('Method findRelatedTags() must be implemented');
  }
}

module.exports = IContentTagRepository;
