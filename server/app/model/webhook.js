/**
 * Webhook Model
 * Webhook 配置模型 - 用于存储用户配置的 Webhook 订阅
 */
'use strict';

const { Schema } = require('mongoose');
const moment = require('moment');
const shortid = require('shortid');

module.exports = app => {
  const mongoose = app.mongoose;

  const WebhookSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    // 用户ID - 创建该 Webhook 的用户
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    // Webhook 名称
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // 目标 URL
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(v) {
          // 验证 URL 格式（必须是 http 或 https）
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must start with http:// or https://',
      },
    },
    // 订阅的事件列表
    events: {
      type: [String],
      required: true,
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one event must be subscribed',
      },
    },
    // 签名密钥（用于 HMAC-SHA256 签名）
    secret: {
      type: String,
      required: true,
      select: false, // 默认查询不返回
    },
    // 是否启用
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // 自定义请求头
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    // 重试配置
    retryConfig: {
      maxRetries: {
        type: Number,
        default: 3,
        min: 0,
        max: 10,
      },
      retryDelay: {
        type: Number,
        default: 1000, // 毫秒
        min: 100,
        max: 60000,
      },
    },
    // 超时配置（毫秒）
    timeout: {
      type: Number,
      default: 10000,
      min: 1000,
      max: 60000,
    },
    // 统计信息
    stats: {
      totalDeliveries: {
        type: Number,
        default: 0,
      },
      successfulDeliveries: {
        type: Number,
        default: 0,
      },
      failedDeliveries: {
        type: Number,
        default: 0,
      },
      lastDeliveryAt: {
        type: Date,
      },
      lastSuccessAt: {
        type: Date,
      },
      lastFailureAt: {
        type: Date,
      },
    },
    // 描述
    description: {
      type: String,
      maxlength: 500,
    },
    // 状态（用于软删除）
    status: {
      type: String,
      enum: ['active', 'disabled', 'deleted'],
      default: 'active',
      index: true,
    },
    // 创建时间
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // 更新时间
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });

  // 复合索引
  WebhookSchema.index({ userId: 1, status: 1 });
  WebhookSchema.index({ userId: 1, active: 1 });
  WebhookSchema.index({ events: 1, active: 1 }); // 用于快速查找订阅特定事件的 Webhook

  // 虚拟字段配置
  WebhookSchema.set('toJSON', {
    getters: true,
    virtuals: true,
    transform(doc, ret) {
      // 移除敏感字段
      delete ret.secret;
      // 添加脱敏的 secret
      ret.secretMasked = '****' + (doc.secret ? doc.secret.slice(-4) : '****');
      return ret;
    },
  });

  WebhookSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  // 日期格式化 Getter
  WebhookSchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookSchema.path('updatedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookSchema.path('stats.lastDeliveryAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookSchema.path('stats.lastSuccessAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  WebhookSchema.path('stats.lastFailureAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  // 更新时间中间件
  WebhookSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  WebhookSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
  });

  return mongoose.model('Webhook', WebhookSchema, 'webhooks');
};
