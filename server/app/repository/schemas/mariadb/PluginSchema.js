/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Plugin MariaDB Schema 定义 - 基于MongoDB模型设计
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * Plugin Schema for MariaDB
 * 插件表结构定义 - 基于 MongoDB 模型设计
 * @param sequelize
 * @param app
 */
const PluginSchema = (sequelize, app) => {
  const Plugin = sequelize.define(
    'Plugin',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 🔥 核心字段（与 MongoDB 模型一致）
      pluginId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '来自插件源id',
        unique: false, // 因为可能有重复安装的情况
      },

      alias: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '插件别名',
        unique: true,
      },

      pkgName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '包名',
        unique: true,
      },

      name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '插件名称',
      },

      enName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '插件英文名',
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '插件描述',
      },

      // 🔥 状态字段
      state: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否启用',
      },

      // 🔥 插件配置字段
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: '价格',
      },

      isadm: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '有后管',
        validate: {
          isIn: [['0', '1']],
        },
      },

      isindex: {
        type: DataTypes.STRING(10),
        defaultValue: '0',
        comment: '有前台',
        validate: {
          isIn: [['0', '1']],
        },
      },

      version: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '版本号',
      },

      operationInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '操作说明',
      },

      author: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '作者',
      },

      // 🔥 JSON字段 - 后台插件地址
      adminUrl: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '后台插件地址',
        get() {
          const value = this.getDataValue('adminUrl');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return null;
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('adminUrl', value);
        },
      },

      iconName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '主菜单图标名称',
      },

      // 🔥 JSON字段 - 后台API地址
      adminApi: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '后台API地址',
        get() {
          const value = this.getDataValue('adminApi');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return null;
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('adminApi', value);
        },
      },

      // 🔥 JSON字段 - 前台API地址
      fontApi: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '前台API地址',
        get() {
          const value = this.getDataValue('fontApi');
          if (!value) return null;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return null;
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('fontApi', value);
        },
      },

      // 🔥 认证配置
      authUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否鉴权用户',
      },

      initDataPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '初始化表路径',
      },

      // 🔥 JSON字段 - 钩子数组
      hooks: {
        type: DataTypes.JSON,
        defaultValue: '[]',
        comment: '钩子',
        get() {
          const value = this.getDataValue('hooks');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return [];
            }
          }
          return [];
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue('hooks', value);
          } else {
            this.setDataValue('hooks', []);
          }
        },
      },

      defaultConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '插入到 config.default.js 中的配置',
      },

      pluginsConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '插入到 plugins.js 中的配置',
      },

      // 🔥 插件类型
      type: {
        type: DataTypes.STRING(10),
        defaultValue: '2',
        comment: '插件类型: 1-内置, 2-扩展, 3-第三方',
        validate: {
          isIn: [['1', '2', '3']],
        },
      },

      // 🔥 关联字段 - 安装者（关联Admin表）
      // 安装者ID（软引用，不创建外键约束）
      installor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '安装者ID',
      },

      // 统一时间字段
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
      tableName: 'plugins',
      comment: '插件表',

      // 🔥 添加虚拟字段以保持与 MongoDB 风格的兼容性
      getterMethods: {
        // 虚拟状态文本字段
        stateText() {
          return this.state ? '启用' : '禁用';
        },

        // 虚拟类型文本字段
        typeText() {
          const typeMap = {
            1: '内置插件',
            2: '扩展插件',
            3: '第三方插件',
          };
          return typeMap[this.type] || '未知类型';
        },

        // 虚拟已安装标识
        installed() {
          return true; // 在数据库中的都是已安装的
        },
      },

      // 🔥 数据验证
      validate: {
        nameOrAliasRequired() {
          if (!this.name && !this.alias) {
            throw new Error('插件名称或别名至少需要一个');
          }
        },

        typeValid() {
          if (!['1', '2', '3'].includes(this.type)) {
            throw new Error('插件类型必须是 1（内置）、2（扩展）或 3（第三方）');
          }
        },

        amountValid() {
          if (this.amount < 0) {
            throw new Error('价格不能为负数');
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
          // 确保 JSON 字段的默认值
          if (!instance.hooks) {
            instance.hooks = [];
          }
        },
      },

      // 索引定义
      indexes: [
        {
          fields: ['state'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['pluginId'],
        },
        {
          unique: true,
          fields: ['alias'],
          where: {
            alias: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        {
          unique: true,
          fields: ['pkgName'],
          where: {
            pkgName: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
      ],
    }
  );

  // 定义关联关系
  Plugin.associate = models => {
    // 🔥 与Admin表的关联关系 - installor
    Plugin.belongsTo(models.Admin, {
      foreignKey: 'installor',
      as: 'installorInfo', // 修复命名冲突：使用不同的别名
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  // 🔥 类方法
  Plugin.findByState = function (state) {
    return this.findAll({ where: { state } });
  };

  Plugin.findByType = function (type) {
    return this.findAll({ where: { type } });
  };

  Plugin.findByPluginId = function (pluginId) {
    return this.findOne({ where: { pluginId } });
  };

  Plugin.findByAlias = function (alias) {
    return this.findOne({ where: { alias } });
  };

  Plugin.findByPkgName = function (pkgName) {
    return this.findOne({ where: { pkgName } });
  };

  Plugin.findEnabledPlugins = function () {
    return this.findAll({
      where: { state: true },
      order: [
        ['createdAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });
  };

  Plugin.checkAliasUnique = async function (alias, excludeId = null) {
    const where = { alias };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  Plugin.checkPkgNameUnique = async function (pkgName, excludeId = null) {
    const where = { pkgName };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  // 🔥 实例方法
  Plugin.prototype.toJSON = function () {
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

    // 🔥 添加状态文本描述
    values.stateText = values.state ? '启用' : '禁用';

    // 🔥 添加类型文本描述
    const typeMap = {
      1: '内置插件',
      2: '扩展插件',
      3: '第三方插件',
    };
    values.typeText = typeMap[values.type] || '未知类型';

    // 🔥 添加已安装标识
    values.installed = true;

    return values;
  };

  Plugin.prototype.getDisplayName = function () {
    return this.name || this.alias || `Plugin-${this.id}`;
  };

  Plugin.prototype.isEnabled = function () {
    return this.state === true;
  };

  Plugin.prototype.isDisabled = function () {
    return this.state === false;
  };

  Plugin.prototype.isBuiltinPlugin = function () {
    return this.type === '1';
  };

  Plugin.prototype.isExtensionPlugin = function () {
    return this.type === '2';
  };

  Plugin.prototype.isThirdPartyPlugin = function () {
    return this.type === '3';
  };

  return Plugin;
};

module.exports = PluginSchema;
