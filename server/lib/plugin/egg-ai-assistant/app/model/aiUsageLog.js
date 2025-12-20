/**
 * AI Usage Log MongoDB Schema
 * AI使用日志表
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const shortid = require('shortid');

  const AIUsageLogSchema = new Schema(
    {
      _id: {
        type: String,
        default: shortid.generate,
      },

      // 用户信息
      userId: {
        type: String,
        required: true,
        index: true,
        comment: '用户ID',
      },
      userType: {
        type: String,
        enum: ['admin', 'user'],
        default: 'admin',
        comment: '用户类型',
      },

      // 任务信息
      taskType: {
        type: String,
        required: true,
        index: true,
        comment: '任务类型：title_generation, tag_extraction等',
      },
      taskDescription: {
        type: String,
        comment: '任务描述',
      },

      // 模型信息
      modelId: {
        type: String,
        ref: 'AIModel',
        required: true,
        index: true,
        comment: '使用的模型ID',
      },
      provider: {
        type: String,
        comment: 'AI提供商',
      },
      modelName: {
        type: String,
        comment: '模型名称',
      },

      // 提示词信息
      promptTemplateId: {
        type: String,
        ref: 'PromptTemplate',
        comment: '使用的提示词模板ID',
      },
      promptVersion: {
        type: String,
        comment: '提示词版本',
      },

      // 输入输出
      input: {
        type: Schema.Types.Mixed,
        required: true,
        comment: '输入内容（可能很大，考虑限制大小或单独存储）',
      },
      output: {
        type: Schema.Types.Mixed,
        comment: '输出内容',
      },
      rawResponse: {
        type: Schema.Types.Mixed,
        comment: 'AI原始响应（用于调试）',
      },

      // 执行信息
      status: {
        type: String,
        enum: ['success', 'failure', 'partial', 'timeout'],
        default: 'success',
        index: true,
        comment: '执行状态',
      },
      errorMessage: {
        type: String,
        comment: '错误信息（如果失败）',
      },
      errorCode: {
        type: String,
        comment: '错误代码',
      },

      // Token和成本
      inputTokens: {
        type: Number,
        default: 0,
        comment: '输入Token数量',
      },
      outputTokens: {
        type: Number,
        default: 0,
        comment: '输出Token数量',
      },
      totalTokens: {
        type: Number,
        default: 0,
        comment: '总Token数量',
      },
      cost: {
        type: Number,
        default: 0,
        comment: '本次调用成本（元）',
      },

      // 性能指标
      responseTime: {
        type: Number,
        default: 0,
        comment: '响应时间（毫秒）',
      },
      retryCount: {
        type: Number,
        default: 0,
        comment: '重试次数',
      },
      isFallback: {
        type: Boolean,
        default: false,
        comment: '是否使用了降级模型',
      },

      // 质量评估
      quality: {
        userRating: { type: Number, min: 0, max: 10, comment: '用户评分(0-10)' },
        isAdopted: { type: Boolean, comment: '是否被用户采纳' },
        feedback: { type: String, comment: '用户反馈' },
        autoScore: { type: Number, comment: '自动评分' },
      },

      // 请求上下文
      context: {
        ip: { type: String, comment: '请求IP' },
        userAgent: { type: String, comment: '用户代理' },
        referer: { type: String, comment: '来源页面' },
        sessionId: { type: String, comment: '会话ID' },
        requestId: { type: String, comment: '请求ID' },
      },

      // 业务关联
      relatedContentId: {
        type: String,
        comment: '关联的内容ID（如文章ID）',
      },
      relatedType: {
        type: String,
        comment: '关联类型（如 article, product）',
      },

      // 标签
      tags: {
        type: [{ type: String }],
        default: [],
        comment: '标签',
      },

      // 元数据
      metadata: {
        type: Schema.Types.Mixed,
        comment: '扩展元数据',
      },

      // 时间信息
      startTime: {
        type: Date,
        comment: '开始时间',
      },
      endTime: {
        type: Date,
        comment: '结束时间',
      },
    },
    {
      timestamps: true,
      collection: 'ai_usage_logs',
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // 索引
  AIUsageLogSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_user_time' });
  AIUsageLogSchema.index({ modelId: 1, createdAt: -1 }, { name: 'idx_model_time' });
  AIUsageLogSchema.index({ taskType: 1, createdAt: -1 }, { name: 'idx_task_time' });
  AIUsageLogSchema.index({ status: 1 }, { name: 'idx_status' });
  AIUsageLogSchema.index({ createdAt: -1 }, { name: 'idx_created_at' });
  AIUsageLogSchema.index({ 'context.sessionId': 1 }, { name: 'idx_session' });
  AIUsageLogSchema.index({ relatedContentId: 1, relatedType: 1 }, { name: 'idx_related' });

  // 复合索引用于统计查询
  AIUsageLogSchema.index({ userId: 1, taskType: 1, createdAt: -1 }, { name: 'idx_user_task_time' });

  // 虚拟字段
  AIUsageLogSchema.virtual('id').get(function () {
    return this._id;
  });

  // 虚拟字段：是否成功
  AIUsageLogSchema.virtual('isSuccess').get(function () {
    return this.status === 'success';
  });

  // 虚拟字段：Token使用效率
  AIUsageLogSchema.virtual('tokenEfficiency').get(function () {
    if (this.responseTime === 0) return 0;
    return this.totalTokens / (this.responseTime / 1000); // tokens per second
  });

  // 实例方法：计算成本
  AIUsageLogSchema.methods.calculateCost = function (costPer1kTokens) {
    this.cost = (this.totalTokens / 1000) * costPer1kTokens;
    return this.cost;
  };

  // 实例方法：标记为成功
  AIUsageLogSchema.methods.markAsSuccess = async function (output) {
    this.status = 'success';
    this.output = output;
    this.endTime = new Date();
    this.responseTime = this.endTime - this.startTime;
    return await this.save();
  };

  // 实例方法：标记为失败
  AIUsageLogSchema.methods.markAsFailure = async function (error) {
    this.status = 'failure';
    this.errorMessage = error.message || String(error);
    this.errorCode = error.code;
    this.endTime = new Date();
    this.responseTime = this.endTime - this.startTime;
    return await this.save();
  };

  // 静态方法：统计用户使用情况
  AIUsageLogSchema.statics.getUserStats = async function (userId, startDate, endDate) {
    const match = { userId };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const stats = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          successCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          averageResponseTime: { $avg: '$responseTime' },
        },
      },
    ]);

    return (
      stats[0] || {
        totalCalls: 0,
        successCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
      }
    );
  };

  // 静态方法：按时间范围统计
  AIUsageLogSchema.statics.getUsageByTimeRange = async function (startDate, endDate, groupBy = 'day') {
    const groupFormat = {
      hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
    };

    return await this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: groupFormat[groupBy],
          count: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$cost' },
          averageResponseTime: { $avg: '$responseTime' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  };

  // 静态方法：清理过期日志
  AIUsageLogSchema.statics.cleanupOldLogs = async function (days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return { deletedCount: result.deletedCount };
  };

  // 保存前的钩子
  AIUsageLogSchema.pre('save', function (next) {
    // 确保 totalTokens 正确计算
    if (this.inputTokens && this.outputTokens) {
      this.totalTokens = this.inputTokens + this.outputTokens;
    }
    next();
  });

  return mongoose.model('AIUsageLog', AIUsageLogSchema);
};
