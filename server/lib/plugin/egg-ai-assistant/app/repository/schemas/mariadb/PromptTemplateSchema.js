/**
 * Prompt Template MariaDB Schema
 * 提示词模板表 - Sequelize Model
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * Prompt Template Schema for MariaDB
 * 对应 MongoDB 的 PromptTemplate Schema
 * @param sequelize
 * @param app
 */
const PromptTemplateSchema = (sequelize, app) => {
  const PromptTemplate = sequelize.define(
    'PromptTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 基本信息
      taskType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '任务类型：title_generation, tag_extraction等',
      },

      language: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'zh-CN',
        comment: '语言代码：zh-CN, en-US, ja-JP等',
      },

      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '模板名称',
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '模板描述',
      },

      // 模板内容
      template: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: '模板内容，支持变量占位符 {{variableName}}',
      },

      systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '系统提示词（用于设置AI角色）',
      },

      // 变量定义（JSON数组）
      variables: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '模板变量定义数组',
        get() {
          const value = this.getDataValue('variables');
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
            this.setDataValue('variables', value);
          } else {
            this.setDataValue('variables', []);
          }
        },
      },

      // 版本管理
      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0',
        comment: '版本号',
      },

      parentTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '父模板ID（用于版本继承）',
      },

      // 配置（JSON对象）
      config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: '模板配置: {maxLength, temperature, ...}',
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

      // 状态和优先级
      isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用',
      },

      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: '优先级，用于多版本A/B测试',
      },

      // 使用统计（JSON对象）
      statistics: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          usageCount: 0,
          successCount: 0,
          failureCount: 0,
          averageScore: 0,
          lastUsedAt: null,
        },
        comment: '使用统计',
        get() {
          const value = this.getDataValue('statistics');
          if (!value) {
            return {
              usageCount: 0,
              successCount: 0,
              failureCount: 0,
              averageScore: 0,
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

      // 效果评估（JSON对象）
      effectiveness: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          qualityScore: 0,
          relevanceScore: 0,
          userSatisfaction: 0,
          adoptionRate: 0,
        },
        comment: '效果评估',
        get() {
          const value = this.getDataValue('effectiveness');
          if (!value) {
            return {
              qualityScore: 0,
              relevanceScore: 0,
              userSatisfaction: 0,
              adoptionRate: 0,
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
            this.setDataValue('effectiveness', value);
          } else {
            this.setDataValue('effectiveness', {});
          }
        },
      },

      // 标签和分类
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

      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '分类',
      },

      // 示例数据（JSON数组）
      examples: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: '使用示例数组',
        get() {
          const value = this.getDataValue('examples');
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
            this.setDataValue('examples', value);
          } else {
            this.setDataValue('examples', []);
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
      tableName: 'prompt_templates',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          // 唯一索引：taskType + language + version
          unique: true,
          fields: ['taskType', 'language', 'version'],
          name: 'uk_task_lang_version',
        },
        {
          // 启用状态和优先级索引
          fields: ['isEnabled', 'priority'],
          name: 'idx_enabled_priority',
        },
        {
          // 任务类型索引
          fields: ['taskType'],
          name: 'idx_task_type',
        },
        {
          // FULLTEXT 全文搜索索引
          type: 'FULLTEXT',
          fields: ['name', 'description'],
          name: 'ft_search',
        },
      ],
    }
  );

  // 定义关联关系
  PromptTemplate.associate = function (models) {
    // 自关联：父模板
    PromptTemplate.belongsTo(PromptTemplate, {
      foreignKey: 'parentTemplateId',
      as: 'parentTemplate',
    });
    // 注意：models 参数可用于关联其他模型，目前自关联不需要
  };

  // 实例方法：渲染模板
  PromptTemplate.prototype.render = function (variables = {}) {
    let rendered = this.template;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value);
    }

    return rendered;
  };

  // 实例方法：验证变量
  PromptTemplate.prototype.validateVariables = function (variables = {}) {
    const errors = [];

    // 检查必需变量
    for (const varDef of this.variables || []) {
      if (varDef.required && !variables[varDef.name]) {
        errors.push(`Required variable '${varDef.name}' is missing`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 实例方法：递增使用次数
  PromptTemplate.prototype.incrementUsage = async function (success = true) {
    const stats = this.statistics || {};
    stats.usageCount = (stats.usageCount || 0) + 1;

    if (success) {
      stats.successCount = (stats.successCount || 0) + 1;
    } else {
      stats.failureCount = (stats.failureCount || 0) + 1;
    }

    stats.lastUsedAt = new Date();
    this.statistics = stats;

    return await this.save();
  };

  // 类方法：查找最新版本
  PromptTemplate.findLatestVersion = async function (taskType, language) {
    return await this.findOne({
      where: {
        taskType,
        language,
        isEnabled: true,
      },
      order: [
        ['version', 'DESC'],
        ['priority', 'DESC'],
      ],
    });
  };

  // 类方法：查找所有版本
  PromptTemplate.findAllVersions = async function (taskType, language) {
    return await this.findAll({
      where: {
        taskType,
        language,
      },
      order: [['version', 'DESC']],
    });
  };

  // 类方法：获取任务类型列表
  PromptTemplate.getTaskTypes = async function () {
    const results = await this.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('taskType')), 'taskType']],
      raw: true,
    });
    return results.map(r => r.taskType);
  };

  // 类方法：获取支持的语言列表
  PromptTemplate.getSupportedLanguages = async function () {
    const results = await this.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('language')), 'language']],
      raw: true,
    });
    return results.map(r => r.language);
  };

  return PromptTemplate;
};

module.exports = PromptTemplateSchema;
