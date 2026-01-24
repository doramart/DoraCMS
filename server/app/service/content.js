/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Content 服务 - 使用 Repository 模式
 */

'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const _ = require('lodash');
const siteFunc = require('../utils/siteFunc');
const xss = require('xss');
class ContentService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Content Repository
    this.repository = this.repositoryFactory.createContentRepository(ctx);
  }

  /**
   * 查找内容列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 查找单条内容
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 内容对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找内容
   * @param {String} id 内容ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 内容对象
   */
  async findById(id, options = {}) {
    const content = await this.repository.findById(id, options);
    if (!content) return null;

    // 获取当前用户ID (支持从options传入或从session获取)
    let userId = options.userId;
    if (!userId && this.ctx.session?.user) {
      userId = this.ctx.session.user.id;
    }

    // 补充交互数据
    const renderedList = await this.renderContentListOptimized(userId, [content]);
    return renderedList[0];
  }

  /**
   * 统计内容数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 内容数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建内容
   * @param {Object} data 内容数据
   * @return {Promise<Object>} 创建的内容
   */
  async create(data) {
    const content = await this.repository.create(data);

    // 🔥 触发 Webhook 事件：content.created
    try {
      await this.ctx.service.webhook.triggerEvent('content.created', {
        contentId: content.id,
        title: content.title,
        author: content.author || content.uAuthor,
        state: content.state,
        createdAt: content.createdAt,
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[Content] Failed to trigger webhook for content.created:', error);
    }

    return content;
  }

  /**
   * 创建内容（带完整预处理）
   * 包含：数据构建、显示模式处理、标签处理、XSS 防护
   *
   * 预处理步骤：
   * 1. 解析关键词（字符串 → 数组）
   * 2. XSS 处理（discription, comments, simpleComments）
   * 3. 检测内容显示类型（文本/图片/视频）
   * 4. 提取图片和视频数组
   * 5. 渲染简化内容
   * 6. 处理新标签创建
   * 7. 设置默认值和作者信息
   *
   * @param {Object} sourceData 源数据
   * @param {Object} options 配置选项
   * @param {String} options.author 管理员作者 ID（后台发布时使用）
   * @param {String} options.uAuthor 普通用户作者 ID（前台发布时使用）
   * @param {String} options.authorType 作者类型：'admin' | 'user'（用于智能判断）
   * @param {Object} options.ctx 上下文（用于标签创建）
   * @param {Boolean} options.skipValidation 跳过验证（默认 false）
   * @return {Promise<Object>} 创建的内容
   */
  async createWithPreprocessing(sourceData, options = {}) {
    const { author, uAuthor, authorType, ctx } = options;

    // 🔥 优化：支持前台用户和后台管理员两种场景
    // 至少需要提供 author 或 uAuthor 之一
    if (!author && !uAuthor) {
      throw new Error('At least one of author or uAuthor is required for createWithPreprocessing');
    }

    // 1. 构建内容对象
    const contentFormObj = this._buildContentFormObj(sourceData, {
      isUpdate: false,
    });

    // 2. 处理显示模式（传递实际的作者 ID）
    const authorIdForDisplay = author || uAuthor;
    this._processContentDisplay(contentFormObj, authorIdForDisplay, sourceData.comments);

    // 3. 🔥 根据作者类型设置正确的作者字段
    if (authorType === 'admin' || author) {
      contentFormObj.author = author || null; // 使用 null 而不是空字符串（兼容 MariaDB integer 类型）
      contentFormObj.uAuthor = null;
    } else if (authorType === 'user' || uAuthor) {
      contentFormObj.uAuthor = uAuthor || null;
      contentFormObj.author = null; // 使用 null 而不是空字符串（兼容 MariaDB integer 类型）
    }

    // 4. 处理标签（如果有新标签）
    if (sourceData.newTags && ctx) {
      contentFormObj.tags = await this._processNewTags(sourceData.newTags, sourceData.tags, ctx);
    }

    // 5. 调用底层创建方法
    return await this.create(contentFormObj);
  }

  /**
   * 更新内容
   * @param {String} id 内容ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的内容
   */
  async update(id, data) {
    const content = await this.repository.update(id, data);

    // 🔥 触发 Webhook 事件：content.updated
    try {
      await this.ctx.service.webhook.triggerEvent('content.updated', {
        contentId: content.id,
        title: content.title,
        author: content.author || content.uAuthor,
        state: content.state,
        updatedAt: content.updatedAt,
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[Content] Failed to trigger webhook for content.updated:', error);
    }

    return content;
  }

  /**
   * 更新内容（带完整预处理）
   * 包含：数据构建、显示模式处理、标签处理、XSS 防护
   *
   * 预处理步骤：
   * 1. 解析关键词（字符串 → 数组）
   * 2. XSS 处理（discription, comments, simpleComments）
   * 3. 检测内容显示类型（文本/图片/视频）
   * 4. 提取图片和视频数组
   * 5. 渲染简化内容
   * 6. 处理新标签创建
   * 7. 设置更新时间
   *
   * @param {String} id 内容 ID
   * @param {Object} sourceData 源数据
   * @param {Object} options 配置选项
   * @param {String} options.author 管理员作者 ID（后台更新时使用）
   * @param {String} options.uAuthor 普通用户作者 ID（前台更新时使用）
   * @param {String} options.authorType 作者类型：'admin' | 'user'（用于智能判断）
   * @param {Object} options.ctx 上下文（用于标签创建）
   * @return {Promise<Object>} 更新后的内容
   */
  async updateWithPreprocessing(id, sourceData, options = {}) {
    const { author, uAuthor, authorType, ctx } = options;

    // 🔥 优化：支持前台用户和后台管理员两种场景
    // 至少需要提供 author 或 uAuthor 之一
    if (!author && !uAuthor) {
      throw new Error('At least one of author or uAuthor is required for updateWithPreprocessing');
    }

    // 1. 构建内容对象（更新模式）
    const contentFormObj = this._buildContentFormObj(sourceData, {
      isUpdate: true,
    });

    // 2. 处理显示模式（传递实际的作者 ID）
    const authorIdForDisplay = author || uAuthor;
    this._processContentDisplay(contentFormObj, authorIdForDisplay, sourceData.comments);

    // 3. 🔥 根据作者类型设置正确的作者字段
    if (authorType === 'admin' || author) {
      contentFormObj.author = author || '';
      // contentFormObj.uAuthor = '';
    } else if (authorType === 'user' || uAuthor) {
      contentFormObj.uAuthor = uAuthor || '';
      // contentFormObj.author = '';
    }

    // 4. 处理标签（如果有新标签）
    if (sourceData.newTags && ctx) {
      contentFormObj.tags = await this._processNewTags(sourceData.newTags, sourceData.tags, ctx);
    }

    // 5. 调用底层更新方法
    return await this.update(id, contentFormObj);
  }

  /**
   * 删除内容
   * @param {String|Array} ids 内容ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    const result = await this.repository.remove(ids, key);

    // 🔥 触发 Webhook 事件：content.deleted
    try {
      const deletedIds = Array.isArray(ids) ? ids : [ids];
      await this.ctx.service.webhook.triggerEvent('content.deleted', {
        contentIds: deletedIds,
        deletedAt: new Date(),
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[Content] Failed to trigger webhook for content.deleted:', error);
    }

    return result;
  }

  /**
   * 软删除内容
   * @param {String|Array} ids 内容ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { state: '0' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  /**
   * 批量更新内容
   * @param {String|Array} ids 内容ID或ID数组
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    return await this.repository.updateMany(ids, data, query);
  }

  /**
   * 增加字段值（如点击量）
   * @param {String} id 内容ID
   * @param {Object} incData 增加的字段和值
   * @return {Promise<Object>} 更新结果
   */
  async inc(id, incData) {
    // 使用 updateMany 来实现 inc 功能
    const updateData = { $inc: incData };
    return await this.repository.updateMany(id, updateData);
  }

  /**
   * 删除内容（别名）
   * @param {String|Array} values 要删除的ID
   * @param {String} key 删除的键名
   * @return {Promise<Object>} 删除结果
   */
  async removes(values, key = 'id') {
    const ids = typeof values === 'string' ? values.split(',') : values;
    return await this.repository.remove(ids, key);
  }

  /**
   * 获取单个内容
   * @param {Object} res 响应对象
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 内容对象
   */
  async item(options = {}) {
    const { query = {}, populate = [], fields = null } = options;
    return await this.repository.findOne(query, {
      populate,
      fields,
    });
  }

  /**
   * 聚合统计数量
   * @param {String} key 分组字段
   * @param {String} typeId 字段值
   * @return {Promise<Number>} 统计数量
   */
  async aggregateCounts(key, typeId) {
    return await this.repository.aggregateCounts(key, typeId);
  }

  /**
   * 获取热门标签统计
   * @param {Object} payload 参数
   * @return {Promise<Array>} 热门标签列表
   */
  async getHotTagIds(payload = {}) {
    return await this.repository.getHotTagStats(payload);
  }

  // ==================== Content 特有业务方法 ====================

  /**
   * 根据作者查找内容
   * @param {String} authorId 作者ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByAuthor(authorId, payload = {}, options = {}) {
    return await this.repository.findByAuthor(authorId, options);
  }

  /**
   * 根据用户作者查找内容
   * @param {String} uAuthorId 用户作者ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByUAuthor(uAuthorId, payload = {}, options = {}) {
    return await this.repository.findByUAuthor(uAuthorId, options);
  }

  /**
   * 根据分类查找内容
   * @param {String|Array} categoryIds 分类ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByCategories(categoryIds, payload = {}, options = {}) {
    return await this.repository.findByCategories(categoryIds, options);
  }

  /**
   * 根据标签查找内容
   * @param {String|Array} tagIds 标签ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByTags(tagIds, payload = {}, options = {}) {
    return await this.repository.findByTags(tagIds, options);
  }

  /**
   * 根据状态查找内容
   * @param {String} state 状态
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findByState(state, payload = {}, options = {}) {
    return await this.repository.findByState(state, payload, options);
  }

  /**
   * 查找推荐内容
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findTopContents(payload = {}, options = {}) {
    return await this.repository.findTopContents(payload, options);
  }

  /**
   * 查找置顶内容
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findRoofContents(payload = {}, options = {}) {
    return await this.repository.findRoofContents(payload, options);
  }

  /**
   * 查找草稿内容
   * @param {String} authorId 作者ID
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async findDraftContents(authorId, payload = {}, options = {}) {
    return await this.repository.findDraftContents(authorId, payload, options);
  }

  /**
   * 按关键词搜索内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async searchByKeyword(keyword, payload = {}, options = {}) {
    return await this.repository.searchByKeyword(keyword, payload, options);
  }

  /**
   * 批量更新内容状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} state 新状态
   * @param {String} dismissReason 驳回原因
   * @return {Promise<Object>} 更新结果
   */
  async updateContentStatus(contentIds, state, dismissReason = null) {
    const result = await this.repository.updateContentStatus(contentIds, state, dismissReason);

    // 🔥 触发 Webhook 事件：content.published 或 content.unpublished
    try {
      if (state === '2') {
        // 状态 '2' 表示已发布
        await this.ctx.service.webhook.triggerEvent('content.published', {
          contentIds,
          publishedAt: new Date(),
        });
      } else if (state === '0' || state === '1') {
        // 状态 '0' 或 '1' 表示未发布
        await this.ctx.service.webhook.triggerEvent('content.unpublished', {
          contentIds,
          state,
          dismissReason,
          unpublishedAt: new Date(),
        });
      }
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[Content] Failed to trigger webhook for content status change:', error);
    }

    return result;
  }

  /**
   * 批量设置推荐状态
   * @param {Array} contentIds 内容ID数组
   * @param {Number} isTop 推荐状态
   * @return {Promise<Object>} 更新结果
   */
  async updateTopStatus(contentIds, isTop) {
    return await this.repository.updateTopStatus(contentIds, isTop);
  }

  /**
   * 批量设置置顶状态
   * @param {Array} contentIds 内容ID数组
   * @param {String} roofPlacement 置顶状态
   * @return {Promise<Object>} 更新结果
   */
  async updateRoofStatus(contentIds, roofPlacement) {
    return await this.repository.updateRoofStatus(contentIds, roofPlacement);
  }

  /**
   * 获取内容统计信息
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计结果
   */
  async getContentStats(filter = {}) {
    return await this.repository.getContentStats(filter);
  }

  /**
   * 获取作者内容统计
   * @param {String} authorId 作者ID
   * @param {String} authorType 作者类型
   * @return {Promise<Object>} 作者统计信息
   */
  async getAuthorContentStats(authorId, authorType = 'user') {
    return await this.repository.getAuthorContentStats(authorId, authorType);
  }

  /**
   * 获取分类内容统计
   * @param {String} categoryId 分类ID
   * @return {Promise<Object>} 分类统计信息
   */
  async getCategoryContentStats(categoryId) {
    return await this.repository.getCategoryContentStats(categoryId);
  }

  /**
   * 获取随机内容
   * @param {Number} limit 数量限制
   * @param {Object} filter 过滤条件
   * @return {Promise<Array>} 随机内容列表
   */
  async getRandomContents(limit = 10, filter = {}) {
    return await this.repository.getRandomContents(limit, filter);
  }

  /**
   * 获取相关内容推荐
   * @param {String} contentId 内容ID
   * @param {Number} limit 推荐数量
   * @return {Promise<Array>} 相关内容列表
   */
  async getRelatedContents(contentId, limit = 5) {
    return await this.repository.getRelatedContents(contentId, limit);
  }

  /**
   * 内容审核操作
   * @param {String} contentId 内容ID
   * @param {String} action 审核动作
   * @param {String} reason 审核原因
   * @param {String} reviewerId 审核人ID
   * @return {Promise<Object>} 审核结果
   */
  async reviewContent(contentId, action, reason = '', reviewerId = '') {
    return await this.repository.reviewContent(contentId, action, reason, reviewerId);
  }

  /**
   * 从回收站恢复内容
   * @param {Array} contentIds 内容ID数组
   * @return {Promise<Object>} 恢复结果
   */
  async restoreFromTrash(contentIds) {
    return await this.repository.restoreFromTrash(contentIds);
  }

  /**
   * 复制内容
   * @param {String} contentId 原内容ID
   * @param {Object} newData 新内容数据
   * @return {Promise<Object>} 新内容
   */
  async duplicateContent(contentId, newData = {}) {
    return await this.repository.duplicateContent(contentId, newData);
  }

  /**
   * 按时间范围统计内容
   * @param {Date} startDate 开始时间
   * @param {Date} endDate 结束时间
   * @param {String} groupBy 分组方式
   * @return {Promise<Array>} 时间统计数据
   */
  async getContentStatsByTime(startDate, endDate, groupBy = 'day') {
    return await this.repository.getContentStatsByTime(startDate, endDate, groupBy);
  }

  // ==================== 兼容性方法 ====================

  /**
   * 兼容原有的查找方法
   * @param payload
   * @param options
   * @deprecated 建议使用 find 方法
   */
  async findContents(payload, options) {
    this.logger.warn('使用了废弃的 findContents 方法，请使用 find 方法');
    return await this.find(payload, options);
  }

  /**
   * 兼容原有的获取单项方法
   * @param options
   * @deprecated 建议使用 item 方法
   */
  async getContent(options) {
    this.logger.warn('使用了废弃的 getContent 方法，请使用 item 方法');
    return await this.item(options);
  }

  /**
   * 兼容原有的创建方法
   * @param payload
   * @deprecated 建议使用 create 方法
   */
  async addContent(payload) {
    this.logger.warn('使用了废弃的 addContent 方法，请使用 create 方法');
    return await this.create(payload);
  }

  /**
   * 兼容原有的更新方法
   * @param id
   * @param payload
   * @deprecated 建议使用 update 方法
   */
  async updateContent(id, payload) {
    this.logger.warn('使用了废弃的 updateContent 方法，请使用 update 方法');
    return await this.update(id, payload);
  }

  /**
   * 兼容原有的删除方法
   * @param values
   * @param key
   * @deprecated 建议使用 removes 方法
   */
  async deleteContent(values, key) {
    this.logger.warn('使用了废弃的 deleteContent 方法，请使用 removes 方法');
    return await this.removes(values, key);
  }

  /**
   * 获取内容列表 - 主要业务逻辑
   * @param {Object} query 查询参数
   * @param {Object} userInfo 用户信息
   * @return {Promise<Object>} 内容列表
   */
  async getContentList(query = {}, userInfo = {}) {
    const { userId, model, sortby, listState = '2', typeId, tagName, pageType, roofPlacement, ...payload } = query;

    // 🔥 使用 Repository 层的 ID 规范化：Repository 自动感知数据库类型，无需外部判断
    const normalizedUserId = userId ? this.repository.normalizeId(userId) : null;
    const normalizedTypeId = typeId ? this.repository.normalizeId(typeId) : null;

    let filesType = 'normal';
    let isSingerPage = false;
    let targetUser;

    // 🔥 构建标准化查询条件
    const filters = {
      state: { $eq: '2' },
      draft: { $eq: '0' },
    };

    // 🔥 构建标准化排序条件
    // let sort = [{ field: 'createdAt', order: 'desc' }];

    // if (pageType === 'index') {
    let sort = [
      { field: 'roofPlacement', order: 'desc' },
      { field: 'createdAt', order: 'desc' },
    ];
    // }

    if (model === '1') {
      filters.isTop = { $eq: 1 };
    }

    // 标签查询（优先级高）
    if (tagName) {
      const targetTag = await this._getTagByNameWithCache(tagName);
      if (!_.isEmpty(targetTag)) {
        filters.tags = { $eq: targetTag.id };
        delete filters.categories;
      }
    }

    if (roofPlacement) {
      filters.roofPlacement = { $eq: roofPlacement };
    }

    if (sortby === '1') {
      sort = [{ field: 'clickNum', order: 'asc' }];
    }

    // 🔥 用户相关逻辑：使用 Repository 层的类型安全 ID 比较
    if (!_.isEmpty(userInfo)) {
      const isSelfView =
        !normalizedUserId || (normalizedUserId && this.repository.compareId(userInfo.id, normalizedUserId));

      if (isSelfView) {
        // 默认使用当前登录用户，保证分页统计按个人文章计算
        filters.uAuthor = { $eq: userInfo.id };
        if (listState === 'all') {
          delete filters.state;
        } else if (['0', '1', '2'].includes(listState)) {
          filters.state = { $eq: listState };
        }
      } else if (normalizedUserId) {
        // 查看他人文章（已登录查看他人）
        targetUser = await this.ctx.service.user.findOne({
          id: { $eq: normalizedUserId },
        });
        if (!_.isEmpty(targetUser)) {
          filters.uAuthor = { $eq: targetUser.id };
        }
      }
    } else if (normalizedUserId) {
      // 未登录但带用户参数的场景
      targetUser = await this.ctx.service.user.findOne({
        id: { $eq: normalizedUserId },
      });
      if (!_.isEmpty(targetUser)) {
        filters.uAuthor = { $eq: targetUser.id };
      }
    }

    // 🔥 分类相关逻辑：使用规范化后的 typeId
    if (normalizedTypeId) {
      filters.categories = { $eq: normalizedTypeId };

      // 检查是否为顶级分类
      const singerCateCount = await this._getCategoryCountWithCache(normalizedTypeId);
      if (singerCateCount > 0) {
        filesType = 'stage1';
        isSingerPage = true;
        const ableCateList = await this._getEnableCateListWithCache(isSingerPage);
        if (ableCateList.indexOf(normalizedTypeId) < 0) {
          filters.categories = { $in: ableCateList };
        }
      }
    }

    // 执行查询
    const contentList = await this.find(payload, {
      sort,
      filters,
      searchKeys: ['userName', 'title', 'comments', 'discription'],
      fields: getContentListFields(filesType).split(' ').filter(Boolean),
    });

    // 渲染内容列表（添加交互信息）
    let renderContentList = await this.renderContentListOptimized(
      userInfo.id,
      payload?.isPaging == '0' ? contentList : contentList.docs
    );

    if (payload?.isPaging !== '0') {
      renderContentList = {
        docs: renderContentList,
        pageInfo: contentList.pageInfo,
      };
      if (filters.uAuthor) {
        renderContentList.author = targetUser;
      }
    }

    return renderContentList;
  }

  /**
   * 优化版内容列表渲染 - 解决N+1查询问题
   * @param {String} userId 用户ID
   * @param {Array} contentList 内容列表
   * @return {Promise<Array>} 处理后的内容列表
   */
  async renderContentListOptimized(userId = '', contentList = []) {
    if (!contentList || contentList.length === 0) {
      return [];
    }

    try {
      const newContentList = JSON.parse(JSON.stringify(contentList));
      const contentIds = newContentList.map(item => item.id);

      let userInfo;
      if (userId) {
        userInfo = await this.ctx.service.user.findOne(
          { id: { $eq: userId } },
          {
            fields: getAuthUserFields('session').split(' ').filter(Boolean),
          }
        );
      }

      // 🚀 批量查询统计信息 - 解决N+1问题
      // 重构：使用 ContentInteraction Service 获取精准统计
      const [commentCounts, interactionCounts, userCommentMap, userInteractionStatus] = await Promise.all([
        this._batchQueryCommentCounts(contentIds),
        // 🔥 获取点赞、收藏、踩的统计数 (Map)
        this.ctx.service.contentInteraction.getInteractionCounts(contentIds),
        userId ? this._batchQueryUserComments(userId, contentIds) : Promise.resolve(new Map()),
        // 🔥 获取当前用户的交互状态
        userId
          ? this.ctx.service.contentInteraction.getUserInteractionStatus(userId, contentIds)
          : Promise.resolve({ praisedIds: [], favoritedIds: [], despisedIds: [] }),
      ]);

      const { praiseCounts, favoriteCounts, despiseCounts } = interactionCounts;
      const { praisedIds, favoritedIds, despisedIds } = userInteractionStatus;

      // 应用统计信息到内容列表
      for (const contentItem of newContentList) {
        contentItem.id = contentItem.id;
        contentItem.hasPraised = false;
        contentItem.hasComment = false;
        contentItem.hasFavorite = false;
        contentItem.hasDespise = false;

        if (contentItem.uAuthor && typeof contentItem.uAuthor === 'object') {
          contentItem.uAuthor.had_followed = false;
        }

        if (userId) {
          // 🔥 使用新的状态判断
          contentItem.hasPraised = praisedIds.includes(contentItem.id);
          contentItem.hasFavorite = favoritedIds.includes(contentItem.id);
          contentItem.hasDespise = despisedIds.includes(contentItem.id);

          // 本人是否已留言
          if (userCommentMap.has(contentItem.id)) {
            contentItem.hasComment = true;
          }
          // 本人是否已关注作者（待重构，目前保持原样或需单独处理）
          if (
            userInfo &&
            userInfo.watchers &&
            userInfo.watchers.length > 0 &&
            contentItem.uAuthor &&
            userInfo.watchers.indexOf(contentItem.uAuthor.id) >= 0
          ) {
            contentItem.uAuthor.had_followed = true;
          }
        }

        // 使用批量查询的结果
        contentItem.commentNum = commentCounts.get(contentItem.id) || 0;
        // 🔥 使用新的统计结果
        contentItem.likeNum = praiseCounts.get(contentItem.id) || 0;
        contentItem.favoriteNum = favoriteCounts.get(contentItem.id) || 0;
        contentItem.despiseNum = despiseCounts.get(contentItem.id) || 0;

        if (contentItem.simpleComments) {
          contentItem.simpleComments = JSON.parse(contentItem.simpleComments);
        }

        // 处理用户敏感信息
        contentItem.uAuthor && siteFunc.clearUserSensitiveInformation(contentItem.uAuthor);
      }

      return newContentList;
    } catch (error) {
      this.ctx.logger.error('renderContentListOptimized error:', error);
      return [];
    }
  }

  /**
   * 批量查询评论数 - 兼容MongoDB和MariaDB
   * @param {Array} contentIds 内容ID数组
   * @return {Promise<Map>} 内容ID到评论数的映射
   */
  async _batchQueryCommentCounts(contentIds) {
    const cacheKey = `comment_counts:${contentIds.join(',')}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const countMap = new Map();

        // 使用兼容的批量查询方式 - 优化版
        // 虽然是循环查询，但由于有缓存，实际影响较小
        const promises = contentIds.map(async contentId => {
          const count = await this.ctx.service.message.count({
            contentId: { $eq: contentId },
          });
          return [contentId, count];
        });

        const results = await Promise.all(promises);
        results.forEach(([contentId, count]) => {
          countMap.set(contentId, count);
        });

        return countMap;
      },
      300
    ); // 5分钟缓存
  }

  // 🔥 已移除旧的 _batchQueryLikeCounts, _batchQueryFavoriteCounts, _batchQueryDespiseCounts 方法
  // 因为现在直接使用 Service 层方法获取，不再需要在 Controller/Service 内部实现复杂的查询逻辑

  /**
   * 批量查询用户评论

   * @param {String} userId 用户ID
   * @param {Array} contentIds 内容ID数组
   * @return {Promise<Map>} 内容ID到是否评论的映射
   */
  async _batchQueryUserComments(userId, contentIds) {
    const comments = await this.ctx.service.message.find(
      { isPaging: '0' },
      {
        filters: {
          contentId: { $in: contentIds },
          author: { $eq: userId },
        },
        fields: ['contentId'],
      }
    );

    const commentMap = new Map();
    comments.forEach(comment => {
      commentMap.set(comment.contentId, true);
    });

    return commentMap;
  }

  /**
   * 缓存获取标签信息
   * @param {String} tagName 标签名
   * @return {Promise<Object>} 标签信息
   */
  async _getTagByNameWithCache(tagName) {
    const cacheKey = `tag:${tagName}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        return await this.ctx.service.contentTag.findOne({
          name: { $eq: tagName },
        });
      },
      3600
    ); // 1小时缓存
  }

  /**
   * 缓存获取分类数量
   * @param {String} typeId 分类ID
   * @return {Promise<Number>} 分类数量
   */
  async _getCategoryCountWithCache(typeId) {
    const cacheKey = `category_count:${typeId}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        return await this.ctx.service.contentCategory.count({
          id: { $eq: typeId },
          enable: { $eq: true },
          type: { $eq: '2' },
        });
      },
      3600
    );
  }

  /**
   * 缓存获取启用分类列表
   * @param {Boolean} isSingerPage 是否单页面
   * @return {Promise<Array>} 分类ID列表
   */
  async _getEnableCateListWithCache(isSingerPage) {
    const cacheKey = `enable_categories:${isSingerPage}`;

    return await this.ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        const enableCates = await this.ctx.service.contentCategory.find(
          { isPaging: '0' },
          {
            filters: {
              enable: { $eq: true },
              type: { $eq: isSingerPage ? '2' : '1' },
            },
            fields: ['id'],
          }
        );

        return enableCates.map(item => item.id);
      },
      1800
    ); // 30分钟缓存
  }

  /**
   * 获取 Repository 统计信息（调试用）
   * @return {Object} 统计信息
   */
  async getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  // ==================== 内容预处理私有方法 ====================

  /**
   * 解析关键词
   * @param {String|Array} keywords 关键词
   * @return {Array} 关键词数组
   * @private
   */
  _parseKeywords(keywords) {
    if (!keywords) return [];

    if (Array.isArray(keywords)) {
      return keywords.map(k => xss((k || '').trim())).filter(Boolean);
    }

    if (typeof keywords === 'string') {
      const splitter = keywords.indexOf(',') >= 0 ? ',' : keywords.indexOf('，') >= 0 ? '，' : null;
      if (splitter) {
        return keywords
          .split(splitter)
          .map(k => xss((k || '').trim()))
          .filter(Boolean);
      }
      // 单个关键词
      const single = xss(keywords.trim());
      return single ? [single] : [];
    }

    return [];
  }

  /**
   * 构建内容表单对象
   * @param {Object} sourceData 源数据
   * @param {Object} options 选项
   * @param {Boolean} options.isUpdate 是否为更新操作
   * @return {Object} 内容表单对象
   * @private
   */
  _buildContentFormObj(sourceData, options = {}) {
    const { isUpdate = false } = options;
    const targetKeyWords = this._parseKeywords(sourceData.keywords);

    const contentFormObj = {
      title: xss(sourceData.title || ''),
      stitle: xss(sourceData.stitle || sourceData.title || ''),
      type: sourceData.type || (isUpdate ? sourceData.type : '1'),
      categories: sourceData.categories,
      sortPath: sourceData.sortPath,
      tags: sourceData.tags || (isUpdate ? sourceData.tags : []),
      keywords: targetKeyWords,
      sImg: sourceData.sImg,
      state: sourceData.state || (isUpdate ? sourceData.state : '0'),
      dismissReason: sourceData.dismissReason,
      isTop: sourceData.isTop || (isUpdate ? sourceData.isTop : false),
      discription: xss(sourceData.discription || ''),
      comments: sourceData.comments,
      simpleComments: xss(sourceData.simpleComments || sourceData.comments || ''),
      roofPlacement: sourceData.roofPlacement || 0,
    };

    // 创建特有字段
    if (!isUpdate) {
      contentFormObj.likeUserIds = [];
      contentFormObj.draft = '0';
    }

    // 更新特有字段
    if (isUpdate) {
      contentFormObj.updatedAt = new Date();
    }

    return contentFormObj;
  }

  /**
   * 处理内容显示模式和渲染
   * @param {Object} contentFormObj 内容表单对象
   * @param {String} authorId 作者 ID（已弃用，保留用于向后兼容）
   * @param {String} commentsSource comments 源字段
   * @private
   */
  _processContentDisplay(contentFormObj, authorId, commentsSource) {
    // 设置显示模式
    const checkInfo = siteFunc.checkContentType(contentFormObj.simpleComments);
    contentFormObj.appShowType = checkInfo.type;
    contentFormObj.imageArr = checkInfo.imgArr;
    contentFormObj.videoArr = checkInfo.videoArr;

    if (checkInfo.type === '3') {
      contentFormObj.videoImg = checkInfo.defaultUrl;
      contentFormObj.duration = checkInfo.duration;
    }

    // 渲染简化内容
    contentFormObj.simpleComments = siteFunc.renderSimpleContent(
      contentFormObj.simpleComments,
      checkInfo.imgArr,
      checkInfo.videoArr
    );

    // XSS 处理
    contentFormObj.comments = xss(commentsSource || '');

    // 🔥 移除：不再在此方法中设置作者字段
    // 作者字段应该在 createWithPreprocessing/updateWithPreprocessing 中设置
    // 保留 authorId 参数是为了向后兼容，但不再使用

    return contentFormObj;
  }

  /**
   * 处理新标签创建
   * @param {String} newTagsStr 新标签字符串（逗号分隔）
   * @param {Array} existingTags 现有标签 ID 数组
   * @param {Object} ctx 上下文
   * @return {Promise<Array>} 标签 ID 数组
   * @private
   */
  async _processNewTags(newTagsStr, existingTags, ctx) {
    if (!newTagsStr) {
      return existingTags || [];
    }

    const shortid = require('shortid');
    const labelArr = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    const needAddTags = [...(existingTags || [])];

    for (const tagName of labelArr) {
      if (tagName) {
        const tagObj = await ctx.service.contentTag.findOne({
          name: { $eq: tagName },
        });

        if (_.isEmpty(tagObj)) {
          const newTag = await ctx.service.contentTag.create({
            name: tagName,
            comments: tagName,
            alias: shortid.generate(),
          });
          needAddTags.push(newTag.id);
        } else {
          needAddTags.push(tagObj.id);
        }
      }
    }

    return needAddTags;
  }
}

module.exports = ContentService;
