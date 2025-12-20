/**
 * MessageInteraction MariaDB/Sequelize 模型定义
 * 留言交互记录表 - 存储点赞、踩等交互行为
 * Created: 2024-12-08
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const MessageInteraction = sequelize.define(
    'MessageInteraction',
    {
      // 主键字段
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      // 用户ID
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // 🔥 映射到数据库字段名
        comment: '用户ID (User.id)',
      },
      // 留言ID
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'message_id', // 🔥 映射到数据库字段名
        comment: '留言ID (Message.id)',
      },
      // 交互类型
      interactionType: {
        type: DataTypes.ENUM('praise', 'despise'),
        allowNull: false,
        field: 'interaction_type', // 🔥 映射到数据库字段名
        comment: '交互类型：praise-点赞，despise-踩',
      },
      // 创建时间
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at', // 🔥 映射到数据库字段名
        comment: '创建时间',
        get() {
          const raw = this.getDataValue('createdAt');
          return raw ? moment(raw).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      // IP地址
      ipAddress: {
        type: DataTypes.STRING(45), // 支持IPv6
        allowNull: true,
        field: 'ip_address', // 🔥 映射到数据库字段名
        comment: 'IP地址',
      },
      // 用户代理
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent', // 🔥 映射到数据库字段名
        comment: '用户代理信息',
      },
    },
    {
      tableName: 'message_interactions',
      timestamps: false,
      underscored: false, // 🔥 不自动转换，使用field手动映射
      indexes: [
        // 🔥 唯一索引：确保用户对同一留言的同一类型交互只能有一条记录
        {
          unique: true,
          fields: ['userId', 'messageId', 'interactionType'],
          name: 'uk_user_message_type',
        },
        // 🔥 查询优化索引：按留言ID和交互类型查询（统计点赞数/踩数）
        {
          fields: ['messageId', 'interactionType'],
          name: 'idx_message_type',
        },
        // 🔥 查询优化索引：按用户ID和创建时间查询（用户交互历史）
        {
          fields: ['userId', 'createdAt'],
          name: 'idx_user_created',
        },
      ],
      comment: '留言交互记录表',
    }
  );

  // 🔥 关联关系定义
  MessageInteraction.associate = function (models) {
    // 关联用户表
    MessageInteraction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: true,
      onDelete: 'CASCADE', // 用户删除时级联删除交互记录
    });

    // 关联留言表
    MessageInteraction.belongsTo(models.Message, {
      foreignKey: 'messageId',
      as: 'message',
      constraints: true,
      onDelete: 'CASCADE', // 留言删除时级联删除交互记录
    });
  };

  // 🔥 类方法：检查用户是否已交互
  MessageInteraction.hasInteraction = async function (userId, messageId, interactionType) {
    const count = await this.count({
      where: { userId, messageId, interactionType },
    });
    return count > 0;
  };

  // 🔥 类方法：获取留言的交互统计
  MessageInteraction.getInteractionStats = async function (messageId) {
    const praiseCount = await this.count({
      where: { messageId, interactionType: 'praise' },
    });
    const despiseCount = await this.count({
      where: { messageId, interactionType: 'despise' },
    });
    return { praiseCount, despiseCount };
  };

  // 🔥 类方法：批量获取用户的交互状态
  MessageInteraction.getUserInteractionStatus = async function (userId, messageIds, interactionType) {
    const interactions = await this.findAll({
      where: {
        userId,
        messageId: messageIds,
        interactionType,
      },
      attributes: ['messageId'],
    });
    return interactions.map(item => item.messageId);
  };

  // 🔥 类方法：批量统计多个留言的交互数
  MessageInteraction.batchGetInteractionCounts = async function (messageIds, interactionType) {
    const { Op } = require('sequelize');
    const results = await this.findAll({
      where: {
        messageId: { [Op.in]: messageIds },
        interactionType,
      },
      attributes: ['messageId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['messageId'],
      raw: true,
    });

    // 转换为 Map 结构
    const countMap = new Map();
    messageIds.forEach(id => countMap.set(id, 0)); // 初始化为0
    results.forEach(item => {
      countMap.set(item.messageId, parseInt(item.count) || 0);
    });
    return countMap;
  };

  // 🔥 实例方法
  MessageInteraction.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    values.interactionTypeText = values.interactionType === 'praise' ? '点赞' : '踩';
    return values;
  };

  return MessageInteraction;
};
