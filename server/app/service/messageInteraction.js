/*
 * @Author: doramart
 * @Date: 2024-12-08
 * @Description: MessageInteractionService - 留言交互服务层
 */

'use strict';
const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class MessageInteractionService extends Service {
  constructor(ctx) {
    super(ctx);
    this.repositoryFactory = new RepositoryFactory(this.app);
    this.repository = this.repositoryFactory.createMessageInteractionRepository(ctx);
    this.messageRepository = this.repositoryFactory.createMessageRepository(ctx);
  }

  /**
   * 点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @param {Object} metadata 元数据（IP、UserAgent等）
   * @return {Promise<Object>} 操作结果
   */
  async praiseMessage(messageId, userId, metadata = {}) {
    const { ctx } = this;

    try {
      // 1. 检查是否已点赞
      const hasInteraction = await this.repository.hasInteraction(userId, messageId, 'praise');
      if (hasInteraction) {
        return {
          success: false,
          message: '已经点赞过了',
          alreadyExists: true,
        };
      }

      // 2. 添加交互记录
      await this.repository.addInteraction({
        userId,
        messageId,
        interactionType: 'praise',
        ipAddress: metadata.ipAddress || ctx.request.ip,
        userAgent: metadata.userAgent || ctx.request.header['user-agent'],
      });

      // 3. 更新留言的点赞计数（冗余字段）
      await this.messageRepository.update(messageId, {
        $inc: { praise_count: 1 },
      });

      // 4. 如果用户之前踩过，自动取消踩
      const hadDespise = await this.repository.hasInteraction(userId, messageId, 'despise');
      if (hadDespise) {
        await this.undespiseMessage(messageId, userId);
      }

      return {
        success: true,
        message: '点赞成功',
      };
    } catch (error) {
      ctx.logger.error('点赞失败:', error);
      throw error;
    }
  }

  /**
   * 取消点赞留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 操作结果
   */
  async unpraiseMessage(messageId, userId) {
    const { ctx } = this;

    try {
      // 1. 检查是否已点赞
      const hasInteraction = await this.repository.hasInteraction(userId, messageId, 'praise');
      if (!hasInteraction) {
        return {
          success: false,
          message: '还未点赞',
          notExists: true,
        };
      }

      // 2. 移除交互记录
      await this.repository.removeInteraction(userId, messageId, 'praise');

      // 3. 更新留言的点赞计数（冗余字段）
      await this.messageRepository.update(messageId, {
        $inc: { praise_count: -1 },
      });

      return {
        success: true,
        message: '取消点赞成功',
      };
    } catch (error) {
      ctx.logger.error('取消点赞失败:', error);
      throw error;
    }
  }

  /**
   * 踩留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @param {Object} metadata 元数据（IP、UserAgent等）
   * @return {Promise<Object>} 操作结果
   */
  async despiseMessage(messageId, userId, metadata = {}) {
    const { ctx } = this;

    try {
      // 1. 检查是否已踩
      const hasInteraction = await this.repository.hasInteraction(userId, messageId, 'despise');
      if (hasInteraction) {
        return {
          success: false,
          message: '已经踩过了',
          alreadyExists: true,
        };
      }

      // 2. 添加交互记录
      await this.repository.addInteraction({
        userId,
        messageId,
        interactionType: 'despise',
        ipAddress: metadata.ipAddress || ctx.request.ip,
        userAgent: metadata.userAgent || ctx.request.header['user-agent'],
      });

      // 3. 更新留言的踩计数（冗余字段）
      await this.messageRepository.update(messageId, {
        $inc: { despise_count: 1 },
      });

      // 4. 如果用户之前点赞过，自动取消点赞
      const hadPraise = await this.repository.hasInteraction(userId, messageId, 'praise');
      if (hadPraise) {
        await this.unpraiseMessage(messageId, userId);
      }

      return {
        success: true,
        message: '操作成功',
      };
    } catch (error) {
      ctx.logger.error('踩失败:', error);
      throw error;
    }
  }

  /**
   * 取消踩留言
   * @param {String} messageId 留言ID
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 操作结果
   */
  async undespiseMessage(messageId, userId) {
    const { ctx } = this;

    try {
      // 1. 检查是否已踩
      const hasInteraction = await this.repository.hasInteraction(userId, messageId, 'despise');
      if (!hasInteraction) {
        return {
          success: false,
          message: '还未踩',
          notExists: true,
        };
      }

      // 2. 移除交互记录
      await this.repository.removeInteraction(userId, messageId, 'despise');

      // 3. 更新留言的踩计数（冗余字段）
      await this.messageRepository.update(messageId, {
        $inc: { despise_count: -1 },
      });

      return {
        success: true,
        message: '取消操作成功',
      };
    } catch (error) {
      ctx.logger.error('取消踩失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取用户的交互状态
   * @param {String} userId 用户ID
   * @param {Array<String>} messageIds 留言ID数组
   * @return {Promise<Object>} { praisedIds: [], despisedIds: [] }
   */
  async getUserInteractionStatus(userId, messageIds) {
    const [praisedIds, despisedIds] = await Promise.all([
      this.repository.getUserInteractionStatus(userId, messageIds, 'praise'),
      this.repository.getUserInteractionStatus(userId, messageIds, 'despise'),
    ]);

    return {
      praisedIds,
      despisedIds,
    };
  }

  /**
   * 批量统计留言的交互数
   * @param {Array<String>} messageIds 留言ID数组
   * @return {Promise<Object>} { praiseCountsMap: Map, despiseCountsMap: Map }
   */
  async batchGetInteractionCounts(messageIds) {
    const [praiseCountsMap, despiseCountsMap] = await Promise.all([
      this.repository.batchGetInteractionCounts(messageIds, 'praise'),
      this.repository.batchGetInteractionCounts(messageIds, 'despise'),
    ]);

    return {
      praiseCountsMap,
      despiseCountsMap,
    };
  }

  /**
   * 获取用户的交互历史
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 交互记录列表
   */
  async getUserInteractionHistory(userId, options = {}) {
    return await this.repository.getUserInteractionHistory(userId, options);
  }

  /**
   * 删除留言的所有交互记录
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteMessageInteractions(messageId) {
    return await this.repository.deleteMessageInteractions(messageId);
  }

  /**
   * 删除用户的所有交互记录
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteUserInteractions(userId) {
    return await this.repository.deleteUserInteractions(userId);
  }

  /**
   * 同步留言的计数字段
   * 用于修复数据不一致的情况
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} 同步结果
   */
  async syncMessageCounts(messageId) {
    const { ctx } = this;

    try {
      const stats = await this.repository.getInteractionStats(messageId);

      await this.messageRepository.update(messageId, {
        praise_count: stats.praiseCount,
        despise_count: stats.despiseCount,
      });

      return {
        success: true,
        praiseCount: stats.praiseCount,
        despiseCount: stats.despiseCount,
      };
    } catch (error) {
      ctx.logger.error('同步计数失败:', error);
      throw error;
    }
  }

  /**
   * 批量同步所有留言的计数字段
   * @return {Promise<Object>} 同步结果
   */
  async syncAllMessageCounts() {
    const { ctx } = this;

    try {
      // 获取所有留言
      const messages = await this.messageRepository.find(
        { isPaging: '0' },
        {
          fields: ['id'],
        }
      );

      let successCount = 0;
      const errors = [];

      for (const message of messages) {
        try {
          await this.syncMessageCounts(message.id);
          successCount++;
        } catch (error) {
          errors.push({ messageId: message.id, error: error.message });
        }
      }

      return {
        success: true,
        totalCount: messages.length,
        successCount,
        errors,
      };
    } catch (error) {
      ctx.logger.error('批量同步计数失败:', error);
      throw error;
    }
  }
}

module.exports = MessageInteractionService;
