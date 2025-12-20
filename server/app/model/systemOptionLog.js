/**
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Last Modified by: doramart
 * @Last Modified time: 2025-11-15 13:09:36
 * @Description: SystemOptionLog Model - 统一日志系统 MongoDB Schema
 * 版本: v2.0 - 企业级统一日志系统
 */
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const SystemOptionLogSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },

    // ==================== 核心字段 ====================
    type: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'exception', 'operation', 'access', 'error', 'warning', 'info', 'debug'],
      default: 'operation',
      index: true,
      comment: '日志类型',
    },

    logs: {
      type: String,
      required: true,
      maxlength: 65535,
      comment: '日志内容描述（主要内容）',
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      comment: '创建时间',
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      comment: '更新时间',
    },

    // ==================== 请求相关字段 ====================
    request_path: {
      type: String,
      maxlength: 500,
      comment: '请求路径',
    },

    request_method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      comment: '请求方法',
    },

    request_params: {
      type: Schema.Types.Mixed,
      comment: '请求参数（敏感信息已脱敏）',
    },

    request_body: {
      type: Schema.Types.Mixed,
      comment: '请求体（敏感信息已脱敏）',
    },

    request_query: {
      type: Schema.Types.Mixed,
      comment: '查询字符串',
    },

    // ==================== 用户相关字段 ====================
    user_id: {
      type: String,
      index: true,
      comment: '用户ID',
    },

    user_name: {
      type: String,
      maxlength: 100,
      comment: '用户名',
    },

    user_type: {
      type: String,
      enum: ['admin', 'user', 'guest', 'system'],
      default: 'guest',
      comment: '用户类型',
    },

    session_id: {
      type: String,
      maxlength: 100,
      comment: '会话ID',
    },

    // ==================== 客户端相关字段 ====================
    ip_address: {
      type: String,
      maxlength: 50,
      index: true,
      comment: 'IP地址',
    },

    user_agent: {
      type: String,
      maxlength: 1000,
      comment: '用户代理（浏览器信息）',
    },

    client_platform: {
      type: String,
      enum: ['web', 'mobile', 'desktop', 'api'],
      comment: '客户端平台',
    },

    client_version: {
      type: String,
      maxlength: 50,
      comment: '客户端版本',
    },

    // ==================== 响应相关字段 ====================
    response_status: {
      type: Number,
      min: 100,
      max: 599,
      comment: 'HTTP状态码',
    },

    response_time: {
      type: Number,
      min: 0,
      comment: '响应时间（毫秒）',
    },

    response_size: {
      type: Number,
      min: 0,
      comment: '响应大小（字节）',
    },

    // ==================== 业务相关字段 ====================
    module: {
      type: String,
      maxlength: 50,
      index: true,
      comment: '业务模块',
    },

    action: {
      type: String,
      maxlength: 50,
      comment: '业务动作',
    },

    resource_type: {
      type: String,
      maxlength: 50,
      comment: '资源类型',
    },

    resource_id: {
      type: String,
      comment: '资源ID',
    },

    old_value: {
      type: Schema.Types.Mixed,
      comment: '修改前的值（仅update操作）',
    },

    new_value: {
      type: Schema.Types.Mixed,
      comment: '修改后的值（仅update操作）',
    },

    // ==================== 错误相关字段 ====================
    error_message: {
      type: String,
      maxlength: 1000,
      comment: '错误消息',
    },

    error_code: {
      type: String,
      maxlength: 100,
      comment: '错误代码',
    },

    error_stack: {
      type: String,
      comment: '错误堆栈（仅开发环境）',
    },

    is_handled: {
      type: Boolean,
      default: false,
      comment: '是否已处理',
    },

    // ==================== 元数据字段 ====================
    tags: {
      type: [String],
      default: [],
      comment: '标签（便于分类）',
    },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
      comment: '严重程度',
    },

    environment: {
      type: String,
      enum: ['development', 'staging', 'production', 'local'],
      comment: '环境',
    },

    trace_id: {
      type: String,
      maxlength: 100,
      comment: '链路追踪ID',
    },

    extra_data: {
      type: Schema.Types.Mixed,
      comment: '额外数据',
    },
  });

  // ==================== 索引定义 ====================
  SystemOptionLogSchema.index({ type: 1, createdAt: -1 });
  SystemOptionLogSchema.index({ user_id: 1, createdAt: -1 });
  SystemOptionLogSchema.index({ module: 1, createdAt: -1 });
  SystemOptionLogSchema.index({ severity: 1, createdAt: -1 });
  SystemOptionLogSchema.index({ ip_address: 1, createdAt: -1 });
  SystemOptionLogSchema.index({ is_handled: 1, type: 1 });

  // ==================== 静态方法 ====================
  SystemOptionLogSchema.statics = {
    /**
     * 根据类型查找日志
     * @param {String} type 日志类型
     * @return {Query} MongoDB查询
     */
    findByType(type) {
      return this.find({ type }).sort({ createdAt: -1 });
    },

    /**
     * 根据用户ID查找日志
     * @param {String} userId 用户ID
     * @return {Query} MongoDB查询
     */
    findByUser(userId) {
      return this.find({ user_id: userId }).sort({ createdAt: -1 });
    },

    /**
     * 根据严重程度查找日志
     * @param {String} severity 严重程度
     * @return {Query} MongoDB查询
     */
    findBySeverity(severity) {
      return this.find({ severity }).sort({ createdAt: -1 });
    },

    /**
     * 查找未处理的异常
     * @return {Query} MongoDB查询
     */
    findUnhandledExceptions() {
      return this.find({ type: 'exception', is_handled: false }).sort({ createdAt: -1 });
    },

    /**
     * 根据日期范围查找日志
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Query} MongoDB查询
     */
    findByDateRange(startDate, endDate) {
      return this.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }).sort({ createdAt: -1 });
    },
  };

  // ==================== 实例方法 ====================
  SystemOptionLogSchema.methods = {
    /**
     * 判断是否为异常日志
     * @return {Boolean}
     */
    isException() {
      return this.type === 'exception';
    },

    /**
     * 判断是否为错误日志
     * @return {Boolean}
     */
    isError() {
      return this.type === 'error';
    },

    /**
     * 判断是否为高严重程度
     * @return {Boolean}
     */
    isHighSeverity() {
      return ['high', 'critical'].includes(this.severity);
    },

    /**
     * 标记为已处理
     * @return {Promise<Object>}
     */
    async markAsHandled() {
      this.is_handled = true;
      return await this.save();
    },
  };

  // ==================== JSON序列化配置 ====================
  SystemOptionLogSchema.set('toJSON', {
    getters: true,
    virtuals: true,
    transform(doc, ret) {
      // 移除敏感字段
      if (ret.error_stack && process.env.NODE_ENV === 'production') {
        delete ret.error_stack;
      }
      return ret;
    },
  });

  SystemOptionLogSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  // ==================== 时间格式化 ====================
  SystemOptionLogSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  SystemOptionLogSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  // ==================== 虚拟字段 ====================
  SystemOptionLogSchema.virtual('typeText').get(function () {
    const typeTextMap = {
      login: '登录',
      logout: '登出',
      exception: '异常',
      operation: '操作',
      access: '访问',
      error: '错误',
      warning: '警告',
      info: '信息',
      debug: '调试',
    };
    return typeTextMap[this.type] || '未知';
  });

  SystemOptionLogSchema.virtual('severityText').get(function () {
    const severityTextMap = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    };
    return severityTextMap[this.severity] || '未知';
  });

  // ==================== 钩子函数 ====================
  SystemOptionLogSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  return mongoose.model('SystemOptionLog', SystemOptionLogSchema, 'system_option_logs');
};
