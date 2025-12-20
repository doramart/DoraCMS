/**
 * 优化后的 ContentTag MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 ContentTag 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 ContentTag 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 ContentTag 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const ContentTagSchema = require('../../schemas/mariadb/ContentTagSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');

class ContentTagMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'ContentTag');

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
      this.model = ContentTagSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // ContentTag 通常不需要复杂的关联关系
          // 如果有关联，可以在这里定义
        },
      });

      // console.log('✅ ContentTagMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ ContentTagMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - ContentTag 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // ContentTag 通常不需要关联查询
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'alias', 'comments'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      0: '已删除',
      1: '禁用',
      2: '启用',
    };
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从Schema获取所有字段，大幅减少维护成本
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

    // ContentTag模块特有的需要排除的字段
    const moduleExcludeFields = [
      // 通常ContentTag没有复杂的关联字段需要排除
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - ContentTag 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加 ContentTag 特有的数据处理
    // 添加 URL 字段
    if (item.name) {
      item.url = `/tag/${item.name}`;
    }

    // 确保默认值
    item.comments = item.comments || '';

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - ContentTag 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加ContentTag特有的创建前处理和验证

    // 验证必填字段
    if (!data.name || data.name.trim() === '') {
      throw this.exceptions.contentTag.nameRequired();
    }

    // 验证字段长度
    if (data.name && data.name.length > 100) {
      throw this.exceptions.contentTag.nameTooLong(100);
    }

    if (data.alias && data.alias.length > 100) {
      throw this.exceptions.contentTag.aliasTooLong(100);
    }

    // 验证别名格式
    if (data.alias && !/^[a-zA-Z0-9-_]+$/.test(data.alias)) {
      throw this.exceptions.contentTag.invalidAlias(data.alias);
    }

    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 设置默认别名
    if (!data.alias && data.name) {
      data.alias = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');
    }

    // 设置默认值
    if (!data.enable) data.enable = 1; // 默认启用

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - ContentTag 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加ContentTag特有的更新前处理和验证

    // 验证字段长度（更新时name可能为空，所以只验证存在时）
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw this.exceptions.contentTag.nameRequired();
      }
      if (data.name.length > 100) {
        throw this.exceptions.contentTag.nameTooLong(100);
      }
    }

    if (data.alias !== undefined && data.alias && data.alias.length > 100) {
      throw this.exceptions.contentTag.aliasTooLong(100);
    }

    // 验证别名格式
    if (data.alias !== undefined && data.alias && !/^[a-zA-Z0-9-_]+$/.test(data.alias)) {
      throw this.exceptions.contentTag.invalidAlias(data.alias);
    }

    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    return data;
  }

  // ===== 🔥 基类已实现的完整CRUD方法（无需重复实现） =====
  // find(), findOne(), findById(), count(), create(), update(), remove(), safeDelete()
  // 等方法已在 BaseMariaRepository 中实现，子类直接继承使用

  // ===== 🔥 ContentTag 特有的业务方法 =====

  /**
   * 根据名称查找标签
   * @param {String} name 标签名称
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签对象
   */
  async findByName(name, options = {}) {
    try {
      const query = { name: { $eq: name } };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByName', { name, options });
    }
  }

  /**
   * 根据别名查找标签
   * @param {String} alias 标签别名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签对象
   */
  async findByAlias(alias, options = {}) {
    try {
      const query = { alias: { $eq: alias } };
      return await this.findOne(query, options);
    } catch (error) {
      this._handleError(error, 'findByAlias', { alias, options });
    }
  }

  /**
   * 根据标签名称数组模糊搜索标签（支持 name 和 alias 字段）
   * @param {Array<String>} tagNames 标签名称数组
   * @return {Promise<Array<Object>>} 匹配的标签对象数组
   */
  async searchByNames(tagNames) {
    try {
      if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return [];
      }

      await this._ensureConnection();

      // 获取 Sequelize 操作符
      // 构建 MariaDB 的 OR 查询条件
      const orConditions = [];

      tagNames.forEach(tagName => {
        // 对每个标签名，添加 name 和 alias 字段的模糊匹配条件
        // 使用 like 操作符配合 UPPER/LOWER 函数实现不区分大小写的匹配
        orConditions.push(
          { name: { [this.Op.like]: `%${tagName}%` } }, // 模糊匹配 name 字段
          { alias: { [this.Op.like]: `%${tagName}%` } } // 模糊匹配 alias 字段
        );
      });

      // 构建最终的查询条件
      const whereCondition = {
        [this.Op.or]: orConditions,
        // state: { [this.Op.ne]: '0' }, // 排除已删除的标签
      };

      // 执行查询
      const result = await this.model.findAll({
        where: whereCondition,
        order: [
          ['sortId', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });

      // 转换数据格式
      const transformedResult = result.map(item => item.id);

      this._logOperation('searchByNames', { tagNames, conditionsCount: orConditions.length }, transformedResult);
      return transformedResult;
    } catch (error) {
      this._handleError(error, 'searchByNames', { tagNames });
    }
  }

  /**
   * 🔥 统一异常处理版本：检查标签名称唯一性
   * @param {String} name 标签名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标签名称已存在时抛出异常
   */
  async checkNameUnique(name, excludeId = null) {
    await this._ensureConnection();

    try {
      const isUnique = await UniqueChecker.checkTagNameUnique(this, name, excludeId);
      if (!isUnique) {
        throw this.exceptions.contentTag.nameExists(name);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkNameUnique', { name, excludeId });
    }
  }

  /**
   * 🔥 统一异常处理版本：检查别名唯一性
   * @param {String} alias 标签别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当别名已存在时抛出异常
   */
  async checkAliasUnique(alias, excludeId = null) {
    await this._ensureConnection();

    try {
      const isUnique = await UniqueChecker.checkTagAliasUnique(this, alias, excludeId);
      if (!isUnique) {
        throw this.exceptions.contentTag.aliasExists(alias);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkAliasUnique', { alias, excludeId });
    }
  }

  /**
   * 🔥 兼容旧接口：检查标签名称是否已存在（返回布尔值）
   * @param {String} name 标签名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkNameExists(name, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkTagNameUnique(this, name, excludeId);
      return !isUnique;
    } catch (error) {
      this._handleError(error, 'checkNameExists', { name, excludeId });
      return false;
    }
  }

  /**
   * 查找热门标签
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 热门标签列表
   */
  async findHotTags(payload = {}) {
    await this._ensureConnection();

    try {
      // 从 payload 中提取 limit 参数，保持向后兼容
      const limit = payload.limit || payload.pageSize || 10;

      const queryOptions = {
        where: {
          // 动态构建 where 条件，只使用存在的字段
        },
        order: [],
        limit,
      };

      // 动态构建排序条件，只使用存在的字段
      if (this.model.rawAttributes.usageCount) {
        queryOptions.order.push(['usageCount', 'DESC']); // 按使用次数降序
      }
      if (this.model.rawAttributes.sortId) {
        queryOptions.order.push(['sortId', 'ASC']); // 按排序ID升序
      }
      if (this.model.rawAttributes.createdAt) {
        queryOptions.order.push(['createdAt', 'DESC']); // 按创建时间降序
      }

      // 如果没有排序字段，至少按 id 排序
      if (queryOptions.order.length === 0) {
        queryOptions.order.push(['id', 'ASC']);
      }

      // 动态检查并添加存在的字段条件
      if (this.model.rawAttributes.state) {
        queryOptions.where.state = { [this.Op.ne]: '0' };
      }

      if (this.model.rawAttributes.isHot) {
        queryOptions.where.isHot = true;
      }

      if (this.model.rawAttributes.enable) {
        queryOptions.where.enable = true;
      }

      // 如果没有合适的筛选条件，至少确保有基本的排序
      if (Object.keys(queryOptions.where).length === 0) {
        // 没有筛选条件时，只按创建时间和排序ID排序
        queryOptions.where = {}; // 空的 where 条件
      }

      const result = await this.model.findAll(queryOptions);
      return result.map(item => item.toJSON());
    } catch (error) {
      this._handleError(error, 'findHotTags', { payload });
      return [];
    }
  }

  /**
   * 获取标签统计信息
   * @return {Promise<Object>} 统计信息
   */
  async getTagStats() {
    await this._ensureConnection();

    try {
      const stats = await this.model.findAll({
        attributes: [
          'state',
          [this.connection.getSequelize().fn('COUNT', this.connection.getSequelize().col('id')), 'count'],
        ],
        group: ['state'],
        raw: true,
      });

      const result = {
        total: 0,
        published: 0,
        draft: 0,
        deleted: 0,
      };

      stats.forEach(stat => {
        const count = parseInt(stat.count, 10);
        result.total += count;

        switch (stat.state) {
          case '0':
            result.deleted = count;
            break;
          case '1':
            result.draft = count;
            break;
          case '2':
            result.published = count;
            break;
        }
      });

      return result;
    } catch (error) {
      this._handleError(error, 'getTagStats', {});
      return { total: 0, published: 0, draft: 0, deleted: 0 };
    }
  }

  /**
   * 获取标签排行榜
   * @param {Number} limit 限制数量，默认 20
   * @return {Promise<Array>} 标签排行榜
   */
  async getTagRankings(limit = 20) {
    await this._ensureConnection();

    try {
      const queryOptions = {
        where: {
          state: { [this.Op.ne]: '0' },
        },
        order: [
          ['refCount', 'DESC'],
          ['createdAt', 'ASC'],
        ],
        limit,
        attributes: ['id', 'name', 'alias', 'refCount', 'isHot'],
      };

      const result = await this.model.findAll(queryOptions);
      return result.map(item => item.toJSON());
    } catch (error) {
      this._handleError(error, 'getTagRankings', { limit });
      return [];
    }
  }

  /**
   * 🔥 兼容旧接口：检查别名是否已存在（返回布尔值）
   * @param {String} alias 标签别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkAliasExists(alias, excludeId = null) {
    try {
      const isUnique = await UniqueChecker.checkTagAliasUnique(this, alias, excludeId);
      return !isUnique;
    } catch (error) {
      this._handleError(error, 'checkAliasExists', { alias, excludeId });
      return false;
    }
  }

  /**
   * 查找相关标签
   * @param {String} keyword 关键词
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 相关标签列表
   */
  async findRelatedTags(keyword, options = {}) {
    try {
      const { limit = 10 } = options;
      const queryOptions = {
        searchkey: keyword,
        sort: [{ field: 'createdAt', order: 'desc' }],
        pagination: { page: 1, pageSize: limit, isPaging: true },
      };

      const result = await this.find(queryOptions, {
        searchKeys: this._getDefaultSearchKeys(),
      });
      return result.docs || [];
    } catch (error) {
      this._handleError(error, 'findRelatedTags', { keyword, options });
      return [];
    }
  }

  /**
   * 获取标签统计信息
   * @param {String} tagId 标签ID
   * @return {Promise<Object>} 标签统计信息
   */
  async getTagStats(tagId) {
    try {
      const tag = await this.findById(tagId);
      return {
        id: tagId,
        name: tag?.name || '',
        totalUsage: tag?.usageCount || 0,
      };
    } catch (error) {
      this._handleError(error, 'getTagStats', { tagId });
      return { id: tagId, name: '', totalUsage: 0 };
    }
  }

  /**
   * 获取标签使用频率排行榜
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 标签使用排行榜
   */
  async getTagRankings(payload = {}) {
    try {
      const { limit = 20 } = payload;
      const options = {
        sort: [
          { field: 'usageCount', order: 'desc' },
          { field: 'createdAt', order: 'desc' },
        ],
        pagination: { page: 1, pageSize: limit, isPaging: true },
      };

      const result = await this.find({}, options);
      return result.docs || [];
    } catch (error) {
      this._handleError(error, 'getTagRankings', { payload });
      return [];
    }
  }

  /**
   * 批量创建或查找标签
   * @param {Array} tagData 标签数据数组
   * @return {Promise<Array>} 标签对象数组
   */
  async createOrFindTags(tagData) {
    try {
      if (!Array.isArray(tagData) || tagData.length === 0) {
        return [];
      }

      // 🔥 检查批量数据中是否有重复的标签名称
      const names = tagData.map(data => (typeof data === 'string' ? data : data.name)).filter(Boolean);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        throw this.exceptions.contentTag.duplicateInBatch(duplicates);
      }

      const tags = [];
      for (const data of tagData) {
        const name = typeof data === 'string' ? data : data.name;
        if (!name) continue;

        let tag = await this.findByName(name);
        if (!tag) {
          // 创建新标签
          tag = await this.create({
            name,
            alias: typeof data === 'object' ? data.alias : name.toLowerCase().replace(/\s+/g, '-'),
            comments: typeof data === 'object' ? data.comments : '',
          });
        }
        tags.push(tag);
      }

      return tags;
    } catch (error) {
      this._handleError(error, 'createOrFindTags', { tagData });
      return [];
    }
  }

  /**
   * 批量更新标签
   * @param {String|Array} ids 要更新的标签ID或ID数组
   * @param {Object} data 要更新的数据
   * @param {Object} query 额外的查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    await this._ensureConnection();

    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const mariadbIds = idArray.map(id => this.transformer.transformQueryForMariaDB({ id }).id);

      const whereCondition = {
        id: { [this.Op.in]: mariadbIds },
        ...this.transformer.transformQueryForMariaDB(query),
      };

      const [result] = await this.model.update(data, { where: whereCondition });

      this._logOperation('updateMany', { ids, data, query }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'updateMany', { ids, data, query });
      return { modifiedCount: 0 };
    }
  }

  /**
   * 清理未使用的标签
   * @return {Promise<Object>} 清理结果
   */
  async cleanupUnusedTags() {
    try {
      // ContentTag模型比较简单，暂时不实现复杂的清理逻辑
      return { deletedCount: 0 };
    } catch (error) {
      this._handleError(error, 'cleanupUnusedTags', {});
      return { deletedCount: 0 };
    }
  }
}

module.exports = ContentTagMariaRepository;
