/**
 * 标准化的 ContentCategory MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class ContentCategoryMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'ContentCategory');

    // 设置 MongoDB 模型
    this.model = this.app.model.ContentCategory;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // ContentCategory 可能有关联的内容模板
        // contentTemp: {
        //   model: 'ContentTemplate', // 根据实际模型调整
        //   path: 'contentTemp',
        //   select: ['name', 'alias', 'forder'],
        // },
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // 根据需要添加默认关联查询
      // { path: 'contentTemp', select: ['name', 'alias', 'forder'] },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'keywords', 'defaultUrl', 'comments'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'sortId', order: 'asc' }, // 排序优先
      { field: 'createdAt', order: 'desc' }, // 创建时间
    ];
  }

  /**
   * 🔧 判断是否为顶层分类的 parentId (MongoDB专用)
   * @param {String|Number} parentId 父级分类ID
   * @return {Boolean} 是否为顶层分类
   */
  isTopLevelParentId(parentId) {
    // MongoDB 模式：'0', 0, null, undefined 都视为顶层
    return !parentId || parentId === '0' || parentId === 0 || parentId === null;
  }

  /**
   * 🔧 获取顶层分类的过滤条件 (MongoDB专用)
   * @return {Object} 过滤条件
   */
  getTopLevelCategoryFilters() {
    return {
      enable: { $eq: true },
      $or: [
        { parentId: { $eq: '0' } }, // MongoDB 主要格式：字符串 '0'
        { parentId: { $eq: 0 } }, // 兼容整数格式
        { parentId: { $exists: false } }, // 兼容无 parentId 字段的情况
        { parentId: { $eq: null } }, // 兼容 null 值
      ],
    };
  }

  /**
   * 🚀 获取顶层分类列表 (模板标签专用)
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 顶层分类列表
   */
  async getTopLevelCategories(options = {}) {
    const filters = this.getTopLevelCategoryFilters();
    const defaultOptions = {
      filters,
      // populate: options.populate || [{ path: 'contentTemp', select: ['name', 'alias', 'forder'] }],
      sort: options.sort || [{ field: 'sortId', order: 'asc' }],
    };

    const result = await this.find({ isPaging: '0', pageSize: 1000, lean: '1' }, defaultOptions);
    return Array.isArray(result) ? result : result.docs || [];
  }

  /**
   * 🔥 重写查找方法（添加树形结构处理）
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async find(payload = {}, options = {}) {
    try {
      // 调用基类方法
      const result = await super.find(payload, options);

      // 🔥 ContentCategory特有逻辑：树形结构处理（通过 payload.flat 控制）
      if (!payload.flat && result && result.docs) {
        result.docs = this.buildCategoryTree(result.docs, options?.filters?.parentId?.$eq);
      } else if (!payload.flat && Array.isArray(result)) {
        return this.buildCategoryTree(result, options?.filters?.parentId?.$eq);
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  // ===== ContentCategory 特有的业务方法 =====

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建分类（自动验证唯一性）
   * @param {Object} data 分类数据
   * @return {Promise<Object>} 创建的分类
   * @throws {UniqueConstraintError} 当name不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（同级别下）
      if (data.name) {
        await this.checkNameUnique(data.name, data.parentId);
      }

      // 调用父类的create方法
      return await super.create(data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'create', data);
    }
  }

  /**
   * 更新分类（自动验证唯一性）
   * @param {String} id 分类ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的分类
   * @throws {UniqueConstraintError} 当name不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（同级别下，排除当前ID）
      if (data.name) {
        await this.checkNameUnique(data.name, data.parentId, id);
      }

      // 调用父类的update方法
      return await super.update(id, data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'update', { id, data });
    }
  }

  // ===== 🔥 ContentCategory 特有的业务方法 =====

  /**
   * 检查分类名称是否唯一（同级别下）- 统一异常处理版本
   * @param {String} name 分类名称
   * @param {String} parentId 父级ID
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当名称已存在时抛出异常
   */
  async checkNameUnique(name, parentId = '0', excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkCategoryNameUnique(this, name, parentId, excludeId);
      if (!isUnique) {
        throw this.exceptions.contentCategory.nameExists(name);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkNameUnique', { name, parentId, excludeId });
    }
  }

  /**
   * 检查默认URL是否唯一 - 统一异常处理版本
   * @param {String} defaultUrl 默认URL
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当URL已存在时抛出异常
   */
  async checkDefaultUrlUnique(defaultUrl, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkCategoryDefaultUrlUnique(this, defaultUrl, excludeId);
      if (!isUnique) {
        throw this.exceptions.contentCategory.defaultUrlExists(defaultUrl);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkDefaultUrlUnique', { defaultUrl, excludeId });
    }
  }

  /**
   * 检查分类是否可以删除（无关联内容）- 统一异常处理版本
   * @param {String} categoryId 分类ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当分类有关联内容时抛出异常
   */
  async checkCategoryCanDelete(categoryId) {
    try {
      // 检查是否有子分类
      const children = await this.findByParentId(categoryId);
      if (children && children.length > 0) {
        throw this.exceptions.contentCategory.hasChildren(categoryId);
      }

      // 检查是否有关联内容（需要与content模块集成）
      // const contentCount = await this.ctx.service.content.count({
      //   categories: { $in: [categoryId] }
      // });
      // if (contentCount > 0) {
      //   throw this.exceptions.contentCategory.inUse(categoryId);
      // }

      return true;
    } catch (error) {
      if (error.name === 'BusinessRuleError') {
        throw error;
      }
      this._handleError(error, 'checkCategoryCanDelete', { categoryId });
    }
  }

  /**
   * 检查父分类是否存在 - 统一异常处理版本
   * @param {String} parentId 父分类ID
   * @return {Promise<Boolean>} 父分类是否存在
   * @throws {NotFoundError} 当父分类不存在时抛出异常
   */
  async checkParentCategoryExists(parentId) {
    try {
      // 根级分类无需检查
      if (parentId === '0' || !parentId) {
        return true;
      }

      const parentCategory = await this.findById(parentId);
      if (!parentCategory) {
        throw this.exceptions.contentCategory.parentNotFound(parentId);
      }
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'checkParentCategoryExists', { parentId });
    }
  }

  /**
   * 构建分类树形结构
   * @param {Array} categoryList 分类列表
   * @param {String} parentId 父级ID
   * @return {Array} 树形结构的分类
   */
  buildCategoryTree(categoryList, parentId = '0') {
    const tree = [];
    const rootParentIds = ['0', 0, null, undefined];

    categoryList.forEach(category => {
      if (rootParentIds.includes(category.parentId) && rootParentIds.includes(parentId)) {
        // 根级节点
        const children = this.buildCategoryTree(categoryList, category._id || category.id);
        tree.push({ ...category, children });
      } else if (String(category.parentId) === String(parentId)) {
        // 子节点
        const children = this.buildCategoryTree(categoryList, category._id || category.id);
        tree.push({ ...category, children });
      }
    });

    // 按 sortId 字段排序
    return tree.sort((a, b) => (a.sortId || 0) - (b.sortId || 0));
  }

  /**
   * 根据父级ID查找子分类
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 子分类列表
   */
  async findByParentId(parentId = '0', options = {}) {
    try {
      const filters = { parentId, ...options.filters };
      return await this.find({ flat: true }, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByParentId', { parentId, options });
    }
  }

  /**
   * 根据分类类型查找分类
   * @param {String} type 分类类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 分类列表
   */
  async findByType(type, options = {}) {
    try {
      const filters = { type, ...options.filters };
      return await this.find({ flat: true }, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByType', { type, options });
    }
  }

  /**
   * 获取启用的分类列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的分类列表
   */
  async findEnabled(options = {}) {
    try {
      const filters = { enable: true, ...options.filters };
      return await this.find({ flat: true }, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findEnabled', { options });
    }
  }

  /**
   * 获取分类路径
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类路径数组
   */
  async getCategoryPath(categoryId) {
    try {
      const path = [];
      let currentCategory = await this.findById(categoryId);

      while (currentCategory) {
        path.unshift(currentCategory);
        if (currentCategory.parentId === '0') {
          break;
        }
        currentCategory = await this.findById(currentCategory.parentId);
      }

      this._logOperation('getCategoryPath', { categoryId }, path);
      return path;
    } catch (error) {
      this._handleError(error, 'getCategoryPath', { categoryId });
    }
  }

  /**
   * 获取分类及其所有子分类的ID列表
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类ID数组
   */
  async getCategoryAndChildrenIds(categoryId) {
    try {
      const ids = [categoryId];

      // 递归获取所有子分类ID
      const getChildrenIds = async parentId => {
        const children = await this.findByParentId(parentId);
        for (const child of children) {
          ids.push(child._id || child.id);
          await getChildrenIds(child._id || child.id);
        }
      };

      await getChildrenIds(categoryId);

      this._logOperation('getCategoryAndChildrenIds', { categoryId }, ids);
      return ids;
    } catch (error) {
      this._handleError(error, 'getCategoryAndChildrenIds', { categoryId });
    }
  }

  /**
   * 根据关键词搜索分类
   * @param {String} keyword 搜索关键词
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 匹配的分类列表
   */
  async searchByKeyword(keyword, options = {}) {
    try {
      const searchCondition = this._buildSearchCondition(keyword, options.searchKeys || this._getDefaultSearchKeys());

      const filters = { ...searchCondition, ...options.filters };
      return await this.find({ flat: true }, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'searchByKeyword', { keyword, options });
    }
  }

  /**
   * 批量更新分类状态
   * @param {Array} categoryIds 分类ID数组
   * @param {Boolean} enable 启用状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(categoryIds, enable) {
    try {
      const idArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      const result = await this.model.updateMany(
        { _id: { $in: idArray } },
        { $set: { enable, updatedAt: new Date() } }
      );

      this._logOperation('batchUpdateStatus', { categoryIds, enable }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'batchUpdateStatus', { categoryIds, enable });
    }
  }

  /**
   * 获取分类统计信息
   * @param {String} categoryId 分类ID（可选，统计子分类）
   * @return {Promise<Object>} 统计信息
   */
  async getCategoryStats(categoryId = null) {
    try {
      const filter = {};
      if (categoryId) {
        filter.parentId = categoryId;
      }

      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: '$enable',
            count: { $sum: 1 },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = { total: 0, enabled: 0, disabled: 0 };

      result.forEach(item => {
        const count = item.count;
        stats.total += count;
        if (item._id === true) {
          stats.enabled = count;
        } else {
          stats.disabled = count;
        }
      });

      this._logOperation('getCategoryStats', { categoryId }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getCategoryStats', { categoryId });
      return { total: 0, enabled: 0, disabled: 0 };
    }
  }

  /**
   * 更新分类路径信息
   * @param {String} categoryId 分类ID
   * @param {String} parentId 父级ID
   * @return {Promise<Object>} 更新结果
   */
  async updateCategoryPaths(categoryId, parentId) {
    try {
      const updateData = {};

      if (parentId === '0') {
        updateData.sortPath = '0,' + categoryId;
      } else {
        const parentCategory = await this.findById(parentId, {
          fields: ['sortPath', 'defaultUrl'],
        });

        if (parentCategory) {
          updateData.sortPath = parentCategory.sortPath + ',' + categoryId;

          // 如果有默认URL，更新层级URL
          const currentCategory = await this.findById(categoryId, { fields: ['defaultUrl'] });
          if (parentCategory.defaultUrl && currentCategory.defaultUrl) {
            updateData.defaultUrl = parentCategory.defaultUrl + '/' + currentCategory.defaultUrl;
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        const result = await this.update(categoryId, updateData);
        this._logOperation('updateCategoryPaths', { categoryId, parentId }, result);
        return result;
      }

      return null;
    } catch (error) {
      this._handleError(error, 'updateCategoryPaths', { categoryId, parentId });
    }
  }

  /**
   * 批量更新子分类的模板
   * @param {String} parentId 父分类ID
   * @param {String} contentTemp 内容模板
   * @return {Promise<Object>} 更新结果
   */
  async updateChildrenTemplate(parentId, contentTemp) {
    try {
      const result = await this.model.updateMany({ parentId }, { $set: { contentTemp, updatedAt: new Date() } });

      this._logOperation('updateChildrenTemplate', { parentId, contentTemp }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateChildrenTemplate', { parentId, contentTemp });
    }
  }

  // ===== 钩子方法重写 =====

  /**
   * 重写状态映射（ContentCategory模块特定）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.BOOLEAN_STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理（ContentCategory特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 处理分类类型文本
    if (item.type) {
      item.typeText = this._getCategoryTypeText(item.type);
    }

    // 添加状态文本
    if (typeof item.enable !== 'undefined') {
      item.statusText = item.enable ? '启用' : '禁用';
    }

    // 添加虚拟URL字段
    if (item.defaultUrl && item._id) {
      item.url = `/${item.defaultUrl}___${item._id}`;
    }

    // 确保数组字段的默认值
    item.children = item.children || [];

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（ContentCategory特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 设置默认值
    if (!data.parentId) {
      data.parentId = '0';
    }
    if (typeof data.enable === 'undefined') {
      data.enable = true;
    }
    if (!data.type) {
      data.type = '1';
    }
    if (!data.sortId) {
      data.sortId = 1;
    }
    if (!data.sortPath) {
      data.sortPath = '0';
    }
    if (!data.homePage) {
      data.homePage = 'ui';
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（ContentCategory特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // ContentCategory特有的更新前处理
    return data;
  }

  /**
   * 获取分类类型文本
   * @param {String} type 分类类型
   * @return {String} 分类类型文本
   * @private
   */
  _getCategoryTypeText(type) {
    const typeMap = {
      1: '普通分类',
      2: '单页面',
    };
    return typeMap[type] || '未知类型';
  }

  /**
   * 批量获取分类的文章数量
   * @param {Array} categoryIds 分类ID数组
   * @param {Object} options 查询选项 { includeDisabled: false, state: '2' }
   * @return {Promise<Object>} {categoryId: count} 的映射对象
   */
  async batchGetContentCounts(categoryIds, options = {}) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return {};
    }

    try {
      const { state = '2', draft = '0' } = options;
      const contentCounts = {};

      // 获取 Content 模型
      const ContentModel = this.ctx.model.Content;

      if (!ContentModel) {
        this.ctx.logger.warn('[ContentCategoryMongoRepository] Content model not found');
        // 返回默认计数
        categoryIds.forEach(id => {
          contentCounts[id] = 0;
        });
        return contentCounts;
      }

      // 使用聚合管道统计每个分类的文章数量
      // 处理 draft 字段可能为 undefined 的情况
      const draftCondition =
        draft === '0'
          ? { $or: [{ draft: { $eq: '0' } }, { draft: { $exists: false } }, { draft: null }] }
          : { draft: { $eq: draft } };

      const pipeline = [
        {
          $match: {
            categories: { $in: categoryIds },
            state,
            ...draftCondition,
          },
        },
        {
          $unwind: '$categories',
        },
        {
          $match: {
            categories: { $in: categoryIds },
          },
        },
        {
          $group: {
            _id: '$categories',
            count: { $sum: 1 },
          },
        },
      ];

      const results = await ContentModel.aggregate(pipeline);

      // 初始化所有分类的计数为0
      categoryIds.forEach(id => {
        contentCounts[id] = 0;
      });

      // 填充实际统计结果
      results.forEach(row => {
        if (row._id) {
          contentCounts[row._id] = row.count || 0;
        }
      });

      this._logOperation(
        'batchGetContentCounts',
        { categoryIds: categoryIds.length, options },
        { totalCategories: Object.keys(contentCounts).length }
      );

      return contentCounts;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryMongoRepository] batchGetContentCounts error:', error);

      // 降级处理：返回空计数
      const fallbackCounts = {};
      categoryIds.forEach(id => {
        fallbackCounts[id] = 0;
      });
      return fallbackCounts;
    }
  }

  /**
   * 为分类列表添加文章数量信息
   * @param {Array} categoryList 分类列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 包含文章数量的分类列表
   */
  async enrichCategoryListWithCount(categoryList, options = {}) {
    if (!Array.isArray(categoryList) || categoryList.length === 0) {
      return categoryList;
    }

    try {
      // 递归提取所有层级的分类ID（包括子分类）
      const allCategoryIds = this._extractAllCategoryIds(categoryList);

      if (allCategoryIds.length === 0) {
        return categoryList;
      }

      // 批量获取所有分类的文章数量
      const contentCounts = await this.batchGetContentCounts(allCategoryIds, options);

      // 递归为所有分类节点添加文章数量
      this._assignContentCountsRecursively(categoryList, contentCounts);

      this.ctx.logger.debug(
        `[ContentCategoryMongoRepository] Enriched ${allCategoryIds.length} categories with content counts`
      );

      return categoryList;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryMongoRepository] enrichCategoryListWithCount error:', error);

      // 降级处理：递归添加默认计数
      this._assignDefaultCountsRecursively(categoryList);

      return categoryList;
    }
  }

  /**
   * 递归提取所有层级的分类ID
   * @param {Array} categoryList 分类列表
   * @return {Array} 所有分类ID的扁平数组
   * @private
   */
  _extractAllCategoryIds(categoryList) {
    const allIds = [];

    const extractIds = categories => {
      if (!Array.isArray(categories)) return;

      categories.forEach(category => {
        const categoryId = category.id || category._id;
        if (categoryId) {
          allIds.push(categoryId);
        }

        // 递归处理子分类
        if (category.children && Array.isArray(category.children)) {
          extractIds(category.children);
        }
      });
    };

    extractIds(categoryList);
    return [...new Set(allIds.map(id => String(id)))]; // 去重并统一转为字符串
  }

  /**
   * 递归为所有分类节点分配文章数量
   * @param {Array} categoryList 分类列表
   * @param {Object} contentCounts 文章数量映射
   * @private
   */
  _assignContentCountsRecursively(categoryList, contentCounts) {
    const assignCounts = categories => {
      if (!Array.isArray(categories)) return;

      categories.forEach(category => {
        const categoryId = category.id || category._id;
        if (categoryId) {
          category.contentCount = contentCounts[String(categoryId)] || 0;
        }

        // 递归处理子分类
        if (category.children && Array.isArray(category.children)) {
          assignCounts(category.children);
        }
      });
    };

    assignCounts(categoryList);
  }

  /**
   * 递归为所有分类节点分配默认计数（降级处理）
   * @param {Array} categoryList 分类列表
   * @private
   */
  _assignDefaultCountsRecursively(categoryList) {
    const assignDefaultCounts = categories => {
      if (!Array.isArray(categories)) return;

      categories.forEach(category => {
        category.contentCount = 0;

        // 递归处理子分类
        if (category.children && Array.isArray(category.children)) {
          assignDefaultCounts(category.children);
        }
      });
    };

    assignDefaultCounts(categoryList);
  }
}

module.exports = ContentCategoryMongoRepository;
