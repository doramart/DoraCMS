/**
 * ContentCategory Repository 接口定义
 * 定义内容分类相关的特殊业务方法
 */
'use strict';

const IBaseRepository = require('./IBaseRepository');

class IContentCategoryRepository extends IBaseRepository {
  /**
   * 根据父级ID查找子分类
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项 { includeDisabled: false, populate: [] }
   * @return {Promise<Array>} 子分类列表
   */
  async findByParentId(parentId, options = {}) {
    throw new Error('Method findByParentId() must be implemented');
  }

  /**
   * 根据分类类型查找分类
   * @param {String} type 分类类型 ('1': 普通分类, '2': 单页面)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 分类列表
   */
  async findByType(type, options = {}) {
    throw new Error('Method findByType() must be implemented');
  }

  /**
   * 获取启用的分类列表
   * @param {Object} options 查询选项 { type: null, sortBy: 'sortId' }
   * @return {Promise<Array>} 启用的分类列表
   */
  async findEnabled(options = {}) {
    throw new Error('Method findEnabled() must be implemented');
  }

  /**
   * 构建分类树结构
   * @param {String} parentId 起始父级ID，默认 '0'
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 树形结构分类
   */
  async buildCategoryTree(parentId = '0', options = {}) {
    throw new Error('Method buildCategoryTree() must be implemented');
  }

  /**
   * 获取分类路径（从根到当前分类的完整路径）
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类路径数组
   */
  async getCategoryPath(categoryId) {
    throw new Error('Method getCategoryPath() must be implemented');
  }

  /**
   * 检查分类名称是否已存在（同级别下）
   * @param {String} name 分类名称
   * @param {String} parentId 父级ID
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否存在
   */
  async checkNameExists(name, parentId, excludeId = null) {
    throw new Error('Method checkNameExists() must be implemented');
  }

  /**
   * 检查 defaultUrl 是否已存在
   * @param {String} defaultUrl URL
   * @param {String} excludeId 排除的记录ID
   * @return {Promise<Boolean>} 是否存在
   */
  async checkDefaultUrlExists(defaultUrl, excludeId = null) {
    throw new Error('Method checkDefaultUrlExists() must be implemented');
  }

  /**
   * 获取分类及其所有子分类的ID列表
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类ID数组
   */
  async getCategoryAndChildrenIds(categoryId) {
    throw new Error('Method getCategoryAndChildrenIds() must be implemented');
  }

  /**
   * 更新分类排序路径
   * @param {String} categoryId 分类ID
   * @param {String} newSortPath 新的排序路径
   * @return {Promise<Object>} 更新结果
   */
  async updateSortPath(categoryId, newSortPath) {
    throw new Error('Method updateSortPath() must be implemented');
  }

  /**
   * 根据排序路径查找分类
   * @param {String} sortPath 排序路径
   * @return {Promise<Array>} 分类列表
   */
  async findBySortPath(sortPath) {
    throw new Error('Method findBySortPath() must be implemented');
  }

  /**
   * 获取根分类列表（parentId = '0'）
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 根分类列表
   */
  async findRootCategories(options = {}) {
    throw new Error('Method findRootCategories() must be implemented');
  }

  /**
   * 根据关键词搜索分类
   * @param {String} keyword 搜索关键词
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 匹配的分类列表
   */
  async searchByKeyword(keyword, options = {}) {
    throw new Error('Method searchByKeyword() must be implemented');
  }

  /**
   * 批量更新分类状态
   * @param {Array} categoryIds 分类ID数组
   * @param {Boolean} enable 启用状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(categoryIds, enable) {
    throw new Error('Method batchUpdateStatus() must be implemented');
  }

  /**
   * 获取分类统计信息
   * @param {String} categoryId 分类ID（可选）
   * @return {Promise<Object>} 统计信息 { totalCount, enabledCount, disabledCount, childrenCount }
   */
  async getCategoryStats(categoryId = null) {
    throw new Error('Method getCategoryStats() must be implemented');
  }

  /**
   * 批量获取分类的文章数量
   * @param {Array} categoryIds 分类ID数组
   * @param {Object} options 查询选项 { includeDisabled: false, state: '2' }
   * @return {Promise<Object>} {categoryId: count} 的映射对象
   */
  async batchGetContentCounts(categoryIds, options = {}) {
    throw new Error('Method batchGetContentCounts() must be implemented');
  }

  /**
   * 为分类列表添加文章数量信息
   * @param {Array} categoryList 分类列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 包含文章数量的分类列表
   */
  async enrichCategoryListWithCount(categoryList, options = {}) {
    throw new Error('Method enrichCategoryListWithCount() must be implemented');
  }
}

module.exports = IContentCategoryRepository;
