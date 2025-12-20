/**
 * Prompt Template MongoDB Schema
 * 提示词模板表
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const shortid = require('shortid');

  const PromptTemplateSchema = new Schema(
    {
      _id: {
        type: String,
        default: shortid.generate,
      },

      // 基本信息
      taskType: {
        type: String,
        required: true,
        index: true,
        comment: '任务类型：title_generation, tag_extraction, summary_generation等',
      },
      language: {
        type: String,
        required: true,
        default: 'zh-CN',
        index: true,
        comment: '语言代码：zh-CN, en-US, ja-JP等',
      },
      name: {
        type: String,
        required: true,
        comment: '模板名称',
      },
      description: {
        type: String,
        comment: '模板描述',
      },

      // 模板内容
      template: {
        type: String,
        required: true,
        comment: '模板内容，支持变量占位符 {{variableName}}',
      },
      systemPrompt: {
        type: String,
        comment: '系统提示词（用于设置AI角色）',
      },

      // 变量定义
      variables: {
        type: [
          {
            name: { type: String, required: true, comment: '变量名' },
            type: {
              type: String,
              enum: ['string', 'number', 'boolean', 'array', 'object'],
              default: 'string',
              comment: '变量类型',
            },
            required: { type: Boolean, default: false, comment: '是否必需' },
            defaultValue: { type: Schema.Types.Mixed, comment: '默认值' },
            description: { type: String, comment: '变量说明' },
            example: { type: String, comment: '示例值' },
          },
        ],
        default: [],
        comment: '模板变量定义',
      },

      // 版本管理
      version: {
        type: String,
        default: '1.0.0',
        comment: '版本号',
      },
      parentTemplateId: {
        type: String,
        ref: 'PromptTemplate',
        comment: '父模板ID（用于版本继承）',
      },

      // 配置
      config: {
        maxLength: { type: Number, comment: '生成内容最大长度' },
        temperature: { type: Number, default: 0.7, comment: '温度参数' },
        topP: { type: Number, default: 1.0, comment: 'Top P参数' },
        stopSequences: { type: [String], comment: '停止序列' },
        extraParams: { type: Schema.Types.Mixed, comment: '其他参数' },
      },

      // 状态和优先级
      isEnabled: {
        type: Boolean,
        default: true,
        index: true,
        comment: '是否启用',
      },
      priority: {
        type: Number,
        default: 10,
        comment: '优先级，用于多版本A/B测试',
      },

      // 使用统计
      statistics: {
        usageCount: { type: Number, default: 0, comment: '使用次数' },
        successCount: { type: Number, default: 0, comment: '成功次数' },
        failureCount: { type: Number, default: 0, comment: '失败次数' },
        averageScore: { type: Number, default: 0, comment: '平均评分(0-10)' },
        lastUsedAt: { type: Date, comment: '最后使用时间' },
      },

      // 效果评估
      effectiveness: {
        qualityScore: { type: Number, default: 0, comment: '质量得分(0-100)' },
        relevanceScore: { type: Number, default: 0, comment: '相关性得分(0-100)' },
        userSatisfaction: { type: Number, default: 0, comment: '用户满意度(0-10)' },
        adoptionRate: { type: Number, default: 0, comment: '采纳率(0-1)' },
      },

      // 标签和分类
      tags: {
        type: [{ type: String }],
        default: [],
        index: true,
        comment: '标签',
      },
      category: {
        type: String,
        comment: '分类',
      },

      // 示例数据
      examples: {
        type: [
          {
            input: { type: Schema.Types.Mixed, comment: '输入示例' },
            output: { type: String, comment: '输出示例' },
            description: { type: String, comment: '示例说明' },
          },
        ],
        default: [],
        comment: '使用示例',
      },

      // 元数据
      metadata: {
        type: Schema.Types.Mixed,
        comment: '扩展元数据',
      },

      // 创建者信息
      createdBy: {
        type: String,
        ref: 'Admin',
        comment: '创建者ID',
      },
      updatedBy: {
        type: String,
        ref: 'Admin',
        comment: '最后更新者ID',
      },
    },
    {
      timestamps: true,
      collection: 'prompt_templates',
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // 索引
  PromptTemplateSchema.index({ taskType: 1, language: 1, version: 1 }, { unique: true, name: 'uk_task_lang_version' });
  PromptTemplateSchema.index({ isEnabled: 1, priority: -1 }, { name: 'idx_enabled_priority' });
  PromptTemplateSchema.index({ tags: 1 }, { name: 'idx_tags' });
  PromptTemplateSchema.index({ 'statistics.usageCount': -1 }, { name: 'idx_usage_count' });

  // 文本搜索索引
  PromptTemplateSchema.index(
    { name: 'text', description: 'text', template: 'text' },
    { name: 'idx_text_search', weights: { name: 3, description: 2, template: 1 } }
  );

  // 虚拟字段
  PromptTemplateSchema.virtual('id').get(function () {
    return this._id;
  });

  // 虚拟字段：成功率
  PromptTemplateSchema.virtual('successRate').get(function () {
    const total = this.statistics.usageCount;
    if (total === 0) return 0;
    return this.statistics.successCount / total;
  });

  // 实例方法：渲染模板
  PromptTemplateSchema.methods.render = function (variables = {}) {
    let rendered = this.template;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value);
    }

    return rendered;
  };

  // 实例方法：验证变量
  PromptTemplateSchema.methods.validateVariables = function (variables = {}) {
    const errors = [];

    // 检查必需变量
    for (const varDef of this.variables) {
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
  PromptTemplateSchema.methods.incrementUsage = async function (success = true) {
    this.statistics.usageCount += 1;
    if (success) {
      this.statistics.successCount += 1;
    } else {
      this.statistics.failureCount += 1;
    }
    this.statistics.lastUsedAt = new Date();
    return await this.save();
  };

  // 静态方法：查找最新版本
  PromptTemplateSchema.statics.findLatestVersion = async function (taskType, language) {
    return await this.findOne({
      taskType,
      language,
      isEnabled: true,
    })
      .sort({ version: -1, priority: -1 })
      .exec();
  };

  // 静态方法：查找所有版本
  PromptTemplateSchema.statics.findAllVersions = async function (taskType, language) {
    return await this.find({
      taskType,
      language,
    })
      .sort({ version: -1 })
      .exec();
  };

  // 静态方法：获取任务类型列表
  PromptTemplateSchema.statics.getTaskTypes = async function () {
    return await this.distinct('taskType');
  };

  // 静态方法：获取支持的语言列表
  PromptTemplateSchema.statics.getSupportedLanguages = async function () {
    return await this.distinct('language');
  };

  // 保存前的钩子
  PromptTemplateSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  return mongoose.model('PromptTemplate', PromptTemplateSchema);
};
