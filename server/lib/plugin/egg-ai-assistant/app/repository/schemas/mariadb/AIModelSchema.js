/**
 * AI Model MariaDB Schema
 * AI 模型配置表 - Sequelize Model
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * AI Model Schema for MariaDB
 * 对应 MongoDB 的 AIModel Schema
 * @param sequelize
 * @param app
 */
const AIModelSchema = (sequelize, app) => {
  const AIModel = sequelize.define(
    'AIModel',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 基本信息
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'AI提供商: openai, deepseek, ollama, anthropic, doubao',
        validate: {
          isIn: [['openai', 'deepseek', 'ollama', 'anthropic', 'doubao', 'other']],
        },
      },

      modelName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '模型名称，如 gpt-4, deepseek-chat',
      },

      displayName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '显示名称',
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '模型描述',
      },

      // 模型配置（JSON对象）
      config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: '模型配置: {apiKey, apiEndpoint, maxTokens, ...}',
        get() {
          const value = this.getDataValue('config');
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
            this.setDataValue('config', value);
          } else {
            this.setDataValue('config', {});
          }
        },
      },

      // 任务支持（JSON数组）
      supportedTasks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '支持的任务类型数组',
        get() {
          const value = this.getDataValue('supportedTasks');
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
            this.setDataValue('supportedTasks', value);
          } else {
            this.setDataValue('supportedTasks', []);
          }
        },
      },

      // 成本管理
      costPerRequest: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '每次请求成本(元)',
      },

      costPer1kTokens: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0,
        comment: '每1K tokens成本(元)',
      },

      // 优先级和状态
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: '优先级，数字越大优先级越高',
      },

      isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用',
      },

      // 统计信息（JSON对象）
      statistics: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          totalCalls: 0,
          totalTokens: 0,
          totalCost: 0,
          successRate: 1.0,
          averageResponseTime: 0,
          lastUsedAt: null,
        },
        comment: '统计信息',
        get() {
          const value = this.getDataValue('statistics');
          if (!value) {
            return {
              totalCalls: 0,
              totalTokens: 0,
              totalCost: 0,
              successRate: 1.0,
              averageResponseTime: 0,
              lastUsedAt: null,
            };
          }
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {};
            }
          }
          return value;
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('statistics', value);
          } else {
            this.setDataValue('statistics', {});
          }
        },
      },

      // 健康状态（JSON对象）
      health: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          isHealthy: true,
          lastCheckTime: null,
          errorCount: 0,
          lastError: null,
        },
        comment: '健康状态',
        get() {
          const value = this.getDataValue('health');
          if (!value) {
            return {
              isHealthy: true,
              lastCheckTime: null,
              errorCount: 0,
              lastError: null,
            };
          }
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {};
            }
          }
          return value;
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('health', value);
          } else {
            this.setDataValue('health', {});
          }
        },
      },

      // 降级配置
      fallbackModelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '降级模型ID',
      },

      maxRetries: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        comment: '最大重试次数',
      },

      // 元数据
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

      // 创建者信息
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '创建者ID',
      },

      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '最后更新者ID',
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
      tableName: 'ai_models',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          // 唯一索引：provider + modelName
          unique: true,
          fields: ['provider', 'modelName'],
          name: 'uk_provider_model',
        },
        {
          // 启用状态和优先级索引
          fields: ['isEnabled', 'priority'],
          name: 'idx_enabled_priority',
        },
        {
          // FULLTEXT 全文搜索索引
          type: 'FULLTEXT',
          fields: ['displayName', 'description'],
          name: 'ft_search',
        },
      ],
    }
  );

  // 定义关联关系
  AIModel.associate = function (models) {
    // 自关联：降级模型
    AIModel.belongsTo(AIModel, {
      foreignKey: 'fallbackModelId',
      as: 'fallbackModel',
    });

    // 如果需要关联 Admin 表（创建者）
    // 在插件加载时动态关联
    // 注意：models 参数可用于关联其他模型，目前自关联不需要
  };

  // 实例方法：检查是否可用
  AIModel.prototype.isAvailable = function () {
    return this.isEnabled && this.health?.isHealthy !== false;
  };

  // 实例方法：递增错误计数
  AIModel.prototype.incrementErrorCount = async function () {
    const currentHealth = this.health || {};
    currentHealth.errorCount = (currentHealth.errorCount || 0) + 1;
    currentHealth.lastCheckTime = new Date();

    // 连续错误超过阈值，标记为不健康
    if (currentHealth.errorCount >= 5) {
      currentHealth.isHealthy = false;
    }

    this.health = currentHealth;
    return await this.save();
  };

  // 实例方法：重置健康状态
  AIModel.prototype.resetHealth = async function () {
    this.health = {
      isHealthy: true,
      errorCount: 0,
      lastCheckTime: new Date(),
      lastError: null,
    };
    return await this.save();
  };

  // 类方法：查找最优模型
  AIModel.findOptimalModel = async function (taskType) {
    return await this.findOne({
      where: {
        isEnabled: true,
        // JSON 字段查询需要使用 Sequelize.fn
        '$health.isHealthy$': true,
      },
      order: [
        ['priority', 'DESC'],
        ['costPerRequest', 'ASC'],
      ],
    });
  };

  // 类方法：批量更新状态
  AIModel.batchUpdateStatus = async function (modelIds, isEnabled) {
    return await this.update(
      { isEnabled },
      {
        where: {
          id: modelIds,
        },
      }
    );
  };

  return AIModel;
};

module.exports = AIModelSchema;
