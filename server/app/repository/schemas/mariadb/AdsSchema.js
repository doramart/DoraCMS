/**
 * Ads MariaDB Schema 定义 - 基于 Repository 模式优化
 * 对应 MongoDB 的 Ads 结构，支持与 AdsItems 的关联
 * 🔥 基于Menu模块的成功经验，保持与MongoDB模型的字段一致性
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

const AdsSchema = (sequelize, app) => {
  const Ads = sequelize.define(
    'Ads',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '广告名称',
        validate: {
          notEmpty: true,
          len: [2, 200],
        },
      },
      type: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '0',
        comment: '展示形式 0文字 1图片 2友情链接',
        validate: {
          isIn: [['0', '1', '2']],
        },
      },
      carousel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否轮播',
      },
      state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '广告状态',
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
        comment: '高度',
        validate: {
          min: 1,
          max: 2000,
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '创建时间',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '更新时间',
      },
      items: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: '[]',
        comment: '广告单元ID数组(JSON)',
        get() {
          const value = this.getDataValue('items');
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return [];
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('items', Array.isArray(value) ? value : []);
        },
      },
      comments: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '描述',
        validate: {
          len: [0, 500],
        },
      },
    },
    {
      tableName: 'ads',
      timestamps: false,
      comment: '广告表',

      // 🔥 验证规则（基于Menu模块经验）
      validate: {
        nameRequired() {
          if (!this.name || this.name.trim() === '') {
            throw new Error('广告名称不能为空');
          }
        },
        typeValid() {
          if (!['0', '1', '2'].includes(this.type)) {
            throw new Error('展示形式必须是 0（文字）、1（图片）或 2（友情链接）');
          }
        },
        heightValid() {
          if (this.height < 1 || this.height > 2000) {
            throw new Error('高度必须在 1-2000 之间');
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
          // 确保 items 字段的默认值
          if (!instance.items) {
            instance.items = [];
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
          fields: ['name'],
        },
      ],
    }
  );

  // 定义关联关系（如果需要）
  Ads.associate = models => {
    // 这里可以定义与其他模型的关联关系
    // 比如：Ads.belongsTo(models.User, { foreignKey: 'createBy', as: 'creator' });
  };

  // 🔥 类方法（基于Menu模块经验）
  Ads.findByState = function (state) {
    return this.findAll({ where: { state } });
  };

  Ads.findByType = function (type) {
    return this.findAll({ where: { type } });
  };

  Ads.findByName = function (name) {
    return this.findOne({ where: { name } });
  };

  Ads.findEnabledAds = function () {
    return this.findAll({
      where: { state: true },
      order: [['createdAt', 'DESC']],
    });
  };

  Ads.checkNameUnique = async function (name, excludeId = null) {
    const where = { name };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  // 🔥 实例方法（基于Menu模块成功实践）
  Ads.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加状态文本描述
    values.stateText = values.state ? '启用' : '禁用';

    // 添加类型文本描述
    const typeTexts = {
      0: '文字',
      1: '图片',
      2: '友情链接',
    };
    values.typeText = typeTexts[values.type] || '未知';

    return values;
  };

  Ads.prototype.getDisplayName = function () {
    return this.name || `广告-${this.id}`;
  };

  Ads.prototype.isEnabled = function () {
    return this.state === true;
  };

  Ads.prototype.isDisabled = function () {
    return this.state === false;
  };

  Ads.prototype.getItemCount = function () {
    return Array.isArray(this.items) ? this.items.length : 0;
  };

  return Ads;
};

module.exports = AdsSchema;
