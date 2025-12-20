/**
 * 优化后的 ContentCategory MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 ContentCategory 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 ContentCategory 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 ContentCategory 特有的业务逻辑 - 树形结构、路径管理
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持复杂字段处理
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const ContentCategorySchema = require('../../schemas/mariadb/ContentCategorySchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class ContentCategoryMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'ContentCategory');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例，避免依赖连接管理器的缓存
      this.model = ContentCategorySchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // ContentCategory 可能有关联的内容模板
          // template: {
          //   model: 'ContentTemplate',
          //   as: 'template',
          //   foreignKey: 'contentTemp'
          // },
        },
      });

      // console.log('✅ ContentCategoryMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ ContentCategoryMariaRepository initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保连接已建立
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 🔥 重写基类的抽象方法 - ContentCategory 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // 根据需要添加默认关联查询
      // { model: 'ContentTemplate', as: 'template', attributes: ['name', 'alias', 'forder'] },
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
      { field: 'sortId', order: 'asc' }, // 排序字段优先
      { field: 'createdAt', order: 'desc' }, // 创建时间
    ];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.BOOLEAN_STATUS_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从ContentCategorySchema获取所有字段，大幅减少维护成本
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 只需要定义需要排除的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // ContentCategory模块特有的需要排除的字段
    const categoryExcludeFields = [
      'children', // 虚拟字段 - 树形结构子节点
      'template', // 关联字段 - 内容模板
      'contents', // 关联字段 - 关联内容
      'url', // 虚拟字段 - 计算得出的URL
      'statusText', // 虚拟字段 - 状态文本
      'typeText', // 虚拟字段 - 类型文本
    ];

    return [...baseExcludeFields, ...categoryExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - ContentCategory 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加 ContentCategory 特有的数据处理
    // 添加分类类型文本
    if (item.type) {
      item.typeText = this._getCategoryTypeText(item.type);
    }

    // 添加虚拟URL字段
    if (item.defaultUrl && item.id) {
      item.url = `/${item.defaultUrl}___${item.id}`;
    }

    // 添加层级深度信息
    if (item.sortPath) {
      const pathArray = item.sortPath.split(',').filter(id => id && id !== '0');
      item.depth = pathArray.length;
    }

    // 确保数组字段的默认值
    item.children = item.children || [];

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - ContentCategory 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 ContentCategory 特有的创建前处理
    // 设置默认值
    if (!data.type) data.type = '1'; // 默认普通分类
    if (typeof data.enable === 'undefined') data.enable = true; // 默认启用
    if (!data.sortId) data.sortId = 1; // 默认排序
    if (!data.parentId) data.parentId = 0; // 默认根级
    if (!data.sortPath) data.sortPath = '0'; // 默认根路径
    if (!data.homePage) data.homePage = 'ui'; // 默认首页标识

    // 🔥 处理 contentTemp 字段：空字符串转换为 null
    if (data.contentTemp === '' || data.contentTemp === undefined) {
      data.contentTemp = null;
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - ContentCategory 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 ContentCategory 特有的更新前处理
    // 🔥 处理 contentTemp 字段：空字符串转换为 null
    if (data.contentTemp === '' || data.contentTemp === undefined) {
      data.contentTemp = null;
    }

    return data;
  }

  // ===== 🔥 重写基类方法 - 添加 ContentCategory 特殊逻辑 =====

  /**
   * 重写基类的 find 方法，添加树形结构处理逻辑
   * @param {Object} payload 查询参数
   * @param {Object} options 选项
   * @return {Promise} 查询结果
   */
  async find(payload = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 调用基类的 find 方法
      const result = await super.find(payload, options);

      // 🔥 ContentCategory 特有逻辑：如果需要树形结构处理（通过 payload.flat 控制）
      if (!payload.flat && result && result.docs) {
        // 分页结果的树形处理
        result.docs = this.buildCategoryTree(result.docs, options?.filters?.parentId?.$eq);
      } else if (!payload.flat && Array.isArray(result)) {
        // 非分页结果的树形处理
        return this.buildCategoryTree(result, options?.filters?.parentId?.$eq);
      }

      return result;
    } catch (error) {
      this._handleError(error, 'find', { payload, options });
    }
  }

  // ===== 🔥 ContentCategory 特有的业务方法 =====

  /**
   * 🔧 判断是否为顶层分类的 parentId (MariaDB专用)
   * @param {String|Number} parentId 父级分类ID
   * @return {Boolean} 是否为顶层分类
   */
  isTopLevelParentId(parentId) {
    // MariaDB 模式：0, '0', null, undefined 都视为顶层
    return !parentId || parentId === 0 || parentId === '0' || parentId === null;
  }

  /**
   * 🔧 获取顶层分类的过滤条件 (MariaDB专用)
   * @return {Object} 过滤条件
   */
  getTopLevelCategoryFilters() {
    return {
      enable: { $eq: true },
      $or: [
        { parentId: { $eq: 0 } }, // MariaDB 主要格式：整数 0
        { parentId: { $eq: '0' } }, // 兼容字符串格式
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
    await this._ensureConnection();

    const filters = this.getTopLevelCategoryFilters();
    const defaultOptions = {
      filters,
      sort: options.sort || [{ field: 'sortId', order: 'asc' }],
    };

    const result = await this.find({ isPaging: '0', pageSize: 1000, lean: '1' }, defaultOptions);
    return Array.isArray(result) ? result : result.docs || [];
  }

  /**
   * 检查分类名称是否唯一（同级别下）- 统一异常处理版本
   * @param {String} name 分类名称
   * @param {String} parentId 父级ID
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当名称已存在时抛出异常
   */
  async checkNameUnique(name, parentId = 0, excludeId = null) {
    await this._ensureConnection();

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
    await this._ensureConnection();

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
   * 检查分类是否可以删除（无子分类和关联内容）- 统一异常处理版本
   * @param {String} categoryId 分类ID
   * @return {Promise<Boolean>} 是否可以删除
   * @throws {BusinessRuleError} 当分类有子分类或关联内容时抛出异常
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
   * @param {String|Number} parentId 父级ID，默认 '0'
   * @return {Array} 树形结构的分类
   */
  buildCategoryTree(categoryList, parentId = '0') {
    const tree = [];

    for (const category of categoryList) {
      // 处理根级节点和普通父子关系
      if (this.isTopLevelParentId(category.parentId) && this.isTopLevelParentId(parentId)) {
        // 根级节点
        const children = this.buildCategoryTree(categoryList, category.id);
        if (children.length > 0) {
          category.children = children;
        }
        tree.push(category);
      } else if (String(category.parentId) === String(parentId)) {
        // 子节点 - 使用字符串比较来处理类型差异
        const children = this.buildCategoryTree(categoryList, category.id);
        if (children.length > 0) {
          category.children = children;
        }
        tree.push(category);
      }
    }

    // 按 sortId 字段排序
    return tree.sort((a, b) => (a.sortId || 0) - (b.sortId || 0));
  }

  /**
   * 根据父级ID查找子分类
   * @param {String} parentId 父级ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 子分类列表
   */
  async findByParentId(parentId = 0, options = {}) {
    await this._ensureConnection();

    try {
      const filters = { parentId };
      const result = await this.find({ pageSize: 1000, flat: true }, { ...options, filters });

      this._logOperation('findByParentId', { parentId, options }, result);
      return result.data || result.docs || result;
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
    await this._ensureConnection();

    try {
      const filters = { type };
      const result = await this.find({ pageSize: 1000, flat: true }, { ...options, filters });

      this._logOperation('findByType', { type, options }, result);
      return result.data || result.docs || result;
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
    await this._ensureConnection();

    try {
      const filters = { enable: true };
      const result = await this.find({ pageSize: 1000, flat: true }, { ...options, filters });

      this._logOperation('findEnabled', { options }, result);
      return result.data || result.docs || result;
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
    await this._ensureConnection();

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
    await this._ensureConnection();

    try {
      const ids = [parseInt(categoryId)];

      // 递归获取所有子分类ID
      const getChildrenIds = async parentId => {
        const children = await this.findByParentId(String(parentId));
        for (const child of children) {
          ids.push(child.id);
          await getChildrenIds(child.id);
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
    await this._ensureConnection();

    try {
      const searchCondition = this._buildSearchCondition(keyword, options.searchKeys || this._getDefaultSearchKeys());

      const result = await this.model.findAll({
        where: searchCondition,
        order: [
          ['sortId', 'ASC'],
          ['createdAt', 'DESC'],
        ],
        ...options,
      });

      const processedResult = result.map(item => this._deepToJSON(item));
      this._logOperation('searchByKeyword', { keyword, options }, processedResult);
      return processedResult;
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
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      const result = await this.model.update(
        { enable, updatedAt: new Date() },
        { where: { id: { [this.Op.in]: idArray } } }
      );

      this._logOperation('batchUpdateStatus', { categoryIds, enable }, result);
      return { success: result[0] > 0, updated: result[0] };
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
    await this._ensureConnection();

    try {
      const whereCondition = {};
      if (categoryId) {
        whereCondition.parentId = categoryId;
      }

      const totalCount = await this.model.count({ where: whereCondition });
      const enabledCount = await this.model.count({
        where: { ...whereCondition, enable: true },
      });

      const stats = {
        total: totalCount,
        enabled: enabledCount,
        disabled: totalCount - enabledCount,
      };

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
    await this._ensureConnection();

    try {
      const updateData = {};

      if (parentId === 0) {
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
        // 🔥 直接使用 Sequelize update，跳过字段验证避免 "分类名称不能为空" 错误
        await this.model.update(updateData, {
          where: { id: categoryId },
          validate: false, // 跳过验证，只更新路径字段
        });

        // 获取更新后的记录
        const result = await this.findById(categoryId);
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
    await this._ensureConnection();

    try {
      const result = await this.model.update({ contentTemp, updatedAt: new Date() }, { where: { parentId } });

      this._logOperation('updateChildrenTemplate', { parentId, contentTemp }, result);
      return { success: result[0] > 0, updated: result[0] };
    } catch (error) {
      this._handleError(error, 'updateChildrenTemplate', { parentId, contentTemp });
    }
  }

  // ===== 辅助方法 =====

  /**
   * 获取分类类型文本
   * @param {String} type 分类类型值
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

  // ===== 🔥 新增关联查询方法 =====

  /**
   * 查找分类及其关联的内容数量
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 分类列表（包含内容数量）
   */
  async findWithContentCount(query = {}, options = {}) {
    try {
      const result = await this.model.findAll({
        where: query,
        include: [
          {
            model: this.app.model.Content,
            as: 'contents',
            attributes: [], // 不返回内容详情，只用于统计
            through: { attributes: [] }, // 不返回中间表数据
          },
        ],
        attributes: {
          include: [[this.sequelize.fn('COUNT', this.sequelize.col('contents.id')), 'contentCount']],
        },
        group: ['ContentCategory.id'],
        ...options,
      });

      return result;
    } catch (error) {
      this._handleError(error, 'findWithContentCount', { query, options });
    }
  }

  /**
   * 查找分类的所有关联内容
   * @param {String} categoryId 分类ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 内容列表
   */
  async findCategoryContents(categoryId, options = {}) {
    try {
      const category = await this.model.findByPk(categoryId, {
        include: [
          {
            model: this.app.model.Content,
            as: 'contents',
            through: {
              attributes: ['relation_type', 'sort_order'], // 返回关联信息
            },
            ...options,
          },
        ],
      });

      return category ? category.contents : [];
    } catch (error) {
      this._handleError(error, 'findCategoryContents', { categoryId, options });
    }
  }

  /**
   * 检查分类层级关系
   * @param {String} categoryId 分类ID
   * @param {String} parentId 父分类ID
   * @return {Promise<Boolean>} 是否为父子关系
   */
  async checkParentChildRelation(categoryId, parentId) {
    try {
      const category = await this.findById(categoryId);
      if (!category) {
        return false;
      }

      // 🔥 使用 Schema 中定义的原型方法
      return category.isChildOf(parentId);
    } catch (error) {
      this._handleError(error, 'checkParentChildRelation', { categoryId, parentId });
    }
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

    await this._ensureConnection();

    try {
      const { state = '2', draft = '0' } = options;
      const contentCounts = {};

      // 使用原生SQL查询优化性能，通过关联表统计
      const query = `
        SELECT 
          ccr.category_id,
          COUNT(DISTINCT c.id) as content_count
        FROM content_category_relations ccr
        INNER JOIN contents c ON ccr.content_id = c.id
        WHERE ccr.category_id IN (:categoryIds)
          AND c.state = :state
          AND c.draft = :draft
        GROUP BY ccr.category_id
      `;

      const results = await this.connection.getSequelize().query(query, {
        replacements: {
          categoryIds,
          state,
          draft,
        },
        type: this.connection.getSequelize().QueryTypes.SELECT,
      });

      // 初始化所有分类的计数为0
      categoryIds.forEach(id => {
        contentCounts[id] = 0;
      });

      // 填充实际统计结果
      results.forEach(row => {
        contentCounts[row.category_id] = parseInt(row.content_count) || 0;
      });

      return contentCounts;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryMariaRepository] batchGetContentCounts error:', error);

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

      return categoryList;
    } catch (error) {
      this.ctx.logger.error('[ContentCategoryMariaRepository] enrichCategoryListWithCount error:', error);

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
        if (category.id) {
          allIds.push(category.id);
        }

        // 递归处理子分类
        if (category.children && Array.isArray(category.children)) {
          extractIds(category.children);
        }
      });
    };

    extractIds(categoryList);
    return [...new Set(allIds)]; // 去重
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
        if (category.id) {
          category.contentCount = contentCounts[category.id] || 0;
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

module.exports = ContentCategoryMariaRepository;
