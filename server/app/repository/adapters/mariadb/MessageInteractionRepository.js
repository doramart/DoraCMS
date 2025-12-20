/**
 * MessageInteraction MariaDB Repository
 * 🔥 基于 BaseMariaRepository 的标准实现
 * 实现留言交互记录的MariaDB数据访问
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const MessageInteractionSchema = require('../../schemas/mariadb/MessageInteractionSchema');

class MessageInteractionMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'MessageInteraction');

    // 初始化 MariaDB 连接
    // 🔥 使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
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

      // 直接创建模型实例
      this.model = MessageInteractionSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // 关联用户表
          user: {
            model: 'User',
            foreignKey: 'userId',
            as: 'user',
          },
          // 关联留言表
          message: {
            model: 'Message',
            foreignKey: 'messageId',
            as: 'message',
          },
        },
      });
    } catch (error) {
      console.error('❌ MessageInteractionMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      { association: 'user', attributes: ['id', 'userName', 'logo'] },
      { association: 'message', attributes: ['id', 'content', 'contentId'] },
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
   * 使用 findOrCreate 保证幂等性
   * @param {Object} interactionData 交互数据
   * @return {Promise<Object>} 创建的交互记录
   */
  async addInteraction(interactionData) {
    await this._ensureConnection();

    const { userId, messageId, interactionType, ipAddress, userAgent } = interactionData;

    try {
      // 🔥 使用 findOrCreate 保证幂等性
      const [interaction, created] = await this.model.findOrCreate({
        where: { userId, messageId, interactionType },
        defaults: {
          userId,
          messageId,
          interactionType,
          ipAddress,
          userAgent,
          createdAt: new Date(),
        },
      });

      this._logOperation('addInteraction', interactionData, { created });
      return interaction;
    } catch (error) {
      // 处理唯一键冲突
      if (error.name === 'SequelizeUniqueConstraintError') {
        // 已存在，直接查询返回
        const existing = await this.model.findOne({
          where: { userId, messageId, interactionType },
        });
        this._logOperation('addInteraction', interactionData, { created: false, existing: true });
        return existing;
      }
      this._handleError(error, 'addInteraction', interactionData);
    }
  }

  /**
   * 移除交互记录（取消点赞/踩）
   * @param {String|Number} userId 用户ID
   * @param {String|Number} messageId 留言ID
   * @param {String} interactionType 交互类型
   * @return {Promise<Object>} 删除结果
   */
  async removeInteraction(userId, messageId, interactionType) {
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({
        where: { userId, messageId, interactionType },
      });

      this._logOperation('removeInteraction', { userId, messageId, interactionType }, { deletedCount: result });
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'removeInteraction', { userId, messageId, interactionType });
    }
  }

  /**
   * 检查用户是否已交互
   * @param {String|Number} userId 用户ID
   * @param {String|Number} messageId 留言ID
   * @param {String} interactionType 交互类型
   * @return {Promise<Boolean>} 是否已交互
   */
  async hasInteraction(userId, messageId, interactionType) {
    await this._ensureConnection();

    try {
      const count = await this.model.count({
        where: { userId, messageId, interactionType },
      });

      this._logOperation('hasInteraction', { userId, messageId, interactionType }, { hasInteraction: count > 0 });
      return count > 0;
    } catch (error) {
      this._handleError(error, 'hasInteraction', { userId, messageId, interactionType });
      return false;
    }
  }

  /**
   * 获取留言的交互统计
   * @param {String|Number} messageId 留言ID
   * @return {Promise<Object>} { praiseCount, despiseCount }
   */
  async getInteractionStats(messageId) {
    await this._ensureConnection();

    try {
      const praiseCount = await this.model.count({
        where: { messageId, interactionType: 'praise' },
      });
      const despiseCount = await this.model.count({
        where: { messageId, interactionType: 'despise' },
      });

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
   * @param {String|Number} userId 用户ID
   * @param {Array} messageIds 留言ID数组
   * @param {String} interactionType 交互类型
   * @return {Promise<Array>} 已交互的留言ID数组
   */
  async getUserInteractionStatus(userId, messageIds, interactionType) {
    await this._ensureConnection();

    try {
      const { Op } = require('sequelize');
      const interactions = await this.model.findAll({
        where: {
          userId,
          messageId: { [Op.in]: messageIds },
          interactionType,
        },
        attributes: ['messageId'],
        raw: true,
      });

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
    await this._ensureConnection();

    try {
      const { Op, fn, col } = require('sequelize');
      const results = await this.model.findAll({
        where: {
          messageId: { [Op.in]: messageIds },
          interactionType,
        },
        attributes: ['messageId', [fn('COUNT', col('id')), 'count']],
        group: ['messageId'],
        raw: true,
      });

      // 转换为 Map 结构
      const countMap = new Map();
      messageIds.forEach(id => countMap.set(id, 0)); // 初始化为0
      results.forEach(item => {
        countMap.set(item.messageId, parseInt(item.count) || 0);
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
   * @param {String|Number} userId 用户ID
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 交互记录列表
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
            association: 'message',
            attributes: ['id', 'content', 'contentId', 'createdAt'],
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
   * 删除留言的所有交互记录
   * @param {String|Number} messageId 留言ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteMessageInteractions(messageId) {
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({
        where: { messageId },
      });

      this._logOperation('deleteMessageInteractions', { messageId }, { deletedCount: result });
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'deleteMessageInteractions', { messageId });
      return { deletedCount: 0 };
    }
  }

  /**
   * 删除用户的所有交互记录
   * @param {String|Number} userId 用户ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteUserInteractions(userId) {
    await this._ensureConnection();

    try {
      const result = await this.model.destroy({
        where: { userId },
      });

      this._logOperation('deleteUserInteractions', { userId }, { deletedCount: result });
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'deleteUserInteractions', { userId });
      return { deletedCount: 0 };
    }
  }
}

module.exports = MessageInteractionMariaRepository;
