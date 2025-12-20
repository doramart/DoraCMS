/**
 * AdsItems MariaDB Schema 定义 - 基于 Repository 模式优化
 * 对应 MongoDB 的 AdsItems 结构
 * 🔥 基于Menu模块的成功经验，保持与MongoDB模型的字段一致性
 */
'use strict';

const { DataTypes } = require('sequelize');
const moment = require('moment');

const AdsItemsSchema = (sequelize, app) => {
  const AdsItems = sequelize.define(
    'AdsItems',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '广告标题',
        validate: {
          len: [0, 200],
        },
      },
      link: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '广告链接',
        validate: {
          len: [0, 500],
        },
      },
      appLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'APP广告链接',
        validate: {
          len: [0, 500],
        },
      },
      appLinkType: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'APP跳转类别 0文章',
        validate: {
          isIn: [['0', '1', '2', null]],
        },
      },
      width: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '宽度',
        validate: {
          min: 1,
          max: 5000,
        },
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: '高度',
        validate: {
          min: 1,
          max: 5000,
        },
      },
      target: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '_blank',
        comment: '链接打开方式',
        validate: {
          isIn: [['_blank', '_self', '_parent', '_top']],
        },
      },
      sImg: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '图片路径',
        validate: {
          len: [0, 500],
        },
      },
      alt: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '广告alt标识',
        validate: {
          len: [0, 200],
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
    },
    {
      tableName: 'ads_items',
      timestamps: false,
      comment: '广告单元表',

      // 🔥 验证规则
      validate: {
        linkValid() {
          if (this.link && this.link.trim() !== '' && !this.link.match(/^https?:\/\//)) {
            // 如果提供了链接，检查是否是有效的URL格式
            throw new Error('广告链接格式不正确，请以 http:// 或 https:// 开头');
          }
        },
        dimensionsValid() {
          if (this.width && this.width < 1) {
            throw new Error('宽度必须大于0');
          }
          if (this.height && this.height < 1) {
            throw new Error('高度必须大于0');
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
      },

      // 索引定义
      indexes: [
        {
          fields: ['createdAt'],
        },
        {
          fields: ['title'],
        },
      ],
    }
  );

  // 定义关联关系（如果需要）
  AdsItems.associate = models => {
    // 这里可以定义与其他模型的关联关系
  };

  // 🔥 类方法
  AdsItems.findByTitle = function (title) {
    return this.findAll({
      where: {
        title: {
          [sequelize.Sequelize.Op.like]: `%${title}%`,
        },
      },
    });
  };

  AdsItems.findByTarget = function (target) {
    return this.findAll({ where: { target } });
  };

  // 🔥 实例方法
  AdsItems.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 🔥 格式化日期
    if (values.createdAt) {
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 添加链接类型文本描述
    const targetTexts = {
      _blank: '新窗口',
      _self: '当前窗口',
      _parent: '父窗口',
      _top: '顶层窗口',
    };
    values.targetText = targetTexts[values.target] || '新窗口';

    // 添加 APP 链接类型文本
    const appLinkTypeTexts = {
      0: '文章',
      1: '分类',
      2: '其他',
    };
    values.appLinkTypeText = values.appLinkType ? appLinkTypeTexts[values.appLinkType] || '未知' : '';

    return values;
  };

  AdsItems.prototype.getDisplayName = function () {
    return this.title || this.alt || `广告单元-${this.id}`;
  };

  AdsItems.prototype.hasImage = function () {
    return !!(this.sImg && this.sImg.trim() !== '');
  };

  AdsItems.prototype.hasLink = function () {
    return !!(this.link && this.link.trim() !== '');
  };

  return AdsItems;
};

module.exports = AdsItemsSchema;
