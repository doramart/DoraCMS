/**
 * MessageInteraction MongoDB Repository
 * 🔥 基于 BaseMongoRepository 的标准实现
 * 实现留言交互记录的MongoDB数据访问
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');

class MessageInteractionMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'MessageInteraction');

    // 设置 MongoDB 模型
    this.model = this.app.model.MessageInteraction;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // 关联用户
        userId: {
          model: this.app.model.User,
          path: 'userId',
          select: ['userName', '_id', 'logo'],
        },
        // 关联留言
        messageId: {
          model: this.app.model.Message,
          path: 'messageId',
          select: ['content', '_id', 'contentId', 'createdAt'],
        },
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
      { path: 'userId', select: ['userName', '_id', 'logo'] },
      { path: 'messageId', select: ['content', '_id', 'contentId', 'createdAt'] },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return []; // MessageInteraction 不需要搜索
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  // ===== 🔥 MessageInteraction 特有的业务方法 =====

  /**
   * 添加交互记录（点赞/踩）
   * 使用 upsert 保证幂等性
   * @param {Object} interactionData 交互数据
   * @return {Promise<Object>} 创建的交互记录
   */
  async addInteraction(interactionData) {
    const { userId, messageId, interactionType, ipAddress, userAgent } = interactionData;

    try {
      // 🔥 使用 findOneAndUpdate + upsert 保证幂等性
      const interaction = await this.model.findOneAndUpdate(
        { userId, messageId, interactionType },
        {
          $setOnInsert: {
            userId,
            messageId,
            interactionType,
            ipAddress,
            userAgent,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      this._logOperation('addInteraction', interactionData, { created: true });
      return interaction;
    } catch (error) {
      if (error.code === 11000) {
        // 重复键错误，说明已经存在，直接返回
        const existing = await this.model.findOne({ userId, messageId, interactionType });
        this._logOperation('addInteraction', interactionData, { created: false, existing: true });
        return existing;
      }
      this._handleError(error, 'addInteraction', interactionData);
    }
  }

  /**
   * 移除交互记录（取消点赞/踩）
   * @param {String} userId 用户ID
   * @param {String} messageId 留言ID
   * @param {String} interactionType 交互类型
   * @return {Promise<Object>} 删除结果
   */
  async removeInteraction(userId, messageId, interactionType) {
    try {
      const result = await this.model.deleteOne({ userId, messageId, interactionType });

      this._logOperation(
        'removeInteraction',
        { userId, messageId, interactionType },
        { deletedCount: result.deletedCount }
      );
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'removeInteraction', { userId, messageId, interactionType });
    }
  }

  /**
   * 检查用户是否已交互
   * @param {String} userId 用户ID
   * @param {String} messageId 留言ID
   * @param {String} interactionType 交互类型
   * @return {Promise<Boolean>} 是否已交互
   */
  async hasInteraction(userId, messageId, interactionType) {
    try {
      const count = await this.model.countDocuments({ userId, messageId, interactionType });

      this._logOperation('hasInteraction', { userId, messageId, interactionType }, { hasInteraction: count > 0 });
      return count > 0;
    } catch (error) {
      this._handleError(error, 'hasInteraction', { userId, messageId, interactionType });
      return false;
    }
  }

  /**
   * 获取留言的交互统计
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} { praiseCount, despiseCount }
   */
  async getInteractionStats(messageId) {
    try {
      const praiseCount = await this.model.countDocuments({ messageId, interactionType: 'praise' });
      const despiseCount = await this.model.countDocuments({ messageId, interactionType: 'despise' });

      const stats = { praiseCount, despiseCount };
      this._logOperation('getInteractionStats', { messageId }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getInteractionStats', { messageId });
      return { praiseCount: 0, despiseCount: 0 };
    }
  }

  /**
   * 批量获取用户的交互状态
   * @param {String} userId 用户ID
   * @param {Array} messageIds 留言ID数组
   * @param {String} interactionType 交互类型
   * @return {Promise<Array>} 已交互的留言ID数组
   */
  async getUserInteractionStatus(userId, messageIds, interactionType) {
    try {
      const interactions = await this.model
        .find(
          {
            userId,
            messageId: { $in: messageIds },
            interactionType,
          },
          { messageId: 1 }
        )
        .lean();

      const result = interactions.map(item => item.messageId);
      this._logOperation('getUserInteractionStatus', { userId, messageIds, interactionType }, { count: result.length });
      return result;
    } catch (error) {
      this._handleError(error, 'getUserInteractionStatus', { userId, messageIds, interactionType });
      return [];
    }
  }

  /**
   * 批量统计多个留言的交互数
   * @param {Array} messageIds 留言ID数组
   * @param {String} interactionType 交互类型
   * @return {Promise<Map>} 留言ID到交互数的映射
   */
  async batchGetInteractionCounts(messageIds, interactionType) {
    try {
      const results = await this.model.aggregate([
        {
          $match: {
            messageId: { $in: messageIds },
            interactionType,
          },
        },
        {
          $group: {
            _id: '$messageId',
            count: { $sum: 1 },
          },
        },
      ]);

      // 转换为 Map 结构
      const countMap = new Map();
      messageIds.forEach(id => countMap.set(id, 0)); // 初始化为0
      results.forEach(item => {
        countMap.set(item._id, item.count);
      });

      this._logOperation('batchGetInteractionCounts', { messageIds, interactionType }, { totalCounts: countMap.size });
      return countMap;
    } catch (error) {
      this._handleError(error, 'batchGetInteractionCounts', { messageIds, interactionType });
      return new Map();
    }
  }

  /**
   * 获取用户的交互历史
   * @param {String} userId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 交互记录列表
   */
  async getUserInteractionHistory(userId, options = {}) {
    try {
      const { interactionType, limit = 100, skip = 0 } = options;

      const query = { userId };
      if (interactionType) {
        query.interactionType = interactionType;
      }

      const interactions = await this.model
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('messageId', 'content contentId createdAt')
        .lean();

      this._logOperation('getUserInteractionHistory', { userId, options }, { count: interactions.length });
      return interactions;
    } catch (error) {
      this._handleError(error, 'getUserInteractionHistory', { userId, options });
      return [];
    }
  }

  /**
   * 删除留言的所有交互记录
   * @param {String} messageId 留言ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteMessageInteractions(messageId) {
    try {
      const result = await this.model.deleteMany({ messageId });

      this._logOperation('deleteMessageInteractions', { messageId }, { deletedCount: result.deletedCount });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'deleteMessageInteractions', { messageId });
      return { deletedCount: 0 };
    }
  }

  /**
   * 删除用户的所有交互记录
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteUserInteractions(userId) {
    try {
      const result = await this.model.deleteMany({ userId });

      this._logOperation('deleteUserInteractions', { userId }, { deletedCount: result.deletedCount });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'deleteUserInteractions', { userId });
      return { deletedCount: 0 };
    }
  }
}

module.exports = MessageInteractionMongoRepository;
