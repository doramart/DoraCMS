/**
 * Message MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 Message 结构，支持与 User、Admin、Content 的关联
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const Message = sequelize.define(
    'Message',
    {
      // 主键字段 - 使用自增 ID 替代 MongoDB 的 id
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      // MongoDB id 的映射字段（保持兼容性）
      // 留言对应的内容ID
      contentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '内容ID (Content.id)',
      },
      contentTitle: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '留言对应的内容标题',
      },
      // 留言者ID
      author: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '留言者ID (User.id)',
      },
      // 管理员ID
      adminAuthor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '管理员ID (Admin.id)',
      },
      // 被回复者ID
      replyAuthor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '被回复者ID (User.id)',
      },
      // 被回复者管理员ID
      adminReplyAuthor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '被回复者管理员ID (Admin.id)',
      },
      state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否被举报',
      },
      utype: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0',
        comment: '评论者类型 0:普通用户, 1:管理员',
      },
      // 关联的留言Id
      relationMsgId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '父留言ID (Message.id)',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '留言时间',
        get() {
          const raw = this.getDataValue('createdAt');
          return raw ? moment(raw).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
        get() {
          const raw = this.getDataValue('updatedAt');
          return raw ? moment(raw).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      // 🔥 新增：审核相关字段
      auditStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'approved', // 默认自动通过，可配置为需要审核
        comment: '审核状态：pending-待审核，approved-已通过，rejected-已拒绝',
      },
      auditReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '审核拒绝原因',
      },
      auditBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '审核人ID (Admin.id)',
      },
      auditAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '审核时间',
        get() {
          const raw = this.getDataValue('auditAt');
          return raw ? moment(raw).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      // 🔥 新增：回复统计
      replyCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '回复数量',
      },
      // 🔥 新增：IP地址记录
      ipAddress: {
        type: DataTypes.STRING(45), // 支持IPv6
        allowNull: true,
        comment: '发布者IP地址',
      },
      // 🔥 新增：用户代理
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '用户代理信息',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '输入评论内容...',
        comment: '留言内容',
      },
      // 🔥 新增：冗余计数字段（性能优化）
      praise_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '点赞数（冗余字段，用于快速查询和排序）',
      },
      despise_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '踩数（冗余字段，用于快速查询和排序）',
      },
    },
    {
      tableName: 'messages',
      timestamps: false,
      indexes: [
        // 🔥 新增：点赞数索引（用于热门排序）
        {
          fields: ['praise_count'],
          name: 'idx_praise_count',
        },
        // 🔥 新增：踩数索引
        {
          fields: ['despise_count'],
          name: 'idx_despise_count',
        },
      ],
    }
  );

  // 🔥 关联关系定义 - 基于Admin、Content模块成功经验
  Message.associate = function (models) {
    // 内容关联 - 留言对应的内容
    Message.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'contentInfo', // 🔥 必须使用不同名称，避免与字段冲突
      constraints: false, // 允许软引用
    });

    // 用户关联 - 普通用户作者
    Message.belongsTo(models.User, {
      foreignKey: 'author',
      as: 'authorUser',
      constraints: false,
    });

    // 用户关联 - 被回复的普通用户
    Message.belongsTo(models.User, {
      foreignKey: 'replyAuthor',
      as: 'replyUser',
      constraints: false,
    });

    // 管理员关联 - 管理员作者
    Message.belongsTo(models.Admin, {
      foreignKey: 'adminAuthor',
      as: 'adminAuthorUser',
      constraints: false,
    });

    // 管理员关联 - 被回复的管理员
    Message.belongsTo(models.Admin, {
      foreignKey: 'adminReplyAuthor',
      as: 'adminReplyUser',
      constraints: false,
    });

    // 🔥 新增：审核人关联
    Message.belongsTo(models.Admin, {
      foreignKey: 'auditBy',
      as: 'auditAdmin',
      constraints: false,
    });

    // 自关联 - 父留言关系（回复功能）
    Message.belongsTo(models.Message, {
      foreignKey: 'relationMsgId',
      as: 'parentMessage',
      constraints: false,
    });

    // 自关联 - 子留言关系（一个留言可以有多个回复）
    Message.hasMany(models.Message, {
      foreignKey: 'relationMsgId',
      as: 'replies',
      constraints: false,
    });
  };

  // 🔥 类方法（基于Admin、Content模块经验）
  Message.findByContentId = function (contentId) {
    return this.findAll({
      where: { contentId },
      order: [['createdAt', 'DESC']],
    });
  };

  Message.findByAuthor = function (authorId) {
    return this.findAll({
      where: { author: authorId },
      order: [['createdAt', 'DESC']],
    });
  };

  Message.findByAdminAuthor = function (adminAuthorId) {
    return this.findAll({
      where: { adminAuthor: adminAuthorId },
      order: [['createdAt', 'DESC']],
    });
  };

  Message.findReplies = function (relationMsgId) {
    return this.findAll({
      where: { relationMsgId },
      order: [['createdAt', 'ASC']],
    });
  };

  Message.findByState = function (state) {
    return this.findAll({
      where: { state },
      order: [['createdAt', 'DESC']],
    });
  };

  Message.countByContentId = function (contentId) {
    return this.count({ where: { contentId } });
  };

  Message.countByState = function (state) {
    return this.count({ where: { state } });
  };

  // 🔥 实例方法（基于Message模块特有功能）
  Message.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 🔥 格式化日期（已在字段定义中处理）
    // 添加状态文本描述
    values.stateText = values.state ? '已举报' : '正常';
    values.utypeText = values.utype === '1' ? '管理员' : '普通用户';

    // 🔥 添加虚拟字段
    values.replyCount = 0; // 可以通过关联查询获取
    values.isReply = !!values.relationMsgId; // 是否为回复

    return values;
  };

  Message.prototype.getDisplayName = function () {
    const contentPreview = this.content ? this.content.substring(0, 50) : '';
    return `${contentPreview}${contentPreview.length >= 50 ? '...' : ''}`;
  };

  Message.prototype.isNormal = function () {
    return this.state === false;
  };

  Message.prototype.isReported = function () {
    return this.state === true;
  };

  Message.prototype.isFromUser = function () {
    return this.utype === '0';
  };

  Message.prototype.isFromAdmin = function () {
    return this.utype === '1';
  };

  Message.prototype.isReply = function () {
    return !!this.relationMsgId;
  };

  // 注意：hasPraise 和 isPraisedBy 方法已移除，因为点赞数据现在从User表动态计算

  return Message;
};
