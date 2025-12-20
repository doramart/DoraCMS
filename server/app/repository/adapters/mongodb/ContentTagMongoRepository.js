/**
 * 标准化的 ContentTag MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const _ = require('lodash');

class ContentTagMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'ContentTag');

    // 设置 MongoDB 模型
    this.model = this.app.model.ContentTag;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // ContentTag 通常不需要复杂的关联关系
        // 如果有关联，可以在这里定义
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
      // ContentTag 通常不需要关联查询
    ];
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

  // ===== 🔥 基类已实现的完整CRUD方法（无需重复实现） =====
  // find(), findOne(), findById(), count(), create(), update(), remove(), safeDelete()
  // 等方法已在 BaseMongoRepository 中实现，子类直接继承使用

  // ===== 🔥 ContentTag 业务特有方法实战模板（基于Admin/Menu/Role模块经验） =====

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

      // 构建查询条件，使用 $or 来匹配任意一个标签名称
      const orConditions = tagNames.map(tagName => ({
        $or: [
          { name: { $regex: tagName, $options: 'i' } }, // 模糊匹配 name 字段，不区分大小写
          { alias: { $regex: tagName, $options: 'i' } }, // 模糊匹配 alias 字段，不区分大小写
        ],
      }));

      // 使用 $or 来匹配任意一个条件
      const query = {
        $or: orConditions.flat(),
        // state: { $ne: '0' }, // 排除已删除的标签
      };

      // 使用统一的查询接口
      const result = await this.model.find(query, '_id').lean().exec();

      this._logOperation('searchByNames', { tagNames, queryConditions: orConditions.length }, result);
      return result.map(tag => tag._id);
    } catch (error) {
      this._handleError(error, 'searchByNames', { tagNames });
    }
  }

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建标签（自动验证唯一性）
   * @param {Object} data 标签数据
   * @return {Promise<Object>} 创建的标签
   * @throws {UniqueConstraintError} 当name不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性
      if (data.name) {
        await this.checkNameUnique(data.name);
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
   * 更新标签（自动验证唯一性）
   * @param {String} id 标签ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的标签
   * @throws {UniqueConstraintError} 当name不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（排除当前ID）
      if (data.name) {
        await this.checkNameUnique(data.name, id);
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

  // ===== 🔥 ContentTag 特有的业务方法 =====

  /**
   * 🔥 统一异常处理版本：检查标签名称唯一性
   * @param {String} name 标签名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标签名称已存在时抛出异常
   */
  async checkNameUnique(name, excludeId = null) {
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
   * 查找热门标签
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 热门标签列表
   */
  async findHotTags(payload = {}) {
    try {
      const { limit = 10 } = payload;
      const options = {
        filters: {
          // ContentTag模型没有isHot字段，使用其他条件
        },
        sort: [{ field: 'createdAt', order: 'desc' }],
        pagination: { page: 1, pageSize: limit, isPaging: true },
      };

      const result = await this.find({}, options);
      return result.docs || [];
    } catch (error) {
      this._handleError(error, 'findHotTags', { payload });
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
        totalUsage: 0, // 需要根据实际业务实现
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
        sort: [{ field: 'createdAt', order: 'desc' }],
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
   * 按关键词查找相关标签
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
   * 批量更新标签
   * @param {String|Array} ids 要更新的标签ID或ID数组
   * @param {Object} data 要更新的数据
   * @param {Object} query 额外的查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const updateQuery = {
        _id: { $in: idArray },
        ...query,
      };

      // 🔥 检查是否包含 MongoDB 操作符（如 $inc, $set, $unset）
      const hasMongoOperators = data.$inc || data.$set || data.$unset || data.$push || data.$pull;
      const updateData = hasMongoOperators ? data : { $set: data };

      const result = await this.model.updateMany(updateQuery, updateData);

      this._logOperation('updateMany', { ids, data, query }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'updateMany', { ids, data, query });
      return { modifiedCount: 0 };
    }
  }

  // ===== 🔥 基类钩子方法重写 - 用于业务特定逻辑 =====

  /**
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 🔥 添加ContentTag特有的数据处理
    // 添加 URL 字段
    if (item.name) {
      item.url = `/tag/${item.name}`;
    }

    // 确保数组字段的默认值
    item.comments = item.comments || '';

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
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

    // 设置默认别名
    if (!data.alias && data.name) {
      data.alias = data.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（业务特定逻辑）
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

    return data;
  }
}

module.exports = ContentTagMongoRepository;
