/**
 * ApiKey MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 ApiKey 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const ApiKey = sequelize.define(
    'ApiKey',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '用户ID (User.id)',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'API Key 名称',
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'API Key',
      },
      secret: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'API Secret',
      },
      permissions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        comment: '权限数组(JSON)',
        get() {
          const value = this.getDataValue('permissions');
          try {
            return value ? JSON.parse(value) : [];
          } catch {
            return [];
          }
        },

        set(value) {
          this.setDataValue('permissions', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },
      ipWhitelist: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        comment: 'IP白名单(JSON)',
        get() {
          const value = this.getDataValue('ipWhitelist');
          try {
            return value ? JSON.parse(value) : [];
          } catch {
            return [];
          }
        },

        set(value) {
          this.setDataValue('ipWhitelist', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },
      rateLimit: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
        comment: '限流配置(JSON)',
        get() {
          const value = this.getDataValue('rateLimit');
          try {
            return value ? JSON.parse(value) : {};
          } catch {
            return {};
          }
        },

        set(value) {
          this.setDataValue('rateLimit', value ? JSON.stringify(value) : '{}');
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
        comment: '状态',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '过期时间',
        get() {
          const v = this.getDataValue('expiresAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后使用时间',
        get() {
          const v = this.getDataValue('lastUsedAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
        get() {
          const v = this.getDataValue('createdAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
        get() {
          const v = this.getDataValue('updatedAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      tableName: 'api_keys',
      timestamps: false,
    }
  );

  ApiKey.associate = function (models) {
    // 🔥 优化关联关系定义 - 基于Admin模块成功经验
    ApiKey.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: false,
      // 确保关联查询时的字段选择
      scope: {
        enable: true, // 只关联启用的用户
      },
    });
  };

  // 🔥 类方法（基于Menu模块经验）
  ApiKey.findByStatus = function (status) {
    return this.findAll({ where: { status } });
  };

  ApiKey.findByUserId = function (userId) {
    return this.findAll({
      where: { userId },
      order: [
        ['createdAt', 'DESC'],
        ['lastUsedAt', 'DESC'],
      ],
    });
  };

  ApiKey.findActiveKeys = function (userId = null) {
    const where = { status: 'active' };
    if (userId) {
      where.userId = userId;
    }
    return this.findAll({
      where,
      order: [['lastUsedAt', 'DESC']],
    });
  };

  ApiKey.findByKey = function (key) {
    return this.findOne({ where: { key } });
  };

  ApiKey.checkKeyUnique = async function (key, excludeId = null) {
    const where = { key };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  ApiKey.checkNameUniqueForUser = async function (name, userId, excludeId = null) {
    const where = { name, userId };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  // 🔥 实例方法（基于Menu模块成功实践）
  ApiKey.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 🔥 添加状态文本描述
    values.statusText = values.status === 'active' ? '激活' : '禁用';

    // 🔥 添加过期状态
    if (values.expiresAt) {
      values.isExpired = new Date(values.expiresAt) < new Date();
    }

    // 🔥 添加安全信息（隐藏完整secret）
    // 注意：不在这里删除 secret，而是在 Repository 层的 _customProcessDataItem 中根据 includeSecret 选项控制
    if (values.secret) {
      values.secretMasked = values.secret.substring(0, 8) + '****';
      // delete values.secret; // 移除：让 Repository 层控制是否返回 secret
    }

    // 🔥 确保JSON字段的正确格式
    if (typeof values.permissions === 'string') {
      try {
        values.permissions = JSON.parse(values.permissions);
      } catch (e) {
        values.permissions = [];
      }
    }

    if (typeof values.ipWhitelist === 'string') {
      try {
        values.ipWhitelist = JSON.parse(values.ipWhitelist);
      } catch (e) {
        values.ipWhitelist = [];
      }
    }

    if (typeof values.rateLimit === 'string') {
      try {
        values.rateLimit = JSON.parse(values.rateLimit);
      } catch (e) {
        values.rateLimit = { requests: 100, period: 3600 };
      }
    }

    return values;
  };

  ApiKey.prototype.getDisplayName = function () {
    return this.name || `ApiKey-${this.id}`;
  };

  ApiKey.prototype.isActive = function () {
    return this.status === 'active';
  };

  ApiKey.prototype.isDisabled = function () {
    return this.status === 'disabled';
  };

  ApiKey.prototype.isExpired = function () {
    return this.expiresAt && new Date(this.expiresAt) < new Date();
  };

  ApiKey.prototype.canAccess = function (url, method) {
    if (!this.permissions || this.permissions.length === 0) {
      return true; // 无权限配置表示允许所有请求
    }

    return this.permissions.some(permission => {
      return (
        permission.url === url &&
        permission.method.toLowerCase() === method.toLowerCase() &&
        permission.enabled !== false
      );
    });
  };

  ApiKey.prototype.isIpAllowed = function (clientIp) {
    if (!this.ipWhitelist || this.ipWhitelist.length === 0) {
      return true; // 无IP白名单表示允许所有IP
    }

    return this.ipWhitelist.includes(clientIp);
  };

  return ApiKey;
};
