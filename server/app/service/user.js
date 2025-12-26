/**
 * User Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 *
 * 基于Message模块复杂关联关系处理经验，User模块具有以下特点：
 * 1. 复杂的JSON数组字段操作：收藏、点赞、关注等列表管理
 * 2. 用户认证和安全处理：登录验证、密码加密、权限检查
 * 3. 多模块关联查询：与Content、Message、ContentTag的关联
 * 4. 统计信息获取：用户行为数据统计
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class UserService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 User Repository
    this.repository = this.repositoryFactory.createUserRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 统计记录数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 记录数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建记录
   * @param {Object} data 记录数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    const user = await this.repository.create(data);

    // 🔥 触发 Webhook 事件：user.registered
    try {
      await this.ctx.service.webhook.triggerEvent('user.registered', {
        userId: user.id,
        userName: user.userName,
        email: user.email,
        phoneNum: user.phoneNum,
        createdAt: user.createdAt,
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[User] Failed to trigger webhook for user.registered:', error);
    }

    return user;
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    const user = await this.repository.update(id, data);

    // 🔥 触发 Webhook 事件：user.updated
    try {
      await this.ctx.service.webhook.triggerEvent('user.updated', {
        userId: user.id,
        userName: user.userName,
        email: user.email,
        phoneNum: user.phoneNum,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[User] Failed to trigger webhook for user.updated:', error);
    }

    return user;
  }

  /**
   * 删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    const result = await this.repository.remove(ids, key);

    // 🔥 触发 Webhook 事件：user.deleted
    try {
      const deletedIds = Array.isArray(ids) ? ids : [ids];
      await this.ctx.service.webhook.triggerEvent('user.deleted', {
        userIds: deletedIds,
        deletedAt: new Date(),
      });
    } catch (error) {
      // Webhook 触发失败不应影响业务逻辑
      this.ctx.logger.error('[User] Failed to trigger webhook for user.deleted:', error);
    }

    return result;
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { state: '0' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // ===== 🔥 User 特有的业务方法 =====

  /**
   * 🔥 统一异常处理版本：检查用户名唯一性
   * Repository会自动抛出异常，无需手动检查返回值
   * @param {String} userName 用户名
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当用户名已存在时抛出异常
   */
  async checkUserNameUnique(userName, excludeId = null) {
    return await this.repository.checkUserNameUnique(userName, excludeId);
  }

  /**
   * 🔥 统一异常处理版本：检查邮箱唯一性
   * Repository会自动抛出异常，无需手动检查返回值
   * @param {String} email 邮箱
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当邮箱已存在时抛出异常
   */
  async checkEmailUnique(email, excludeId = null) {
    return await this.repository.checkEmailUnique(email, excludeId);
  }

  /**
   * 🔥 统一异常处理版本：检查手机号唯一性
   * Repository会自动抛出异常，无需手动检查返回值
   * @param {String} phoneNum 手机号
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当手机号已存在时抛出异常
   */
  async checkPhoneUnique(phoneNum, excludeId = null) {
    return await this.repository.checkPhoneUnique(phoneNum, excludeId);
  }

  /**
   * 🔥 用户登录验证 - 统一异常处理版本
   * Repository会自动抛出异常，无需手动检查返回值
   * @param {String} identifier 登录标识（用户名、邮箱或手机号）
   * @param {String} password 密码
   * @param {String} loginType 登录类型
   * @return {Promise<Object>} 用户信息
   * @throws {AuthenticationError} 认证失败时抛出异常
   * @throws {NotFoundError} 用户不存在时抛出异常
   * @throws {BusinessRuleError} 用户被禁用时抛出异常
   */
  async verifyLogin(identifier, password, loginType) {
    return await this.repository.verifyLogin(identifier, password, loginType);
  }

  /**
   * 根据用户名查找用户
   * @param {String} userName 用户名
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByUserName(userName, options = {}) {
    return await this.repository.findByUserName(userName, options);
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email 邮箱
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByEmail(email, options = {}) {
    return await this.repository.findByEmail(email, options);
  }

  /**
   * 根据手机号查找用户
   * @param {String} phoneNum 手机号
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 用户信息
   */
  async findByPhone(phoneNum, options = {}) {
    return await this.repository.findByPhone(phoneNum, options);
  }

  /**
   * 🔥 User模块特有：添加到用户列表（用户关注、标签关注）
   * ⚠️ 注意：点赞、收藏等内容交互请使用 ContentInteractionService
   *
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型（watchers=关注用户, watchTags=关注标签）
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async addToUserList(userId, listType, targetId) {
    // 只允许用于用户关注和标签关注
    if (!['watchers', 'watchTags'].includes(listType)) {
      throw new Error(`不支持的列表类型: ${listType}。点赞收藏请使用 ContentInteractionService`);
    }
    return await this.repository.addToUserList(userId, listType, targetId);
  }

  /**
   * 🔥 User模块特有：从用户列表移除（取消关注用户、取消关注标签）
   * ⚠️ 注意：取消点赞、取消收藏等内容交互请使用 ContentInteractionService
   *
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型（watchers=关注用户, watchTags=关注标签）
   * @param {String} targetId 目标ID
   * @return {Promise<Object>} 更新后的用户
   * @throws {NotFoundError} 当用户不存在时抛出异常
   */
  async removeFromUserList(userId, listType, targetId) {
    // 只允许用于用户关注和标签关注
    if (!['watchers', 'watchTags'].includes(listType)) {
      throw new Error(`不支持的列表类型: ${listType}。取消点赞收藏请使用 ContentInteractionService`);
    }
    return await this.repository.removeFromUserList(userId, listType, targetId);
  }

  /**
   * 🔥 User模块特有：检查用户是否在某个列表中
   * @param {String} userId 用户ID
   * @param {String} listType 列表类型
   * @param {String} targetId 目标ID
   * @return {Promise<Boolean>} 是否在列表中
   */
  async checkUserInList(userId, listType, targetId) {
    return await this.repository.checkUserInList(userId, listType, targetId);
  }

  /**
   * 🔥 User模块特有：获取用户统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserStats(userId) {
    return await this.repository.getUserStats(userId);
  }

  /**
   * 🔥 通用实战：批量更新用户状态
   * @param {Array} userIds 用户ID数组
   * @param {String} state 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateState(userIds, state) {
    return await this.repository.batchUpdateState(userIds, state);
  }

  /**
   * 🔥 User模块实战：获取用户统计信息（按状态分组）
   * @param {Object} filter 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getUserEntityStats(filter = {}) {
    return await this.repository.getUserEntityStats(filter);
  }

  // ===== 🔥 便捷方法：基于业务场景的高级封装 =====

  // 🔥 注意：内容交互（点赞、收藏、踩）请直接使用 ContentInteractionService
  // 🔥 注意：评论交互（点赞、踩）请直接使用 MessageInteractionService

  /**
   * 用户关注其他用户
   * @param {String} userId 用户ID
   * @param {String} targetUserId 目标用户ID
   * @return {Promise<Object>} 更新后的用户
   */
  async followUser(userId, targetUserId) {
    return await this.addToUserList(userId, 'watchers', targetUserId);
  }

  /**
   * 用户取消关注其他用户
   * @param {String} userId 用户ID
   * @param {String} targetUserId 目标用户ID
   * @return {Promise<Object>} 更新后的用户
   */
  async unfollowUser(userId, targetUserId) {
    return await this.removeFromUserList(userId, 'watchers', targetUserId);
  }

  /**
   * 用户关注标签
   * @param {String} userId 用户ID
   * @param {String} tagId 标签ID
   * @return {Promise<Object>} 更新后的用户
   */
  async followTag(userId, tagId) {
    return await this.addToUserList(userId, 'watchTags', tagId);
  }

  /**
   * 用户取消关注标签
   * @param {String} userId 用户ID
   * @param {String} tagId 标签ID
   * @return {Promise<Object>} 更新后的用户
   */
  async unfollowTag(userId, tagId) {
    return await this.removeFromUserList(userId, 'watchTags', tagId);
  }

  /**
   * 检查用户是否收藏了文章
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @return {Promise<Boolean>} 是否收藏
   */
  async hasFavorited(userId, contentId) {
    // 🔥 重构：委托给 ContentInteractionService 处理
    return await this.ctx.service.contentInteraction.hasInteraction(userId, contentId, 'favorite');
  }

  /**
   * 检查用户是否点赞了文章
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @return {Promise<Boolean>} 是否点赞
   */
  async hasPraised(userId, contentId) {
    // 🔥 重构：委托给 ContentInteractionService 处理
    return await this.ctx.service.contentInteraction.hasInteraction(userId, contentId, 'praise');
  }

  /**
   * 检查用户是否踩了文章
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @return {Promise<Boolean>} 是否踩
   */
  async hasDespised(userId, contentId) {
    return await this.ctx.service.contentInteraction.hasInteraction(userId, contentId, 'despise');
  }

  /**
   * 检查用户是否关注了其他用户
   * @param {String} userId 用户ID
   * @param {String} targetUserId 目标用户ID
   * @return {Promise<Boolean>} 是否关注
   */
  async isFollowing(userId, targetUserId) {
    return await this.checkUserInList(userId, 'watchers', targetUserId);
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  /**
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }
}

module.exports = UserService;
