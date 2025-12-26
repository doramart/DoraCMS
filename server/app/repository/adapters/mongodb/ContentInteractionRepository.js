/**
 * ContentInteraction MongoDB Repository
 * 🔥 基于 BaseMongoRepository 的标准实现
 * 实现文章交互记录的MongoDB数据访问
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');

class ContentInteractionMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'ContentInteraction');

    // 设置 MongoDB 模型
    this.model = this.app.model.ContentInteraction;

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
        // 关联文章
        contentId: {
          model: this.app.model.Content,
          path: 'contentId',
          select: ['title', '_id', 'date', 'sImg', 'discription'],
        },
      },
    });
  }

  // ===== 🔥 重写基类方法 =====

  _getDefaultPopulate() {
    return [
      { path: 'userId', select: ['userName', '_id', 'logo'] },
      { path: 'contentId', select: ['title', '_id', 'date', 'sImg', 'discription'] },
    ];
  }

  _getDefaultSearchKeys() {
    return [];
  }

  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
  }

  // ===== 🔥 ContentInteraction 特有的业务方法 =====

  /**
   * 添加交互记录
   * 使用 upsert 保证幂等性
   * @param interactionData
   */
  async addInteraction(interactionData) {
    const { userId, contentId, interactionType, ipAddress, userAgent } = interactionData;

    try {
      const interaction = await this.model.findOneAndUpdate(
        { userId, contentId, interactionType },
        {
          $setOnInsert: {
            userId,
            contentId,
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
        const existing = await this.model.findOne({ userId, contentId, interactionType });
        this._logOperation('addInteraction', interactionData, { created: false, existing: true });
        return existing;
      }
      this._handleError(error, 'addInteraction', interactionData);
    }
  }

  /**
   * 移除交互记录
   * @param userId
   * @param contentId
   * @param interactionType
   */
  async removeInteraction(userId, contentId, interactionType) {
    try {
      const result = await this.model.deleteOne({ userId, contentId, interactionType });
      this._logOperation(
        'removeInteraction',
        { userId, contentId, interactionType },
        { deletedCount: result.deletedCount }
      );
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'removeInteraction', { userId, contentId, interactionType });
    }
  }

  /**
   * 检查用户是否已交互
   * @param userId
   * @param contentId
   * @param interactionType
   */
  async hasInteraction(userId, contentId, interactionType) {
    try {
      const count = await this.model.countDocuments({ userId, contentId, interactionType });
      this._logOperation('hasInteraction', { userId, contentId, interactionType }, { hasInteraction: count > 0 });
      return count > 0;
    } catch (error) {
      this._handleError(error, 'hasInteraction', { userId, contentId, interactionType });
      return false;
    }
  }

  /**
   * 获取文章交互统计
   * @param contentId
   */
  async getInteractionStats(contentId) {
    try {
      const [praiseCount, favoriteCount, despiseCount] = await Promise.all([
        this.model.countDocuments({ contentId, interactionType: 'praise' }),
        this.model.countDocuments({ contentId, interactionType: 'favorite' }),
        this.model.countDocuments({ contentId, interactionType: 'despise' }),
      ]);

      const stats = { praiseCount, favoriteCount, despiseCount };
      this._logOperation('getInteractionStats', { contentId }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getInteractionStats', { contentId });
      return { praiseCount: 0, favoriteCount: 0, despiseCount: 0 };
    }
  }

  /**
   * 批量获取用户交互状态
   * @param userId
   * @param contentIds
   * @param interactionType
   */
  async getUserInteractionStatus(userId, contentIds, interactionType) {
    try {
      const interactions = await this.model
        .find(
          {
            userId,
            contentId: { $in: contentIds },
            interactionType,
          },
          { contentId: 1 }
        )
        .lean();

      const result = interactions.map(item => item.contentId);
      this._logOperation('getUserInteractionStatus', { userId, contentIds, interactionType }, { count: result.length });
      return result;
    } catch (error) {
      this._handleError(error, 'getUserInteractionStatus', { userId, contentIds, interactionType });
      return [];
    }
  }

  /**
   * 批量统计
   * @param contentIds
   * @param interactionType
   */
  async batchGetInteractionCounts(contentIds, interactionType) {
    try {
      const results = await this.model.aggregate([
        {
          $match: {
            contentId: { $in: contentIds },
            interactionType,
          },
        },
        {
          $group: {
            _id: '$contentId',
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map();
      contentIds.forEach(id => countMap.set(id, 0));
      results.forEach(item => {
        countMap.set(item._id, item.count);
      });

      this._logOperation('batchGetInteractionCounts', { contentIds, interactionType }, { totalCounts: countMap.size });
      return countMap;
    } catch (error) {
      this._handleError(error, 'batchGetInteractionCounts', { contentIds, interactionType });
      return new Map();
    }
  }

  /**
   * 获取用户交互历史
   * @param userId
   * @param options
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
        .populate('contentId', 'title _id date sImg discription')
        .lean();

      this._logOperation('getUserInteractionHistory', { userId, options }, { count: interactions.length });
      return interactions;
    } catch (error) {
      this._handleError(error, 'getUserInteractionHistory', { userId, options });
      return [];
    }
  }

  /**
   * 删除文章所有交互
   * @param contentId
   */
  async deleteContentInteractions(contentId) {
    try {
      const result = await this.model.deleteMany({ contentId });
      this._logOperation('deleteContentInteractions', { contentId }, { deletedCount: result.deletedCount });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'deleteContentInteractions', { contentId });
      return { deletedCount: 0 };
    }
  }

  /**
   * 删除用户所有交互
   * @param userId
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

module.exports = ContentInteractionMongoRepository;
