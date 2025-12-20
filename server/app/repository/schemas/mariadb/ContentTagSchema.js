/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: ContentTag MariaDB Schema 定义
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * ContentTag Schema for MariaDB
 * 内容标签表结构定义 - 基于 MongoDB 模型设计
 * @param sequelize
 * @param app
 */
const ContentTagSchema = (sequelize, app) => {
  const ContentTag = sequelize.define(
    'ContentTag',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 核心字段（与 MongoDB 模型一致）
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '标签名称',
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      alias: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '标签别名',
        unique: true,
        validate: {
          len: [0, 100],
        },
      },

      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '标签描述/备注',
      },

      // 统一时间字段
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '创建时间',
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '更新时间',
        defaultValue: DataTypes.NOW,
      },

      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '使用次数',
      },

      enable: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '是否启用: 0-禁用, 1-启用',
        validate: {
          isIn: [[0, 1]],
        },
      },

      sortId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序ID',
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'content_tags',
      comment: '内容标签表',

      // 添加虚拟字段以保持与 MongoDB 风格的兼容性
      getterMethods: {
        // 虚拟 URL 字段
        url() {
          return `/tag/${this.name}`;
        },
      },

      hooks: {
        beforeUpdate(instance) {
          instance.updatedAt = new Date();
        },

        beforeBulkUpdate(options) {
          options.attributes.updatedAt = new Date();
        },

        beforeCreate(instance) {
          if (!instance.createdAt) {
            instance.createdAt = new Date();
          }
          if (!instance.updatedAt) {
            instance.updatedAt = new Date();
          }
        },
      },

      // 索引定义
      indexes: [
        {
          unique: true,
          fields: ['name'],
        },
        {
          unique: true,
          fields: ['alias'],
          where: {
            alias: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        {
          fields: ['enable'],
        },
        {
          fields: ['sortId'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['usageCount'],
        },
      ],

      // 验证规则
      validate: {
        // 确保 name 不为空
        nameRequired() {
          if (!this.name || this.name.trim() === '') {
            throw new Error('标签名称不能为空');
          }
        },

        // 确保 alias 如果存在则不为空
        aliasValid() {
          if (this.alias !== null && this.alias !== undefined && this.alias.trim() === '') {
            throw new Error('标签别名不能为空字符串');
          }
        },
      },
    }
  );

  // 定义关联关系
  ContentTag.associate = models => {
    // ContentTag 与其他模型的关联关系
    // 通常标签是被其他实体引用的，所以这里可能不需要定义关联
    // 如果需要统计关联的内容数量，可以定义 hasMany 关系
    // 但通常通过中间表或者数组字段来处理标签关联
  };

  // 类方法
  ContentTag.findByName = function (name) {
    return this.findOne({ where: { name } });
  };

  ContentTag.findByAlias = function (alias) {
    return this.findOne({ where: { alias } });
  };

  ContentTag.findByState = function (state) {
    const enable = state === '2' ? 1 : 0;
    return this.findAll({ where: { enable } });
  };

  ContentTag.findHotTags = function (limit = 10) {
    return this.findAll({
      where: {
        enable: 1,
      },
      order: [
        ['usageCount', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
    });
  };

  ContentTag.findPopularTags = function (limit = 20) {
    return this.findAll({
      where: {
        enable: 1,
      },
      order: [
        ['usageCount', 'DESC'],
        ['name', 'ASC'],
      ],
      limit,
    });
  };

  // 实例方法
  ContentTag.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加虚拟 URL 字段
    values.url = `/tag/${values.name}`;

    // 🔥 字段映射 - 保持与 MongoDB 模型的兼容性
    // MongoDB模型没有state字段，保持原始enable字段
    // values.state = values.enable === 1 ? '2' : '0'; // 注释掉，保持原始字段

    // 兼容字段映射（如果需要）
    values.refCount = values.usageCount || 0;

    // 🔥 格式化日期 - 使用moment格式化
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 添加状态文本
    values.enableText = values.enable === 1 ? '启用' : '禁用';

    return values;
  };

  ContentTag.prototype.incrementRefCount = function () {
    return this.increment('usageCount');
  };

  ContentTag.prototype.decrementRefCount = function () {
    return this.decrement('usageCount');
  };

  ContentTag.prototype.getDisplayName = function () {
    return this.name || `ContentTag-${this.id}`;
  };

  ContentTag.prototype.getUrl = function () {
    return `/tag/${this.name}`;
  };

  return ContentTag;
};

module.exports = ContentTagSchema;
