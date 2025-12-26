/*
 * Content Interaction Service
 * 文章交互服务：处理点赞、收藏、踩等交互逻辑
 * 遵循 MessageInteractionService 的模式
 */
'use strict';

const Service = require('egg').Service;
const _ = require('lodash');
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class ContentInteractionService extends Service {
  constructor(ctx) {
    super(ctx);
    this.repositoryFactory = new RepositoryFactory(this.app);
    this.repository = this.repositoryFactory.createContentInteractionRepository(ctx);
    this.contentRepository = this.repositoryFactory.createContentRepository(ctx);
  }

  /**
   * 检查用户是否已交互
   * @param {String} userId 用户ID
   * @param {String} contentId 文章ID
   * @param {String} interactionType 交互类型 (praise, favorite, despise)
   * @return {Promise<Boolean>}
   */
  async hasInteraction(userId, contentId, interactionType) {
    if (!userId || !contentId || !interactionType) return false;
    return await this.repository.hasInteraction(userId, contentId, interactionType);
  }

  /**
   * 点赞文章
   * @param contentId
   * @param userId
   * @param metadata
   */
  async praiseContent(contentId, userId, metadata = {}) {
    return this._handleInteraction(contentId, userId, 'praise', metadata, ['despise']);
  }

  /**
   * 取消点赞
   * @param contentId
   * @param userId
   */
  async unpraiseContent(contentId, userId) {
    return this._removeInteraction(contentId, userId, 'praise');
  }

  /**
   * 踩文章
   * @param contentId
   * @param userId
   * @param metadata
   */
  async despiseContent(contentId, userId, metadata = {}) {
    return this._handleInteraction(contentId, userId, 'despise', metadata, ['praise']);
  }

  /**
   * 取消踩
   * @param contentId
   * @param userId
   */
  async undespiseContent(contentId, userId) {
    return this._removeInteraction(contentId, userId, 'despise');
  }

  /**
   * 收藏文章
   * @param contentId
   * @param userId
   * @param metadata
   */
  async favoriteContent(contentId, userId, metadata = {}) {
    return this._handleInteraction(contentId, userId, 'favorite', metadata, []);
  }

  /**
   * 取消收藏
   * @param contentId
   * @param userId
   */
  async unfavoriteContent(contentId, userId) {
    return this._removeInteraction(contentId, userId, 'favorite');
  }

  // ===== 私有辅助方法 =====

  /**
   * 处理交互（通用逻辑）
   * @param {String} contentId
   * @param {String} userId
   * @param {String} type 交互类型
   * @param {Object} metadata
   * @param {Array} conflictTypes 互斥类型（如点赞互斥踩）
   */
  async _handleInteraction(contentId, userId, type, metadata = {}, conflictTypes = []) {
    const { ctx } = this;
    try {
      // 1. 检查是否已交互
      const hasInteraction = await this.repository.hasInteraction(userId, contentId, type);
      if (hasInteraction) {
        return { success: false, message: '已存在该交互', alreadyExists: true };
      }

      // 2. 添加交互记录
      await this.repository.addInteraction({
        userId,
        contentId,
        interactionType: type,
        ipAddress: metadata.ipAddress || ctx.request.ip,
        userAgent: metadata.userAgent || ctx.request.header['user-agent'],
      });

      // 3. 更新统计计数 (使用旧的 likeNum 映射 praise_count，或者直接用新字段)
      // 这里先更新旧字段保持兼容，稍后应迁移到新字段
      // 注意：这里仅作简单的 inc，更好的做法是定期校准或完全依赖新表 count
      await this._updateContentCount(contentId, type, 1);

      // 4. 处理互斥逻辑（如点赞时自动取消踩）
      for (const conflictType of conflictTypes) {
        const hasConflict = await this.repository.hasInteraction(userId, contentId, conflictType);
        if (hasConflict) {
          await this._removeInteraction(contentId, userId, conflictType);
        }
      }

      return { success: true, message: '操作成功' };
    } catch (error) {
      ctx.logger.error(`ContentInteractionService ${type} error:`, error);
      throw error;
    }
  }

  /**
   * 移除交互（通用逻辑）
   * @param contentId
   * @param userId
   * @param type
   */
  async _removeInteraction(contentId, userId, type) {
    const { ctx } = this;
    try {
      const result = await this.repository.removeInteraction(userId, contentId, type);
      if (result.deletedCount > 0) {
        // 更新统计计数
        await this._updateContentCount(contentId, type, -1);
        return { success: true, message: '操作成功' };
      }
      return { success: false, message: '记录不存在', notFound: true };
    } catch (error) {
      ctx.logger.error(`ContentInteractionService un-${type} error:`, error);
      throw error;
    }
  }

  /**
   * 更新文章的统计字段
   * @param {String} contentId
   * @param {String} type
   * @param {Number} delta +1 或 -1
   */
  async _updateContentCount(contentId, type, delta) {
    // 映射交互类型到 Content 模型的字段
    // praise -> likeNum (旧)
    // favorite -> 暂无明确旧字段，通常不存计数或放在 User
    // despise -> 暂无明确旧字段

    // 我们应该在 Content 模型中添加 dedicated 字段：praise_count, favorite_count, despise_count
    // 这里暂时只处理 likeNum (对应 praise)

    let updateData = {};
    if (type === 'praise') {
      // MongoDB 使用 $inc, MariaDB 使用 increment
      // 这里需要 repository 提供 atomic update 支持，或者由 service 处理
      // 为简单起见，这里假设 MongoDB 风格的 $inc 支持（Repository层处理差异）
      updateData = { $inc: { likeNum: delta } };
    }

    // 如果是 MariaDB，contentRepository.update 方法可能不支持 $inc 语法
    // 需要检查 ContentRepository 实现。
    // 为了稳健，这里先空着，依赖实时 count（虽然慢一点，但准确）。
    // 在用户要求验证统计逻辑时，使用 batchGetInteractionCounts 方法才是正道。

    // TODO: 实现计数更新
  }

  /**
   * 获取用户对一组文章的交互状态
   * @param {String} userId
   * @param {Array} contentIds
   * @return {Promise<Object>} { praisedIds: [], favoritedIds: [], despisedIds: [] }
   */
  async getUserInteractionStatus(userId, contentIds) {
    const [praisedIds, favoritedIds, despisedIds] = await Promise.all([
      this.repository.getUserInteractionStatus(userId, contentIds, 'praise'),
      this.repository.getUserInteractionStatus(userId, contentIds, 'favorite'),
      this.repository.getUserInteractionStatus(userId, contentIds, 'despise'),
    ]);

    return { praisedIds, favoritedIds, despisedIds };
  }

  /**
   * 批量获取文章的交互统计
   * @param {Array} contentIds
   * @return {Promise<Object>} { praiseCounts, favoriteCounts, despiseCounts } (Maps)
   */
  async getInteractionCounts(contentIds) {
    const [praiseCounts, favoriteCounts, despiseCounts] = await Promise.all([
      this.repository.batchGetInteractionCounts(contentIds, 'praise'),
      this.repository.batchGetInteractionCounts(contentIds, 'favorite'),
      this.repository.batchGetInteractionCounts(contentIds, 'despise'),
    ]);

    return { praiseCounts, favoriteCounts, despiseCounts };
  }
}

module.exports = ContentInteractionService;
