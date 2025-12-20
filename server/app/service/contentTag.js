/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: ContentTag 服务 - 使用 Repository 模式
 */

'use strict';
const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class ContentTagService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 ContentTag Repository
    this.repository = this.repositoryFactory.createContentTagRepository(ctx);
  }

  /**
   * 查找标签列表
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise} 查询结果
   */
  async find(payload, options = {}) {
    // 使用标准化参数格式
    const standardOptions = {
      sort: options.sort || [{ field: 'createdAt', order: 'desc' }],
      ...options,
    };

    return await this.repository.find(payload, standardOptions);
  }

  /**
   * 根据查询条件获取单个标签
   * @param params
   * @param options
   */
  async findOne(params = {}, options = {}) {
    return await this.repository.findOne(params, options);
  }

  /**
   * 统计标签数量
   * @param {Object} params 查询条件
   * @return {Promise<Number>} 标签数量
   */
  async count(params = {}) {
    return await this.repository.count(params);
  }

  /**
   * 创建标签
   * @param {Object} payload 标签数据
   * @return {Promise<Object>} 创建的标签
   */
  async create(payload) {
    // 🔥 Phase2扩展：Repository层会自动验证唯一性并抛出UniqueConstraintError
    // 无需在Service层重复检查

    // 验证别名唯一性
    if (payload.alias) {
      await this.repository.checkAliasUnique(payload.alias);
    }

    return await this.repository.create(payload);
  }

  /**
   * 删除标签
   * @param {String|Array} values 标签ID
   * @param {String} key 主键字段
   * @return {Promise} 删除结果
   */
  async removes(values, key = 'id') {
    return await this.repository.remove(values, key);
  }

  /**
   * 软删除标签
   * @param {String|Array} values 标签ID
   * @return {Promise} 删除结果
   */
  async safeDelete(values) {
    return await this.repository.safeDelete(values);
  }

  /**
   * 更新标签
   * @param {String} id 标签ID
   * @param {Object} payload 更新数据
   * @return {Promise<Object>} 更新后的标签
   */
  async update(id, payload) {
    // 🔥 Phase2扩展：Repository层会自动验证唯一性（排除当前ID）并抛出UniqueConstraintError
    // 无需在Service层重复检查

    // 验证别名唯一性
    if (payload.alias) {
      await this.repository.checkAliasUnique(payload.alias, id);
    }

    return await this.repository.update(id, payload);
  }

  /**
   * 查找单个标签
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签信息
   */
  async item(options = {}) {
    return await this.repository.findOne(options);
  }

  // ==================== ContentTag 特有业务方法 ====================

  /**
   * 根据标签名查找标签
   * @param {String} name 标签名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签记录
   */
  async findByName(name, options = {}) {
    return await this.repository.findByName(name, options);
  }

  /**
   * 根据别名查找标签
   * @param {String} alias 标签别名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签记录
   */
  async findByAlias(alias, options = {}) {
    return await this.repository.findByAlias(alias, options);
  }

  /**
   * 检查标签名是否已存在
   * @param {String} name 标签名
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否存在
   */
  async checkNameExists(name, excludeId = null) {
    return await this.repository.checkNameExists(name, excludeId);
  }

  /**
   * 检查别名是否已存在
   * @param {String} alias 标签别名
   * @param {String} excludeId 排除的记录ID (用于更新时检查)
   * @return {Promise<Boolean>} 是否存在
   */
  async checkAliasExists(alias, excludeId = null) {
    return await this.repository.checkAliasExists(alias, excludeId);
  }

  /**
   * 按标签名数组搜索标签
   * @param {Array<String>} tagNames 标签名数组
   * @param {Object} options 查询选项
   * @return {Promise<Array<String>>} 匹配的标签ID数组
   */
  async searchByNames(tagNames, options = {}) {
    return await this.repository.searchByNames(tagNames, options);
  }

  /**
   * 查找热门标签
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 热门标签列表
   */
  async findHotTags(payload = {}) {
    // 直接传递完整的 payload 对象给 Repository
    return await this.repository.findHotTags(payload);
  }

  /**
   * 获取标签统计信息
   * @param {String} tagId 标签ID
   * @return {Promise<Object>} 标签统计信息
   */
  async getTagStats(tagId) {
    return await this.repository.getTagStats(tagId);
  }

  /**
   * 批量创建标签（如果不存在）
   * @param {Array<Object>} tagData 标签数据数组
   * @return {Promise<Array<Object>>} 创建或查找到的标签记录
   */
  async createOrFindTags(tagData) {
    return await this.repository.createOrFindTags(tagData);
  }

  /**
   * 获取标签使用频率排行榜
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 标签使用排行榜
   */
  async getTagRankings(payload = {}) {
    return await this.repository.getTagRankings(payload);
  }

  /**
   * 按用途查找相关标签
   * @param {String} keyword 关键词
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 相关标签列表
   */
  async findRelatedTags(keyword, options = {}) {
    return await this.repository.findRelatedTags(keyword, options);
  }

  /**
   * 批量更新标签
   * @param {String|Array} ids 要更新的标签ID或ID数组
   * @param {Object} data 要更新的数据
   * @param {Object} query 额外的查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    return await this.repository.updateMany(ids, data, query);
  }

  /**
   * 清理未使用的标签
   * @return {Promise<Object>} 清理结果
   */
  async cleanupUnusedTags() {
    return await this.repository.cleanupUnusedTags();
  }

  /**
   * 根据ID查找标签
   * @param {String} id 标签ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 标签信息
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 获取所有标签列表（兼容原有接口）
   * @return {Promise<Array>} 所有标签
   */
  async alllist() {
    return await this.find({ isPaging: '0' });
  }

  /**
   * 🔥 检查标签名称是否唯一 - 统一异常处理版本
   * @param {String} name 标签名称
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标签名称已存在时抛出异常
   */
  async checkNameUnique(name, excludeId = null) {
    return await this.repository.checkNameUnique(name, excludeId);
  }

  /**
   * 🔥 检查标签别名是否唯一 - 统一异常处理版本
   * @param {String} alias 标签别名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标签别名已存在时抛出异常
   */
  async checkAliasUnique(alias, excludeId = null) {
    return await this.repository.checkAliasUnique(alias, excludeId);
  }

  /**
   * 🚀 模板标签专用：获取标签列表
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 标签列表
   */
  async getTagsForTemplate(payload = {}) {
    const options = {
      searchKeys: ['name', 'alias'],
      fields: ['id', 'name', 'alias', 'comments', 'status'],
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    const queryPayload = {
      isPaging: payload.isPaging || '0',
      pageSize: payload.pageSize || 20,
      ...payload,
    };

    const result = await this.find(queryPayload, options);

    // 如果是数组格式，直接返回；如果是分页格式，返回 docs
    return Array.isArray(result) ? result : result.docs || [];
  }

  /**
   * 🚀 模板标签专用：获取热门标签
   * @param {Object} payload 查询参数
   * @return {Promise<Array>} 热门标签列表
   */
  async getHotTagsForTemplate(payload = {}) {
    try {
      // 直接使用 findHotTags，它已经处理了参数格式
      const result = await this.findHotTags(payload);

      // 确保返回数组格式
      return Array.isArray(result) ? result : [];
    } catch (error) {
      this.ctx.logger.error('[ContentTagService] getHotTagsForTemplate error:', error);
      // 返回空数组，避免阻塞缓存预热
      return [];
    }
  }

  /**
   * 🚀 批量获取标签信息（用于内容渲染优化）
   * @param {Array} tagIds 标签ID数组
   * @return {Promise<Array>} 标签信息数组
   */
  async batchGetTagsByIds(tagIds = []) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }

    const cacheKey = `batch_tags:${tagIds.sort().join(',')}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const filters = {
          id: { $in: tagIds },
        };

        const options = {
          filters,
          fields: ['id', 'name', 'alias', 'comments'],
        };

        const result = await this.find({ isPaging: '0' }, options);
        return Array.isArray(result) ? result : result.docs || [];
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 🚀 根据标签名获取标签信息（带缓存）
   * @param {String} tagName 标签名
   * @return {Promise<Object|null>} 标签信息
   */
  async getTagByNameWithCache(tagName) {
    if (!tagName) {
      return null;
    }

    const cacheKey = `tag_by_name:${tagName}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        return await this.findOne({
          name: { $eq: tagName },
        });
      },
      3600
    ); // 1小时缓存
  }

  /**
   * 🚀 清除标签相关缓存
   * @param {String} tagId 标签ID（可选）
   * @return {Promise<boolean>} 是否成功
   */
  async clearTagCache(tagId = null) {
    try {
      const cacheKeys = ['template:tags:list', 'template:tags:hot'];

      if (tagId) {
        // 清除特定标签的缓存
        cacheKeys.push('tag_by_name:*');
        cacheKeys.push(`batch_tags:*${tagId}*`);
      }

      const deletePromises = cacheKeys.map(key => {
        if (key.includes('*')) {
          // 对于包含通配符的键，需要特殊处理
          // 这里简化处理，实际可以根据需要实现模糊匹配删除
          return Promise.resolve();
        }
        return this.ctx.app.cache.delete(key);
      });

      await Promise.all(deletePromises);

      this.ctx.logger.info(`[ContentTagService] Cleared tag cache for: ${tagId || 'all'}`);
      return true;
    } catch (error) {
      this.ctx.logger.error('[ContentTagService] clearTagCache error:', error);
      return false;
    }
  }

  /**
   * 🚀 AI标签智能处理：根据标签名查找或创建（优化版）
   * @description 批量处理AI生成的标签名，已存在的直接返回，不存在的自动创建
   * @param {Array<String>} tagNames 标签名数组
   * @return {Promise<Array<Object>>} 标签对象数组
   */
  async findOrCreateByNames(tagNames) {
    if (!Array.isArray(tagNames) || tagNames.length === 0) {
      return [];
    }

    try {
      // 1️⃣ 先批量查询已存在的标签
      const filters = {
        name: { $in: tagNames },
      };

      const existingTagsResult = await this.find(
        {
          isPaging: '0',
        },
        {
          filters,
        }
      );

      // 处理返回结果（可能是数组或分页对象）
      const existingTags = Array.isArray(existingTagsResult) ? existingTagsResult : existingTagsResult.docs || [];

      const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]));

      this.ctx.logger.info(`[ContentTagService] 查询到 ${existingTags.length} 个已存在标签`);

      // 2️⃣ 找出需要创建的新标签
      const tagsToCreate = tagNames.filter(name => !existingTagMap.has(name));

      // 3️⃣ 批量创建新标签
      const newTags = [];
      if (tagsToCreate.length > 0) {
        this.ctx.logger.info(
          `[ContentTagService] 需要创建 ${tagsToCreate.length} 个新标签: ${tagsToCreate.join(', ')}`
        );

        for (const name of tagsToCreate) {
          try {
            const newTag = await this.create({
              name,
              alias: this._generateAlias(name), // 保留别名生成，用于URL友好
              comments: name, // 使用标签名作为备注，便于识别AI生成
            });
            newTags.push(newTag);
            existingTagMap.set(name, newTag);
            this.ctx.logger.info(`[ContentTagService] 成功创建标签: ${name}`);
          } catch (error) {
            this.ctx.logger.warn(`[ContentTagService] 创建标签失败: ${name}`, error);
            // 可能是并发创建导致，尝试再次查询
            const tag = await this.findByName(name);
            if (tag) {
              newTags.push(tag);
              existingTagMap.set(name, tag);
              this.ctx.logger.info(`[ContentTagService] 从数据库中找到标签: ${name}`);
            }
          }
        }

        // 4️⃣ 清理缓存
        if (newTags.length > 0) {
          await this.clearTagCache();
          this.ctx.logger.info('[ContentTagService] 已清理标签缓存');
        }
      }

      // 5️⃣ 返回所有标签（保持原始顺序）
      const result = tagNames.map(name => existingTagMap.get(name)).filter(Boolean);

      this.ctx.logger.info(`[ContentTagService] findOrCreateByNames 完成，返回 ${result.length} 个标签`);

      return result;
    } catch (error) {
      this.ctx.logger.error('[ContentTagService] findOrCreateByNames error:', error);
      throw error;
    }
  }

  /**
   * 生成标签别名（纯英文，符合校验规则）
   * @param {String} name 标签名
   * @return {String} 英文别名
   * @private
   */
  _generateAlias(name) {
    if (!name) {
      return `tag-${Date.now()}`;
    }

    // 1️⃣ 提取英文字符、数字和连字符
    let alias = name
      .toLowerCase()
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/[^a-z0-9\-]/g, ''); // 只保留英文字母、数字和连字符

    // 2️⃣ 如果提取后为空（全是中文），生成一个唯一的英文别名
    if (!alias || alias === '-' || /^-+$/.test(alias)) {
      // 使用时间戳确保唯一性
      const timestamp = Date.now().toString(36); // 转为36进制，更短
      alias = `tag-${timestamp}`;
    }

    // 3️⃣ 清理连续的连字符，移除首尾连字符
    alias = alias
      .replace(/-+/g, '-') // 多个连字符替换为一个
      .replace(/^-+|-+$/g, ''); // 移除首尾连字符

    // 4️⃣ 如果清理后为空，使用默认值
    if (!alias) {
      alias = `tag-${Date.now().toString(36)}`;
    }

    // 5️⃣ 限制长度
    return alias.substring(0, 50);
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} 统计信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }
}

module.exports = ContentTagService;
