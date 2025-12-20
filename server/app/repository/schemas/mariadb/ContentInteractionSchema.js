/**
 * ContentInteraction MariaDB/Sequelize 模型定义
 * 文章交互记录表 - 存储点赞、收藏、踩等交互行为
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const ContentInteraction = sequelize.define(
    'ContentInteraction',
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
        field: 'user_id',
        comment: '用户ID (User.id)',
      },
      // 文章ID
      contentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'content_id',
        comment: '文章ID (Content.id)',
      },
      // 交互类型
      interactionType: {
        type: DataTypes.ENUM('praise', 'favorite', 'despise'),
        allowNull: false,
        field: 'interaction_type',
        comment: '交互类型：praise-点赞，favorite-收藏，despise-踩',
      },
      // 创建时间
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
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
        field: 'ip_address',
        comment: 'IP地址',
      },
      // 用户代理
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: '用户代理信息',
      },
    },
    {
      tableName: 'content_interactions',
      timestamps: false,
      underscored: false,
      indexes: [
        // 唯一索引：确保用户对同一文章的同一类型交互只能有一条记录
        {
          unique: true,
          fields: ['userId', 'contentId', 'interactionType'],
          name: 'uk_user_content_type',
        },
        // 查询优化索引：按文章ID和交互类型查询（统计点赞数/收藏数等）
        {
          fields: ['contentId', 'interactionType'],
          name: 'idx_content_type',
        },
        // 查询优化索引：按用户ID和创建时间查询（用户交互历史）
        {
          fields: ['userId', 'createdAt'],
          name: 'idx_user_created',
        },
      ],
      comment: '文章交互记录表',
    }
  );

  // 关联关系定义
  ContentInteraction.associate = function (models) {
    // 关联用户表
    ContentInteraction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: true,
      onDelete: 'CASCADE', // 用户删除时级联删除交互记录
    });

    // 关联文章表
    ContentInteraction.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content',
      constraints: true,
      onDelete: 'CASCADE', // 文章删除时级联删除交互记录
    });
  };

  return ContentInteraction;
};
