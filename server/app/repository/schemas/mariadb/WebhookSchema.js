/**
 * Webhook MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 Webhook 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const Webhook = sequelize.define(
    'Webhook',
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
        comment: 'Webhook 名称',
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '目标 URL',
      },
      events: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '订阅的事件列表(JSON)',
        get() {
          const value = this.getDataValue('events');
          try {
            return value ? JSON.parse(value) : [];
          } catch {
            return [];
          }
        },
        set(value) {
          this.setDataValue('events', Array.isArray(value) ? JSON.stringify(value) : '[]');
        },
      },
      secret: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '签名密钥',
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用',
      },
      headers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '自定义请求头(JSON)',
        get() {
          const value = this.getDataValue('headers');
          try {
            return value ? JSON.parse(value) : {};
          } catch {
            return {};
          }
        },
        set(value) {
          this.setDataValue('headers', value ? JSON.stringify(value) : '{}');
        },
      },
      retryConfig: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{"maxRetries":3,"retryDelay":1000}',
        comment: '重试配置(JSON)',
        get() {
          const value = this.getDataValue('retryConfig');
          try {
            return value ? JSON.parse(value) : { maxRetries: 3, retryDelay: 1000 };
          } catch {
            return { maxRetries: 3, retryDelay: 1000 };
          }
        },
        set(value) {
          this.setDataValue('retryConfig', value ? JSON.stringify(value) : '{"maxRetries":3,"retryDelay":1000}');
        },
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10000,
        comment: '超时时间(毫秒)',
      },
      stats: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{"totalDeliveries":0,"successfulDeliveries":0,"failedDeliveries":0}',
        comment: '统计信息(JSON)',
        get() {
          const value = this.getDataValue('stats');
          try {
            return value
              ? JSON.parse(value)
              : {
                  totalDeliveries: 0,
                  successfulDeliveries: 0,
                  failedDeliveries: 0,
                };
          } catch {
            return {
              totalDeliveries: 0,
              successfulDeliveries: 0,
              failedDeliveries: 0,
            };
          }
        },
        set(value) {
          this.setDataValue(
            'stats',
            value ? JSON.stringify(value) : '{"totalDeliveries":0,"successfulDeliveries":0,"failedDeliveries":0}'
          );
        },
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '描述',
      },
      status: {
        type: DataTypes.ENUM('active', 'disabled', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        comment: '状态',
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
      tableName: 'webhooks',
      timestamps: false,
      indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'status'] },
        { fields: ['userId', 'active'] },
        { fields: ['active', 'status'] },
      ],
    }
  );

  Webhook.associate = function (models) {
    Webhook.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: false,
    });
  };

  // 类方法
  Webhook.findByUserId = function (userId) {
    return this.findAll({
      where: { userId, status: { [sequelize.Sequelize.Op.ne]: 'deleted' } },
      order: [['createdAt', 'DESC']],
    });
  };

  Webhook.findActiveByEvent = function (event) {
    return this.findAll({
      where: {
        active: true,
        status: 'active',
        events: {
          [sequelize.Sequelize.Op.like]: `%"${event}"%`,
        },
      },
    });
  };

  Webhook.checkNameUniqueForUser = async function (name, userId, excludeId = null) {
    const where = { name, userId };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  // 实例方法
  Webhook.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加状态文本
    const statusMap = {
      active: '启用',
      disabled: '禁用',
      deleted: '已删除',
    };
    values.statusText = statusMap[values.status] || values.status;

    // 添加成功率
    if (values.stats && values.stats.totalDeliveries > 0) {
      values.stats.successRate = ((values.stats.successfulDeliveries / values.stats.totalDeliveries) * 100).toFixed(2);
    } else if (values.stats) {
      values.stats.successRate = '0.00';
    }

    // 处理 secret（脱敏）
    if (values.secret) {
      values.secretMasked = '****' + values.secret.slice(-4);
      // Repository 层会根据 includeSecret 选项控制是否返回完整 secret
    }

    // 确保 JSON 字段的正确格式
    if (typeof values.events === 'string') {
      try {
        values.events = JSON.parse(values.events);
      } catch (e) {
        values.events = [];
      }
    }

    if (typeof values.headers === 'string') {
      try {
        values.headers = JSON.parse(values.headers);
      } catch (e) {
        values.headers = {};
      }
    }

    if (typeof values.retryConfig === 'string') {
      try {
        values.retryConfig = JSON.parse(values.retryConfig);
      } catch (e) {
        values.retryConfig = { maxRetries: 3, retryDelay: 1000 };
      }
    }

    if (typeof values.stats === 'string') {
      try {
        values.stats = JSON.parse(values.stats);
      } catch (e) {
        values.stats = {
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
        };
      }
    }

    return values;
  };

  Webhook.prototype.isActive = function () {
    return this.active && this.status === 'active';
  };

  Webhook.prototype.isDisabled = function () {
    return !this.active || this.status === 'disabled';
  };

  Webhook.prototype.isDeleted = function () {
    return this.status === 'deleted';
  };

  Webhook.prototype.subscribesTo = function (event) {
    return this.events && this.events.includes(event);
  };

  return Webhook;
};
