/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: SystemConfig MariaDB Schema 定义 - 基于MongoDB模型设计
 */

'use strict';

const { DataTypes } = require('sequelize');
const CryptoJS = require('crypto-js');

/**
 * SystemConfig Schema for MariaDB
 * 系统配置表结构定义 - 基于 MongoDB 模型设计
 * 支持键值对配置管理、类型转换、公开配置等功能
 * @param sequelize
 * @param app
 */
const SystemConfigSchema = (sequelize, app) => {
  const SystemConfig = sequelize.define(
    'SystemConfig',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 🔑 核心字段 - 配置键值对
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '配置键，全局唯一',
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '配置值，支持多种类型存储',
        // 🔥 重要：value字段支持JSON存储，通过get/set方法处理类型转换
        get() {
          const rawValue = this.getDataValue('value');
          const type = this.getDataValue('type');

          if (rawValue === null || rawValue === undefined) {
            return rawValue;
          }

          // 根据类型进行转换
          switch (type) {
            case 'boolean':
              return rawValue === 'true' || rawValue === true;
            case 'number':
              return Number(rawValue);
            case 'password':
              // 密码类型不在此处解密，保持加密状态
              return rawValue;
            case 'string':
            default:
              return rawValue;
          }
        },
        set(value) {
          const type = this.getDataValue('type');

          // 根据类型进行预处理
          switch (type) {
            case 'boolean':
              this.setDataValue('value', value === true || value === 'true' ? 'true' : 'false');
              break;
            case 'number':
              this.setDataValue('value', String(value));
              break;
            case 'password':
              // 🔥 密码加密处理
              if (app && app.config && app.config.encrypt_key) {
                const encrypted = CryptoJS.AES.encrypt(String(value), app.config.encrypt_key).toString();
                this.setDataValue('value', encrypted);
              } else {
                this.setDataValue('value', String(value));
              }
              break;
            case 'string':
            default:
              this.setDataValue('value', String(value));
              break;
          }
        },
      },

      type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'password'),
        allowNull: false,
        defaultValue: 'string',
        comment: '配置类型：string、number、boolean、password',
        validate: {
          isIn: [['string', 'number', 'boolean', 'password']],
        },
      },

      public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否为公开配置，公开配置可被前端直接访问',
      },

      // 时间字段
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '创建时间',
        defaultValue: DataTypes.NOW,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '更新时间',
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'system_configs',
      comment: '系统配置表',

      // 🔥 数据验证
      validate: {
        keyRequired() {
          if (!this.key || this.key.trim() === '') {
            throw new Error('配置键不能为空');
          }
        },

        typeValid() {
          if (!['string', 'number', 'boolean', 'password'].includes(this.type)) {
            throw new Error('配置类型必须是 string、number、boolean 或 password');
          }
        },

        valueValidForType() {
          if (this.type === 'number' && this.value !== null && this.value !== undefined) {
            const numValue = Number(this.getDataValue('value'));
            if (isNaN(numValue)) {
              throw new Error('number类型的配置值必须是有效数字');
            }
          }
        },
      },

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
        },

        // 🔥 数据验证钩子
        beforeValidate(instance) {
          // 确保key的唯一性和格式
          if (instance.key) {
            instance.key = instance.key.trim();
          }
        },
      },

      // 索引定义
      indexes: [
        {
          unique: true,
          fields: ['key'],
          name: 'unique_config_key',
        },
        {
          fields: ['type'],
          name: 'idx_config_type',
        },
        {
          fields: ['public'],
          name: 'idx_config_public',
        },
        {
          fields: ['createdAt'],
          name: 'idx_config_created_at',
        },
        {
          fields: ['updatedAt'],
          name: 'idx_config_updated_at',
        },
      ],
    }
  );

  // 🔥 类方法（基于MongoDB模型的业务方法）
  SystemConfig.findByKey = function (key) {
    return this.findOne({ where: { key } });
  };

  SystemConfig.findByKeys = function (keys) {
    return this.findAll({
      where: { key: { [sequelize.Sequelize.Op.in]: keys } },
    });
  };

  SystemConfig.findPublicConfigs = function () {
    return this.findAll({
      where: { public: true },
      order: [['key', 'ASC']],
    });
  };

  SystemConfig.checkKeyExists = async function (key, excludeId = null) {
    const where = { key };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  };

  SystemConfig.findByType = function (type) {
    return this.findAll({
      where: { type },
      order: [['key', 'ASC']],
    });
  };

  // 🔥 实例方法
  SystemConfig.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加类型文本描述
    const typeTexts = {
      string: '字符串',
      number: '数字',
      boolean: '布尔值',
      password: '密码',
    };
    values.typeText = typeTexts[values.type] || values.type;

    // 🔥 添加公开状态文本
    values.publicText = values.public ? '公开' : '私有';

    // 🔥 密码类型的值隐藏处理
    if (values.type === 'password') {
      values.displayValue = '********';
    } else {
      values.displayValue = values.value;
    }

    return values;
  };

  SystemConfig.prototype.isPublic = function () {
    return this.public === true;
  };

  SystemConfig.prototype.isPassword = function () {
    return this.type === 'password';
  };

  SystemConfig.prototype.getTypedValue = function () {
    // 通过getter自动处理类型转换
    return this.value;
  };

  // 🔥 密码解密方法（仅在必要时使用）
  SystemConfig.prototype.getDecryptedValue = function () {
    if (this.type !== 'password') {
      return this.getDataValue('value');
    }

    try {
      const app = require('../../../../app');
      if (app && app.config && app.config.encrypt_key) {
        const bytes = CryptoJS.AES.decrypt(this.getDataValue('value'), app.config.encrypt_key);
        return bytes.toString(CryptoJS.enc.Utf8);
      }
    } catch (error) {
      console.warn('Failed to decrypt password value:', error.message);
    }

    return this.getDataValue('value');
  };

  return SystemConfig;
};

module.exports = SystemConfigSchema;
