/**
 * WebhookLog Model
 * Webhook 日志模型 - 记录每次 Webhook 发送的详细信息
 */
'use strict';

const { Schema } = require('mongoose');
const moment = require('moment');
const shortid = require('shortid');

module.exports = app => {
  const mongoose = app.mongoose;

  const WebhookLogSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    // Webhook ID
    webhookId: {
      type: String,
      ref: 'Webhook',
      required: true,
      index: true,
    },
    // 事件类型
    event: {
      type: String,
      required: true,
      index: true,
    },
    // 事件负载（原始数据）
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    // 请求信息
    request: {
      url: {
        type: String,
        required: true,
      },
      method: {
        type: String,
        default: 'POST',
      },
      headers: {
        type: Map,
        of: String,
      },
      body: {
        type: Schema.Types.Mixed,
      },
    },
    // 响应信息
    response: {
      statusCode: {
        type: Number,
      },
      statusMessage: {
        type: String,
      },
      headers: {
        type: Map,
        of: String,
      },
      body: {
        type: String,
        maxlength: 10000, // 限制响应体大小
      },
    },
    // 发送状态
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'retrying'],
      default: 'pending',
      index: true,
    },
    // 重试次数
    retryCount: {
      type: Number,
      default: 0,
    },
    // 错误信息
    error: {
      message: {
        type: String,
      },
      code: {
        type: String,
      },
      stack: {
        type: String,
        select: false, // 默认不返回堆栈信息
      },
    },
    // 响应时间（毫秒）
    duration: {
      type: Number,
    },
    // 下次重试时间
    nextRetryAt: {
      type: Date,
      index: true,
    },
    // 创建时间
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // 完成时间
    completedAt: {
      type: Date,
    },
  });

  // 复合索引
  WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });
  WebhookLogSchema.index({ webhookId: 1, status: 1 });
  WebhookLogSchema.index({ event: 1, createdAt: -1 });
  WebhookLogSchema.index({ status: 1, nextRetryAt: 1 }); // 用于查找需要重试的日志

  // TTL 索引 - 自动删除 90 天前的日志
  WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

  // 虚拟字段配置
  WebhookLogSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });

  WebhookLogSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  // 日期格式化 Getter
  WebhookLogSchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookLogSchema.path('completedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookLogSchema.path('nextRetryAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  // 虚拟字段：是否成功
  WebhookLogSchema.virtual('isSuccess').get(function () {
    return this.status === 'success';
  });

  // 虚拟字段：是否失败
  WebhookLogSchema.virtual('isFailed').get(function () {
    return this.status === 'failed';
  });

  // 虚拟字段：是否需要重试
  WebhookLogSchema.virtual('needsRetry').get(function () {
    return this.status === 'retrying' && this.nextRetryAt && new Date() >= this.nextRetryAt;
  });

  return mongoose.model('WebhookLog', WebhookLogSchema, 'webhook_logs');
};
