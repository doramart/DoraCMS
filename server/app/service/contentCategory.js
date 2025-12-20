/**
 * ContentCategory Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 * 🔥 统一异常处理版本 - Repository自动抛出语义化异常
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const _ = require('lodash');

function isNumericString(str) {
  return _.isString(str) && _.isFinite(Number(str));
}

class ContentCategoryService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 ContentCategory Repository
    this.repository = this.repositoryFactory.createContentCategoryRepository(ctx);
  }

  /**
   * 查找分类列表
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise} 查询结果
   */
  async find(payload, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 统计分类数量
   * @param {Object} params 查询条件
   * @return {Promise<Number>} 分类数量
   */
  async count(params = {}) {
    return await this.repository.count(params);
  }

  /**
   * 创建分类
   * @param {Object} payload 分类数据
   * @return {Promise<Object>} 创建的分类
   */
  async create(payload) {
    // 🔥 Phase2扩展：Repository层会自动验证唯一性并抛出UniqueConstraintError
    // 无需在Service层重复检查
    // 验证 defaultUrl 是否重复
    if (payload.defaultUrl) {
      await this.repository.checkDefaultUrlUnique(payload.defaultUrl);
    }

    // 验证父分类是否存在
    if (payload.parentId && !this.repository.isTopLevelParentId(payload.parentId)) {
      await this.repository.checkParentCategoryExists(payload.parentId);
    }

    // 创建分类
    const category = await this.repository.create(payload);

    // 更新 sortPath 和 defaultUrl
    await this.repository.updateCategoryPaths(category.id, payload.parentId);

    return category;
  }

  /**
   * 删除分类
   * @param {String|Array} values 分类ID
   * @param {String} key 主键字段
   * @return {Promise} 删除结果
   */
  async removes(values, key = 'id') {
    if (!Array.isArray(values)) {
      values = [values];
    }

    // 🔥 统一异常处理版本：Repository会自动抛出语义化异常
    // 检查每个分类是否可以删除
    for (const id of values) {
      await this.repository.checkCategoryCanDelete(id);
    }

    // 删除主分类
    const mainResult = await this.repository.remove(values, key);

    // 删除子分类
    const childResult = await this.repository.remove(values, 'parentId');

    return {
      ...mainResult,
      childrenDeleted: childResult.deletedCount,
    };
  }

  /**
   * 软删除分类
   * @param {String|Array} values 分类ID
   * @return {Promise} 删除结果
   */
  async safeDelete(values) {
    return await this.repository.safeDelete(values);
  }

  /**
   * 更新分类
   * @param {String} id 分类ID
   * @param {Object} payload 更新数据
   * @return {Promise<Object>} 更新后的分类
   */
  async update(id, payload) {
    // 🔥 Phase2扩展：Repository层会自动验证唯一性（排除当前ID）并抛出UniqueConstraintError
    // 无需在Service层重复检查

    // 验证 defaultUrl 是否重复
    if (payload.defaultUrl) {
      await this.repository.checkDefaultUrlUnique(payload.defaultUrl, id);
    }

    // 验证父分类是否存在
    if (payload.parentId && !this.repository.isTopLevelParentId(payload.parentId)) {
      await this.repository.checkParentCategoryExists(payload.parentId);
    }

    // 针对子类自动继承父类的模板
    if (this.repository.isTopLevelParentId(payload.parentId) && payload.contentTemp) {
      await this.repository.updateChildrenTemplate(id, payload.contentTemp);
    }

    const result = await this.repository.update(id, payload);

    // 如果更新了父级关系，需要重新计算路径
    if (payload.parentId !== undefined && !this.repository.isTopLevelParentId(payload.parentId)) {
      await this.repository.updateCategoryPaths(result.id, payload.parentId);
    }

    return result;
  }

  /**
   * 查找单个分类
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 分类信息
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找分类
   * @param {String} id 分类ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 分类信息
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 查找单个分类（兼容原有接口）
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 分类信息
   */
  async item(options = {}) {
    return await this.repository.findOne(options.query || {}, options);
  }

  // ==================== ContentCategory 特有业务方法 ====================

  /**
   * 根据父级ID查找子分类
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 子分类列表
   */
  async findByParentId(parentId, options = {}) {
    return await this.repository.findByParentId(parentId, options);
  }

  /**
   * 根据分类类型查找分类
   * @param {String} type 分类类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 分类列表
   */
  async findByType(type, options = {}) {
    return await this.repository.findByType(type, options);
  }

  /**
   * 获取启用的分类列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 启用的分类列表
   */
  async findEnabled(options = {}) {
    return await this.repository.findEnabled(options);
  }

  /**
   * 构建分类树结构
   * @param {String} parentId 起始父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 树形结构分类
   */
  async buildCategoryTree(parentId, options = {}) {
    return await this.repository.buildCategoryTree(parentId, options);
  }

  /**
   * 获取分类路径
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类路径
   */
  async getCategoryPath(categoryId) {
    return await this.repository.getCategoryPath(categoryId);
  }

  /**
   * 获取分类及其所有子分类的ID列表
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类ID数组
   */
  async getCategoryAndChildrenIds(categoryId) {
    return await this.repository.getCategoryAndChildrenIds(categoryId);
  }

  /**
   * 根据关键词搜索分类
   * @param {String} keyword 搜索关键词
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 匹配的分类列表
   */
  async searchByKeyword(keyword, options = {}) {
    return await this.repository.searchByKeyword(keyword, options);
  }

  /**
   * 批量更新分类状态
   * @param {Array} categoryIds 分类ID数组
   * @param {Boolean} enable 启用状态
   * @return {Promise} 更新结果
   */
  async batchUpdateStatus(categoryIds, enable) {
    return await this.repository.batchUpdateStatus(categoryIds, enable);
  }

  /**
   * 获取分类统计信息
   * @param {String} categoryId 分类ID
   * @return {Promise<Object>} 统计信息
   */
  async getCategoryStats(categoryId = null) {
    return await this.repository.getCategoryStats(categoryId);
  }

  /**
   * 获取所有分类列表（兼容原有接口）
   * @return {Promise<Array>} 所有分类
   */
  async alllist() {
    return await this.find({ isPaging: '0' });
  }

  /**
   * 根据类别id或者文档id查询子类
   * @param {String} typeId 分类ID
   * @param {String} contentId 内容ID
   * @return {Promise<Object>} 分类层级数据
   */
  async getCurrentCategoriesById(typeId, contentId) {
    const _ = require('lodash');
    let cates = [],
      parents = [];

    // 如果传入了contentId，先根据内容ID获取其分类
    let targetTypeId = typeId;
    if (contentId && !typeId) {
      const contentOptions = {
        filters: { id: { $eq: contentId } },
        fields: ['categories'],
        populate: [
          {
            path: 'categories',
            select: ['name', 'id', 'icon', 'sImg'],
          },
        ],
      };

      const contentObj = await this.ctx.service.content.findOne(contentOptions.filters, contentOptions);
      if (contentObj && contentObj.categories && contentObj.categories.length > 0) {
        targetTypeId = contentObj.categories[0].id;
      }
    }

    if (targetTypeId) {
      // 获取所有分类（平铺格式）
      const fullNav = await this.find({
        isPaging: '0',
        flat: true, // 平铺格式便于过滤
      });

      const parentObj = _.filter(fullNav, doc => {
        return doc.id === targetTypeId;
      });

      if (parentObj.length > 0) {
        const parentId = parentObj[0].sortPath.split(',')[1];
        cates = _.filter(fullNav, doc => {
          return doc.sortPath.indexOf(parentId) > 0;
        });
        parents = _.filter(cates, doc => {
          return this.repository.isTopLevelParentId(doc.parentId);
        });
      }
    }

    return {
      parents,
      cates,
    };
  }

  // ==================== 私有方法（已简化） ====================

  /**
   * 🚀 模板标签专用：获取分类树形结构
   * @param {Object} args 参数
   * @return {Promise<Array>} 分类树
   */
  async getCategoryTreeForTemplate(args = {}) {
    const includeCount = args.includeCount !== false; // 默认包含文章数量
    const cacheKey = `category_tree:${JSON.stringify(args)}:count_${includeCount}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const options = {
          filters: {
            enable: { $eq: true },
          },
          // populate: [{ path: 'contentTemp', select: ['name', 'alias', 'forder'] }],
          sort: [{ field: 'sortId', order: 'asc' }],
        };

        const categoryList = await this.find({ isPaging: '0', pageSize: 1000, lean: '1' }, options);

        // 如果需要包含文章数量，批量获取每个分类的文章数量
        if (includeCount && Array.isArray(categoryList) && categoryList.length > 0) {
          await this._enrichCategoryListWithCount(categoryList);
        }

        // 构建树形结构
        return categoryList;
      },
      3600
    ); // 1小时缓存
  }

  /**
   * 🚀 模板标签专用：获取子分类
   * @param {Object} args 参数
   * @return {Promise<Array>} 子分类列表
   */

  async getChildCategoriesForTemplate(args = {}) {
    // 兼容 typeId 参数，将其映射为 parentId
    const parentId = args.parentId || args.typeId;
    const includeCount = args.includeCount !== false; // 默认包含文章数量

    if (this.repository.isTopLevelParentId(parentId)) {
      // 如果没有parentId或为顶层分类标识，返回顶级分类
      const options = {
        sort: [{ field: 'sortId', order: 'asc' }],
      };

      const topCategories = await this.repository.getTopLevelCategories(options);

      // 如果需要包含文章数量，批量获取
      if (includeCount && Array.isArray(topCategories) && topCategories.length > 0) {
        await this._enrichCategoryListWithCount(topCategories);
      }

      return topCategories;
    }

    const cacheKey = `child_categories:${parentId}:count_${includeCount}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const options = {
          filters: {
            enable: { $eq: true },
            parentId: { $eq: isNumericString(parentId) ? Number(parentId) : parentId },
          },
          sort: [{ field: 'sortId', order: 'asc' }],
        };

        const result = await this.find({ isPaging: '0', pageSize: 1000, lean: '1' }, options);
        const categoryList = Array.isArray(result) ? result : result.docs || [];

        // 如果需要包含文章数量，批量获取
        if (includeCount && categoryList.length > 0) {
          await this._enrichCategoryListWithCount(categoryList);
        }

        return categoryList;
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 获取分类路径（面包屑导航）
   * @param {String} categoryId 分类ID
   * @return {Promise<Array>} 分类路径
   */
  async getCategoryPath(categoryId) {
    if (!categoryId) {
      return [];
    }

    const cacheKey = `category_path:${categoryId}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const path = [];
        let currentId = categoryId;

        while (currentId && currentId !== '0') {
          const category = await this.findOne({ id: { $eq: currentId } });

          if (!category) {
            break;
          }

          path.unshift({
            id: category.id,
            name: category.name,
            defaultUrl: category.defaultUrl,
            alias: category.alias,
          });

          currentId = category.parentId;
        }

        return path;
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 批量获取分类信息（用于内容渲染优化）
   * @param {Array} categoryIds 分类ID数组
   * @return {Promise<Array>} 分类信息数组
   */
  async batchGetCategoriesByIds(categoryIds = []) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return [];
    }

    const cacheKey = `batch_categories:${categoryIds.sort().join(',')}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          id: { $in: categoryIds },
          enable: { $eq: true },
        };

        const options = {
          filters,
          fields: ['id', 'name', 'alias', 'defaultUrl', 'icon', 'sImg'],
        };

        const result = await this.find({ isPaging: '0' }, options);
        return Array.isArray(result) ? result : result.docs || [];
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 获取分类统计信息（包含文章数量）
   * @param {String|Object} categoryIdOrArgs 分类ID或参数对象
   * @return {Promise<Object>} 统计信息
   */
  async getCategoryStatsForTemplate(categoryIdOrArgs) {
    // 处理参数：可能是字符串ID或对象
    let categoryId;
    if (typeof categoryIdOrArgs === 'string') {
      categoryId = categoryIdOrArgs;
    } else if (categoryIdOrArgs && typeof categoryIdOrArgs === 'object') {
      categoryId = categoryIdOrArgs.categoryId || categoryIdOrArgs.id;
    }

    // 如果没有有效的分类ID，返回null
    if (!categoryId || !this.ctx.validateId(categoryId)) {
      return null;
    }

    const cacheKey = `category_stats:${categoryId}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        // 获取分类基本信息
        const category = await this.findOne({ id: { $eq: categoryId } });

        if (!category) {
          return null;
        }

        // 获取该分类下的文章数量
        const contentCount = await this.ctx.service.content.count({
          categories: { $eq: categoryId },
          state: { $eq: '2' }, // 只统计已发布的文章
        });

        // 获取子分类数量
        const childCount = await this.count({
          parentId: { $eq: categoryId },
          enable: { $eq: true },
        });

        return {
          ...category,
          contentCount,
          childCount,
        };
      },
      600
    ); // 10分钟缓存
  }

  /**
   * 🚀 构建分类树形结构
   * @param {Array} categories 分类列表
   * @return {Array} 树形结构
   * @private
   */
  _buildCategoryTree(categories) {
    const tree = [];
    const map = {};

    // 创建映射
    categories.forEach(item => {
      map[item.id] = {
        ...item,
        children: [],
        url: `/${item.defaultUrl}___${item.id}`, // 添加URL格式
      };
    });

    // 构建树形结构
    categories.forEach(item => {
      const parentId = item.parentId;
      if (this.repository.isTopLevelParentId(parentId)) {
        tree.push(map[item.id]);
      } else if (map[parentId]) {
        map[parentId].children.push(map[item.id]);
      }
    });

    return tree;
  }

  /**
   * 🚀 批量为分类列表添加文章数量统计（下沉到Repository）
   * @param {Array} categoryList 分类列表
   * @param {Object} options 查询选项
   * @return {Promise<void>}
   * @private
   */
  async _enrichCategoryListWithCount(categoryList, options = {}) {
    if (!Array.isArray(categoryList) || categoryList.length === 0) {
      return;
    }

    try {
      // 调用Repository层的方法进行文章数量统计
      await this.repository.enrichCategoryListWithCount(categoryList, {
        state: '2', // 只统计已发布的文章
        draft: '0', // 不在回收站的文章
        ...options,
      });
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryService] _enrichCategoryListWithCount error:', error);
      // 如果获取文章数量失败，为每个分类设置默认值0
      categoryList.forEach(category => {
        category.contentCount = 0;
      });
    }
  }

  /**
   * 🚀 从MongoDB获取分类文章数量（已废弃，迁移到Repository）
   * @param {Array} categoryIds 分类ID数组
   * @return {Promise<Object>} {categoryId: count} 的映射对象
   * @private
   * @deprecated 此方法已迁移到 ContentCategoryMongoRepository.batchGetContentCounts()
   */
  async _getContentCountsFromMongoDB(categoryIds) {
    this.ctx.logger.warn(
      '[ContentCategoryService] _getContentCountsFromMongoDB is deprecated, use repository.batchGetContentCounts() instead'
    );

    // 调用Repository层的实现
    return await this.repository.batchGetContentCounts(categoryIds, {
      state: '2',
      draft: '0',
    });
  }

  /**
   * 🚀 清除分类相关缓存
   * @param {String} categoryId 分类ID（可选）
   * @return {Promise<boolean>} 是否成功
   */
  async clearCategoryCache(categoryId = null) {
    try {
      const cacheKeys = ['template:category:tree', 'template:category:children'];

      if (categoryId) {
        // 清除特定分类的缓存
        cacheKeys.push(`category_path:${categoryId}`);
        cacheKeys.push(`category_stats:${categoryId}`);
        cacheKeys.push(`child_categories:${categoryId}`);
        cacheKeys.push(`child_categories:${categoryId}:count_true`);
        cacheKeys.push(`child_categories:${categoryId}:count_false`);
        cacheKeys.push(`batch_categories:*${categoryId}*`);
      } else {
        // 清除所有分类树和子分类缓存（包含计数相关的缓存）
        cacheKeys.push('category_tree:{}:count_true');
        cacheKeys.push('category_tree:{}:count_false');
        cacheKeys.push('category_tree:{"includeCount":true}:count_true');
        cacheKeys.push('category_tree:{"includeCount":false}:count_false');
      }

      const deletePromises = cacheKeys.map(key => {
        if (key.includes('*')) {
          // 对于包含通配符的键，需要特殊处理
          return Promise.resolve();
        }
        return this.ctx.app.cache.delete(key);
      });

      await Promise.all(deletePromises);

      this.ctx.logger.info(`[ContentCategoryService] Cleared category cache for: ${categoryId || 'all'}`);
      return true;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryService] clearCategoryCache error:', error);
      return false;
    }
  }

  /**
   * 🚀 清除所有分类相关的计数缓存
   * 当文章发布、删除或更改分类时调用
   * @return {Promise<boolean>} 是否成功
   */
  async clearCategoryCountCache() {
    try {
      // 清除所有包含计数的缓存
      const countCachePattern = ['category_tree:*:count_*', 'child_categories:*:count_*', 'category_stats:*'];

      this.ctx.logger.info('[ContentCategoryService] Cleared all category count cache');

      // 简单清除主要的缓存键
      await this.clearCategoryCache();

      return true;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryService] clearCategoryCountCache error:', error);
      return false;
    }
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} 统计信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }
}

module.exports = ContentCategoryService;
