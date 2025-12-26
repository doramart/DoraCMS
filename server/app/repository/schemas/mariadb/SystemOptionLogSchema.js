/*
 * @Author: AI Assistant
 * @Date: 2025-11-08
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2025-11-08
 * @Description: SystemOptionLog MariaDB Schema - 统一日志系统
 * 版本: v2.0 - 企业级统一日志系统，与MongoDB Schema完全一致
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * SystemOptionLog Schema for MariaDB
 * 统一日志系统表结构定义 - 与 MongoDB Schema 保持完全一致
 * @param sequelize
 * @param app
 */
const SystemOptionLogSchema = (sequelize, app) => {
  const SystemOptionLog = sequelize.define(
    'SystemOptionLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // ==================== 核心字段 ====================
      type: {
        type: DataTypes.ENUM(
          'login',
          'logout',
          'exception',
          'operation',
          'access',
          'error',
          'warning',
          'info',
          'debug'
        ),
        allowNull: false,
        defaultValue: 'operation',
        comment: '日志类型',
        validate: {
          isIn: [['login', 'logout', 'exception', 'operation', 'access', 'error', 'warning', 'info', 'debug']],
        },
      },

      logs: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '日志内容描述（主要内容）',
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '创建时间',
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '更新时间',
        defaultValue: DataTypes.NOW,
      },

      // ==================== 请求相关字段 ====================
      request_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '请求路径',
      },

      request_method: {
        type: DataTypes.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'),
        allowNull: true,
        comment: '请求方法',
      },

      request_params: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '请求参数（敏感信息已脱敏）',
      },

      request_body: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '请求体（敏感信息已脱敏）',
      },

      request_query: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '查询字符串',
      },

      // ==================== 用户相关字段 ====================
      user_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '用户ID',
      },

      user_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '用户名',
      },

      user_type: {
        type: DataTypes.ENUM('admin', 'user', 'guest', 'system'),
        allowNull: true,
        defaultValue: 'guest',
        comment: '用户类型',
      },

      session_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '会话ID',
      },

      // ==================== 客户端相关字段 ====================
      ip_address: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'IP地址',
      },

      user_agent: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: '用户代理（浏览器信息）',
      },

      client_platform: {
        type: DataTypes.ENUM('web', 'mobile', 'desktop', 'api'),
        allowNull: true,
        comment: '客户端平台',
      },

      client_version: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '客户端版本',
      },

      // ==================== 响应相关字段 ====================
      response_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'HTTP状态码',
        validate: {
          min: 100,
          max: 599,
        },
      },

      response_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '响应时间（毫秒）',
        validate: {
          min: 0,
        },
      },

      response_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '响应大小（字节）',
        validate: {
          min: 0,
        },
      },

      // ==================== 业务相关字段 ====================
      module: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '业务模块',
      },

      action: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '业务动作',
      },

      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '资源类型',
      },

      resource_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '资源ID',
      },

      old_value: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '修改前的值（仅update操作）',
      },

      new_value: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '修改后的值（仅update操作）',
      },

      // ==================== 错误相关字段 ====================
      error_message: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: '错误消息',
      },

      error_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '错误代码',
      },

      error_stack: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误堆栈（仅开发环境）',
      },

      is_handled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '是否已处理',
      },

      // ==================== 元数据字段 ====================
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '标签数组（便于分类）',
      },

      severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: true,
        defaultValue: 'low',
        comment: '严重程度',
      },

      environment: {
        type: DataTypes.ENUM('local', 'development', 'staging', 'production'),
        allowNull: true,
        comment: '环境',
      },

      trace_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '链路追踪ID',
      },

      extra_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '额外数据',
      },
    },
    {
      timestamps: true, // 使用内置的时间戳
      tableName: 'system_option_logs',
      comment: 'SystemOptionLog表 - 统一日志系统',

      // ==================== 数据验证 ====================
      validate: {
        typeRequired() {
          if (!this.type || this.type.trim() === '') {
            throw new Error('日志类型不能为空');
          }
        },

        logsRequired() {
          if (!this.logs || this.logs.trim() === '') {
            throw new Error('日志内容不能为空');
          }
        },

        responseStatusValid() {
          if (this.response_status && (this.response_status < 100 || this.response_status > 599)) {
            throw new Error('HTTP状态码必须在100-599之间');
          }
        },
      },

      // ==================== 钩子函数 ====================
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
          // 确保默认值
          if (!instance.type) {
            instance.type = 'operation';
          }
          if (!instance.severity) {
            instance.severity = 'low';
          }
          if (!instance.user_type) {
            instance.user_type = 'guest';
          }
          if (instance.tags === undefined || instance.tags === null) {
            instance.tags = [];
          }
        },

        beforeValidate(instance) {
          // 确保日志类型有效
          if (!instance.type) {
            instance.type = 'operation';
          }
          // 确保严重程度有效
          if (!instance.severity) {
            instance.severity = 'low';
          }
        },
      },

      // ==================== 索引定义 ====================
      // 注意：索引已通过数据库迁移脚本创建，此处暂时注释掉以避免Sequelize sync冲突
      // 迁移脚本：database/migrations/20251108_upgrade_system_option_logs.sql
      // 索引包括：idx_type, idx_created_at, idx_user_id, idx_module, idx_severity,
      //         idx_ip_address, idx_is_handled_type, idx_type_created_at,
      //         idx_user_id_created_at, idx_module_created_at, idx_severity_created_at
      indexes: [
        // 索引已在数据库中存在，暂时禁用Sequelize自动创建
        // 如需重新启用，请确保数据库迁移已正确执行
        /*
        {
          name: 'idx_type',
          fields: ['type'],
        },
        {
          name: 'idx_created_at',
          fields: ['createdAt'],
        },
        {
          name: 'idx_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_module',
          fields: ['module'],
        },
        {
          name: 'idx_severity',
          fields: ['severity'],
        },
        {
          name: 'idx_ip_address',
          fields: ['ip_address'],
        },
        {
          name: 'idx_is_handled_type',
          fields: ['is_handled', 'type'],
        },
        // 复合索引
        {
          name: 'idx_type_created_at',
          fields: ['type', 'createdAt'],
        },
        {
          name: 'idx_user_id_created_at',
          fields: ['user_id', 'createdAt'],
        },
        {
          name: 'idx_module_created_at',
          fields: ['module', 'createdAt'],
        },
        {
          name: 'idx_severity_created_at',
          fields: ['severity', 'createdAt'],
        },
        */
      ],
    }
  );

  // ==================== 关联关系 ====================
  SystemOptionLog.associate = models => {
    // SystemOptionLog 通常没有关联关系，主要是独立的日志记录
    // 如需要关联用户表，可以添加：
    // SystemOptionLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    // SystemOptionLog.belongsTo(models.Admin, { foreignKey: 'user_id', as: 'admin' });
  };

  // ==================== 类方法（静态方法） ====================
  SystemOptionLog.findByType = function (type) {
    return this.findAll({
      where: { type },
      order: [['createdAt', 'DESC']],
    });
  };

  SystemOptionLog.findByUser = function (userId) {
    return this.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });
  };

  SystemOptionLog.findBySeverity = function (severity) {
    return this.findAll({
      where: { severity },
      order: [['createdAt', 'DESC']],
    });
  };

  SystemOptionLog.findUnhandledExceptions = function () {
    return this.findAll({
      where: {
        type: 'exception',
        is_handled: false,
      },
      order: [['createdAt', 'DESC']],
    });
  };

  SystemOptionLog.findByDateRange = function (startDate, endDate) {
    return this.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: startDate,
          [sequelize.Sequelize.Op.lte]: endDate,
        },
      },
      order: [['createdAt', 'DESC']],
    });
  };

  SystemOptionLog.findByModule = function (module) {
    return this.findAll({
      where: { module },
      order: [['createdAt', 'DESC']],
    });
  };

  // ==================== 实例方法 ====================
  SystemOptionLog.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // ==================== 时间格式化 ====================
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // ==================== 添加文本描述 ====================
    if (values.type) {
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
      values.typeText = typeTextMap[values.type] || '未知';
    }

    if (values.severity) {
      const severityTextMap = {
        low: '低',
        medium: '中',
        high: '高',
        critical: '严重',
      };
      values.severityText = severityTextMap[values.severity] || '未知';
    }

    if (values.user_type) {
      const userTypeTextMap = {
        admin: '管理员',
        user: '普通用户',
        guest: '访客',
        system: '系统',
      };
      values.userTypeText = userTypeTextMap[values.user_type] || '未知';
    }

    // ==================== 移除敏感字段（生产环境） ====================
    if (values.error_stack && process.env.NODE_ENV === 'production') {
      delete values.error_stack;
    }

    return values;
  };

  SystemOptionLog.prototype.getDisplayType = function () {
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
  };

  SystemOptionLog.prototype.getDisplaySeverity = function () {
    const severityTextMap = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    };
    return severityTextMap[this.severity] || '未知';
  };

  SystemOptionLog.prototype.isException = function () {
    return this.type === 'exception';
  };

  SystemOptionLog.prototype.isError = function () {
    return this.type === 'error';
  };

  SystemOptionLog.prototype.isLogin = function () {
    return this.type === 'login';
  };

  SystemOptionLog.prototype.isHighSeverity = function () {
    return ['high', 'critical'].includes(this.severity);
  };

  SystemOptionLog.prototype.markAsHandled = async function () {
    this.is_handled = true;
    return await this.save();
  };

  return SystemOptionLog;
};

module.exports = SystemOptionLogSchema;
