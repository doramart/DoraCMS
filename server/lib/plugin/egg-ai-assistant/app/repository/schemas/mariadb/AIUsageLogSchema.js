/**
 * AI Usage Log MariaDB Schema
 * AI使用日志表 - Sequelize Model
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * AI Usage Log Schema for MariaDB
 * 对应 MongoDB 的 AIUsageLog Schema
 * @param sequelize
 * @param app
 */
const AIUsageLogSchema = (sequelize, app) => {
  const AIUsageLog = sequelize.define(
    'AIUsageLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 用户信息
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '用户ID',
      },

      userType: {
        type: DataTypes.STRING(20),
        defaultValue: 'admin',
        comment: '用户类型: admin, user',
        validate: {
          isIn: [['admin', 'user']],
        },
      },

      // 任务信息
      taskType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '任务类型：title_generation, tag_extraction等',
      },

      taskDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '任务描述',
      },

      // 模型信息
      modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '使用的模型ID',
      },

      provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'AI提供商',
      },

      modelName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '模型名称',
      },

      // 提示词信息
      promptTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '使用的提示词模板ID',
      },

      promptVersion: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '提示词版本',
      },

      // 输入输出
      input: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: '输入内容',
        get() {
          const value = this.getDataValue('input');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return value;
            }
          }
          return value;
        },
        set(value) {
          if (typeof value === 'object') {
            this.setDataValue('input', JSON.stringify(value));
          } else {
            this.setDataValue('input', value);
          }
        },
      },

      output: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: '输出内容',
        get() {
          const value = this.getDataValue('output');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return value;
            }
          }
          return value;
        },
        set(value) {
          if (typeof value === 'object') {
            this.setDataValue('output', JSON.stringify(value));
          } else {
            this.setDataValue('output', value);
          }
        },
      },

      rawResponse: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'AI原始响应（用于调试）',
        get() {
          const value = this.getDataValue('rawResponse');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return value;
            }
          }
          return value;
        },
        set(value) {
          if (typeof value === 'object') {
            this.setDataValue('rawResponse', JSON.stringify(value));
          } else {
            this.setDataValue('rawResponse', value);
          }
        },
      },

      // 执行信息
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'success',
        comment: '执行状态: success, failure, partial, timeout',
        validate: {
          isIn: [['success', 'failure', 'partial', 'timeout']],
        },
      },

      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息（如果失败）',
      },

      errorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '错误代码',
      },

      // Token和成本
      inputTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '输入Token数量',
      },

      outputTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '输出Token数量',
      },

      totalTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '总Token数量',
      },

      cost: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '本次调用成本（元）',
      },

      // 性能指标
      responseTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '响应时间（毫秒）',
      },

      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '重试次数',
      },

      isFallback: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否使用了降级模型',
      },

      // 质量评估（JSON对象）
      quality: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: '质量评估',
        get() {
          const value = this.getDataValue('quality');
          if (!value) return {};
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {};
            }
          }
          return value || {};
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('quality', value);
          } else {
            this.setDataValue('quality', {});
          }
        },
      },

      // 请求上下文（JSON对象）
      context: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: '请求上下文',
        get() {
          const value = this.getDataValue('context');
          if (!value) return {};
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {};
            }
          }
          return value || {};
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('context', value);
          } else {
            this.setDataValue('context', {});
          }
        },
      },

      // 业务关联
      relatedContentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '关联的内容ID（如文章ID）',
      },

      relatedType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '关联类型（如 article, product）',
      },

      // 标签
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '标签数组',
        get() {
          const value = this.getDataValue('tags');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              return [];
            }
          }
          return [];
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('tags', value);
          } else {
            this.setDataValue('tags', []);
          }
        },
      },

      // 元数据
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: '扩展元数据',
        get() {
          const value = this.getDataValue('metadata');
          if (!value) return {};
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {};
            }
          }
          return value || {};
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('metadata', value);
          } else {
            this.setDataValue('metadata', {});
          }
        },
      },

      // 时间信息
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '开始时间',
      },

      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '结束时间',
      },

      // 时间戳
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },
    },
    {
      tableName: 'ai_usage_logs',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          // 用户和时间索引
          fields: ['userId', 'createdAt'],
          name: 'idx_user_time',
        },
        {
          // 模型和时间索引
          fields: ['modelId', 'createdAt'],
          name: 'idx_model_time',
        },
        {
          // 任务类型和时间索引
          fields: ['taskType', 'createdAt'],
          name: 'idx_task_time',
        },
        {
          // 状态索引
          fields: ['status'],
          name: 'idx_status',
        },
        {
          // 创建时间索引
          fields: ['createdAt'],
          name: 'idx_created_at',
        },
        {
          // 关联内容索引
          fields: ['relatedContentId', 'relatedType'],
          name: 'idx_related',
        },
        {
          // 复合索引：用户+任务类型+时间
          fields: ['userId', 'taskType', 'createdAt'],
          name: 'idx_user_task_time',
        },
      ],
    }
  );

  // 定义关联关系
  AIUsageLog.associate = function (models) {
    // 关联 AI Model
    AIUsageLog.belongsTo(models.AIModel, {
      foreignKey: 'modelId',
      as: 'model',
    });

    // 关联 Prompt Template
    AIUsageLog.belongsTo(models.PromptTemplate, {
      foreignKey: 'promptTemplateId',
      as: 'promptTemplate',
    });
  };

  // 实例方法：计算成本
  AIUsageLog.prototype.calculateCost = function (costPer1kTokens) {
    this.cost = (this.totalTokens / 1000) * costPer1kTokens;
    return this.cost;
  };

  // 实例方法：标记为成功
  AIUsageLog.prototype.markAsSuccess = async function (output) {
    this.status = 'success';
    this.output = output;
    this.endTime = new Date();
    this.responseTime = this.endTime - this.startTime;
    return await this.save();
  };

  // 实例方法：标记为失败
  AIUsageLog.prototype.markAsFailure = async function (error) {
    this.status = 'failure';
    this.errorMessage = error.message || String(error);
    this.errorCode = error.code;
    this.endTime = new Date();
    this.responseTime = this.endTime - this.startTime;
    return await this.save();
  };

  // 虚拟字段：是否成功
  AIUsageLog.prototype.isSuccess = function () {
    return this.status === 'success';
  };

  // 虚拟字段：Token使用效率
  AIUsageLog.prototype.getTokenEfficiency = function () {
    if (this.responseTime === 0) return 0;
    return this.totalTokens / (this.responseTime / 1000); // tokens per second
  };

  return AIUsageLog;
};

module.exports = AIUsageLogSchema;
