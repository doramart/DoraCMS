/**
 * ContentInteraction MariaDB Repository
 * 🔥 基于 BaseMariaRepository 的标准实现
 * 实现文章交互记录的MariaDB数据访问
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const ContentInteractionSchema = require('../../schemas/mariadb/ContentInteractionSchema');

class ContentInteractionMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'ContentInteraction');

    // 初始化 MariaDB 连接
    // 使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例
      this.model = ContentInteractionSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          user: {
            model: 'User',
            foreignKey: 'userId',
            as: 'user',
          },
          content: {
            model: 'Content',
            foreignKey: 'contentId',
            as: 'content',
          },
        },
      });
    } catch (error) {
      console.error('❌ ContentInteractionMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类方法 =====

  _getDefaultPopulate() {
    return [
      { association: 'user', attributes: ['id', 'userName', 'logo'] },
      { association: 'content', attributes: ['id', 'title'] },
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
   * 使用 findOrCreate 保证幂等性
   * @param interactionData
   */
  async addInteraction(interactionData) {
    await this._ensureConnection();

    const { userId, contentId, interactionType, ipAddress, userAgent } = interactionData;

    try {
      const [interaction, created] = await this.model.findOrCreate({
        where: { userId, contentId, interactionType },
        defaults: {
          userId,
          contentId,
          interactionType,
          ipAddress,
          userAgent,
          createdAt: new Date(),
        },
      });

      this._logOperation('addInteraction', interactionData, { created });
      return interaction;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const existing = await this.model.findOne({
          where: { userId, contentId, interactionType },
        });
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
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({
        where: { userId, contentId, interactionType },
      });
      this._logOperation('removeInteraction', { userId, contentId, interactionType }, { deletedCount: result });
      return { deletedCount: result };
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
    await this._ensureConnection();

    try {
      const count = await this.model.count({
        where: { userId, contentId, interactionType },
      });
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
    await this._ensureConnection();

    try {
      const [praiseCount, favoriteCount, despiseCount] = await Promise.all([
        this.model.count({ where: { contentId, interactionType: 'praise' } }),
        this.model.count({ where: { contentId, interactionType: 'favorite' } }),
        this.model.count({ where: { contentId, interactionType: 'despise' } }),
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
    await this._ensureConnection();

    try {
      const { Op } = require('sequelize');
      const interactions = await this.model.findAll({
        where: {
          userId,
          contentId: { [Op.in]: contentIds },
          interactionType,
        },
        attributes: ['contentId'],
        raw: true,
      });

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
    await this._ensureConnection();

    try {
      const { Op, fn, col } = require('sequelize');
      const results = await this.model.findAll({
        where: {
          contentId: { [Op.in]: contentIds },
          interactionType,
        },
        attributes: ['contentId', [fn('COUNT', col('id')), 'count']],
        group: ['contentId'],
        raw: true,
      });

      const countMap = new Map();
      contentIds.forEach(id => countMap.set(id, 0));
      results.forEach(item => {
        countMap.set(item.contentId, parseInt(item.count) || 0);
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
    await this._ensureConnection();

    try {
      const { interactionType, limit = 100, offset = 0 } = options;
      const where = { userId };
      if (interactionType) {
        where.interactionType = interactionType;
      }

      const interactions = await this.model.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            association: 'content',
            attributes: ['id', 'title'],
          },
        ],
      });

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
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({ where: { contentId } });
      this._logOperation('deleteContentInteractions', { contentId }, { deletedCount: result });
      return { deletedCount: result };
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
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({ where: { userId } });
      this._logOperation('deleteUserInteractions', { userId }, { deletedCount: result });
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'deleteUserInteractions', { userId });
      return { deletedCount: 0 };
    }
  }
}

module.exports = ContentInteractionMariaRepository;
