/**
 * WebhookLog MariaDB/Sequelize 模型定义
 * 对应 MongoDB 的 WebhookLog 结构
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, _app) => {
  const WebhookLog = sequelize.define(
    'WebhookLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      webhookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Webhook ID (Webhook.id)',
      },
      event: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '事件类型',
      },
      payload: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: '事件负载(JSON)',
        get() {
          const value = this.getDataValue('payload');
          try {
            return value ? JSON.parse(value) : {};
          } catch {
            return {};
          }
        },
        set(value) {
          this.setDataValue('payload', value ? JSON.stringify(value) : '{}');
        },
      },
      request: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '请求信息(JSON)',
        get() {
          const value = this.getDataValue('request');
          try {
            return value ? JSON.parse(value) : {};
          } catch {
            return {};
          }
        },
        set(value) {
          this.setDataValue('request', value ? JSON.stringify(value) : '{}');
        },
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '响应信息(JSON)',
        get() {
          const value = this.getDataValue('response');
          try {
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        set(value) {
          this.setDataValue('response', value ? JSON.stringify(value) : null);
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'success', 'failed', 'retrying'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '发送状态',
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '重试次数',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息(JSON)',
        get() {
          const value = this.getDataValue('error');
          try {
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        set(value) {
          this.setDataValue('error', value ? JSON.stringify(value) : null);
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '响应时间(毫秒)',
      },
      nextRetryAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '下次重试时间',
        get() {
          const v = this.getDataValue('nextRetryAt');
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
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '完成时间',
        get() {
          const v = this.getDataValue('completedAt');
          return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
    },
    {
      tableName: 'webhook_logs',
      timestamps: false,
      indexes: [
        { fields: ['webhookId'] },
        { fields: ['webhookId', 'createdAt'] },
        { fields: ['webhookId', 'status'] },
        { fields: ['event'] },
        { fields: ['event', 'createdAt'] },
        { fields: ['status', 'nextRetryAt'] },
        { fields: ['createdAt'] }, // 用于 TTL 清理
      ],
    }
  );

  WebhookLog.associate = function (models) {
    WebhookLog.belongsTo(models.Webhook, {
      foreignKey: 'webhookId',
      as: 'webhook',
      constraints: false,
    });
  };

  // 类方法
  WebhookLog.findByWebhookId = function (webhookId, limit = 100) {
    return this.findAll({
      where: { webhookId },
      order: [['createdAt', 'DESC']],
      limit,
    });
  };

  WebhookLog.findByEvent = function (event, limit = 100) {
    return this.findAll({
      where: { event },
      order: [['createdAt', 'DESC']],
      limit,
    });
  };

  WebhookLog.findPendingRetries = function (limit = 100) {
    return this.findAll({
      where: {
        status: 'retrying',
        nextRetryAt: {
          [sequelize.Sequelize.Op.lte]: new Date(),
        },
      },
      limit,
    });
  };

  WebhookLog.cleanupOldLogs = async function (daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.destroy({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.lt]: cutoffDate,
        },
      },
    });

    return {
      deletedCount: result,
      cutoffDate,
    };
  };

  // 实例方法
  WebhookLog.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加状态文本
    const statusMap = {
      pending: '待发送',
      success: '成功',
      failed: '失败',
      retrying: '重试中',
    };
    values.statusText = statusMap[values.status] || values.status;

    // 添加虚拟字段
    values.isSuccess = values.status === 'success';
    values.isFailed = values.status === 'failed';
    values.needsRetry =
      values.status === 'retrying' && values.nextRetryAt && new Date() >= new Date(values.nextRetryAt);

    // 确保 JSON 字段的正确格式
    if (typeof values.payload === 'string') {
      try {
        values.payload = JSON.parse(values.payload);
      } catch (e) {
        values.payload = {};
      }
    }

    if (typeof values.request === 'string') {
      try {
        values.request = JSON.parse(values.request);
      } catch (e) {
        values.request = {};
      }
    }

    if (typeof values.response === 'string') {
      try {
        values.response = JSON.parse(values.response);
      } catch (e) {
        values.response = null;
      }
    }

    if (typeof values.error === 'string') {
      try {
        values.error = JSON.parse(values.error);
      } catch (e) {
        values.error = null;
      }
    }

    return values;
  };

  WebhookLog.prototype.isSuccess = function () {
    return this.status === 'success';
  };

  WebhookLog.prototype.isFailed = function () {
    return this.status === 'failed';
  };

  WebhookLog.prototype.isPending = function () {
    return this.status === 'pending';
  };

  WebhookLog.prototype.isRetrying = function () {
    return this.status === 'retrying';
  };

  WebhookLog.prototype.needsRetry = function () {
    return this.status === 'retrying' && this.nextRetryAt && new Date() >= new Date(this.nextRetryAt);
  };

  return WebhookLog;
};
