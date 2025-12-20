/**
 * AI Model MongoDB Schema
 * AI 模型配置表
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const shortid = require('shortid');

  const AIModelSchema = new Schema(
    {
      _id: {
        type: String,
        default: shortid.generate,
      },

      // 基本信息
      provider: {
        type: String,
        required: true,
        enum: ['openai', 'deepseek', 'ollama', 'anthropic', 'doubao', 'other'],
        index: true,
        comment: 'AI提供商',
      },
      modelName: {
        type: String,
        required: true,
        index: true,
        comment: '模型名称，如 gpt-4, deepseek-chat',
      },
      displayName: {
        type: String,
        required: true,
        comment: '显示名称',
      },
      description: {
        type: String,
        comment: '模型描述',
      },

      // 模型配置
      config: {
        apiKey: { type: String, comment: 'API密钥（加密存储）' },
        apiEndpoint: { type: String, comment: 'API端点URL' },
        maxTokens: { type: Number, default: 4096, comment: '最大Token数' },
        temperature: { type: Number, default: 0.7, comment: '温度参数(0-2)' },
        topP: { type: Number, default: 1.0, comment: 'Top P参数(0-1)' },
        timeout: { type: Number, default: 30000, comment: '超时时间(毫秒)' },
        extraParams: { type: Schema.Types.Mixed, comment: '其他参数' },
      },

      // 任务支持
      supportedTasks: {
        type: [{ type: String }],
        default: [],
        comment: '支持的任务类型数组',
      },

      // 成本管理
      costPerRequest: {
        type: Number,
        default: 0,
        comment: '每次请求成本(元)',
      },
      costPer1kTokens: {
        type: Number,
        default: 0,
        comment: '每1K tokens成本(元)',
      },

      // 优先级和状态
      priority: {
        type: Number,
        default: 10,
        index: true,
        comment: '优先级，数字越大优先级越高',
      },
      isEnabled: {
        type: Boolean,
        default: true,
        index: true,
        comment: '是否启用',
      },

      // 统计信息
      statistics: {
        totalCalls: { type: Number, default: 0, comment: '总调用次数' },
        totalTokens: { type: Number, default: 0, comment: '总Token数' },
        totalCost: { type: Number, default: 0, comment: '总成本' },
        successRate: { type: Number, default: 1.0, comment: '成功率(0-1)' },
        averageResponseTime: { type: Number, default: 0, comment: '平均响应时间(毫秒)' },
        lastUsedAt: { type: Date, comment: '最后使用时间' },
      },

      // 健康状态
      health: {
        isHealthy: { type: Boolean, default: true, comment: '是否健康' },
        lastCheckTime: { type: Date, comment: '最后健康检查时间' },
        errorCount: { type: Number, default: 0, comment: '连续错误次数' },
        lastError: { type: String, comment: '最后一次错误信息' },
      },

      // 降级配置
      fallbackModelId: {
        type: String,
        ref: 'AIModel',
        comment: '降级模型ID',
      },
      maxRetries: {
        type: Number,
        default: 2,
        comment: '最大重试次数',
      },

      // 元数据
      tags: {
        type: [{ type: String }],
        default: [],
        comment: '标签',
      },
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
      collection: 'ai_models',
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // 索引
  AIModelSchema.index({ provider: 1, modelName: 1 }, { unique: true, name: 'uk_provider_model' });
  AIModelSchema.index({ isEnabled: 1, priority: -1 }, { name: 'idx_enabled_priority' });
  AIModelSchema.index({ supportedTasks: 1 }, { name: 'idx_supported_tasks' });
  AIModelSchema.index({ 'statistics.totalCalls': -1 }, { name: 'idx_total_calls' });

  // 文本搜索索引
  AIModelSchema.index(
    { displayName: 'text', description: 'text' },
    { name: 'idx_text_search', weights: { displayName: 2, description: 1 } }
  );

  // 虚拟字段
  AIModelSchema.virtual('id').get(function () {
    return this._id;
  });

  // 虚拟字段：成本效率（calls/cost）
  AIModelSchema.virtual('costEfficiency').get(function () {
    if (this.statistics.totalCost === 0) return 0;
    return this.statistics.totalCalls / this.statistics.totalCost;
  });

  // 实例方法：检查是否可用
  AIModelSchema.methods.isAvailable = function () {
    return this.isEnabled && this.health.isHealthy;
  };

  // 实例方法：增加错误计数
  AIModelSchema.methods.incrementErrorCount = async function () {
    this.health.errorCount += 1;
    this.health.lastCheckTime = new Date();

    // 连续错误超过阈值，标记为不健康
    if (this.health.errorCount >= 5) {
      this.health.isHealthy = false;
    }

    return await this.save();
  };

  // 实例方法：重置健康状态
  AIModelSchema.methods.resetHealth = async function () {
    this.health.isHealthy = true;
    this.health.errorCount = 0;
    this.health.lastCheckTime = new Date();
    this.health.lastError = null;
    return await this.save();
  };

  // 静态方法：查找最优模型
  AIModelSchema.statics.findOptimalModel = async function (taskType) {
    return await this.findOne({
      isEnabled: true,
      'health.isHealthy': true,
      supportedTasks: taskType,
    })
      .sort({ priority: -1, costPerRequest: 1 })
      .exec();
  };

  // 静态方法：批量更新状态
  AIModelSchema.statics.batchUpdateStatus = async function (modelIds, isEnabled) {
    return await this.updateMany({ _id: { $in: modelIds } }, { $set: { isEnabled } });
  };

  // 保存前的钩子
  AIModelSchema.pre('save', function (next) {
    // 确保 updatedAt 更新
    this.updatedAt = new Date();
    next();
  });

  // 删除前的钩子（软删除）
  AIModelSchema.pre('remove', function (next) {
    // 可以在这里添加删除前的清理逻辑
    next();
  });

  return mongoose.model('AIModel', AIModelSchema);
};
