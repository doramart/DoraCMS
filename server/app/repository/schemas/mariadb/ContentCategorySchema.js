/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: ContentCategory MariaDB Schema 定义 - 基于MongoDB模型设计
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * ContentCategory Schema for MariaDB
 * 内容分类表结构定义 - 基于 MongoDB 模型设计
 * @param sequelize
 * @param app
 */
const ContentCategorySchema = (sequelize, app) => {
  const ContentCategory = sequelize.define(
    'ContentCategory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 🔥 核心分类字段（与 MongoDB 模型一致）
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '分类名称',
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      keywords: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '关键词',
        validate: {
          len: [0, 500],
        },
      },

      type: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '类别类型: 1-普通分类, 2-单页面',
        validate: {
          isIn: [['1', '2']],
        },
      },

      sortId: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '排序值（正整数）',
        validate: {
          min: 1,
        },
      },

      parentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '父级分类ID',
      },

      enable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用',
      },

      // 🔥 URL和路径字段
      defaultUrl: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'SEO链接地址',
        validate: {
          len: [0, 200],
        },
      },

      sortPath: {
        type: DataTypes.STRING(500),
        defaultValue: '0',
        comment: '存储所有父节点结构路径',
        validate: {
          len: [0, 500],
        },
      },

      homePage: {
        type: DataTypes.STRING(50),
        defaultValue: 'ui',
        comment: '首页标识',
        validate: {
          len: [0, 50],
        },
      },

      // 🔥 内容模板关联字段（保留兼容性）
      // 使用软引用，不创建外键约束，避免表创建顺序问题
      contentTemp: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '内容模板ID（旧版兼容）',
      },

      // 🔥 新的主题配置字段 - JSON存储，灵活配置
      themeConfig: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '主题配置信息',
        defaultValue: null,
        get() {
          const value = this.getDataValue('themeConfig');
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
          this.setDataValue('themeConfig', value);
        },
      },

      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注描述',
      },

      // 🔥 图标和图片字段
      icon: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '分类图标',
        validate: {
          len: [0, 200],
        },
      },

      sImg: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '分类图片',
        validate: {
          len: [0, 500],
        },
      },

      // 统一时间字段（采用 createdAt/updatedAt 命名）
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

      // 创建和更新人员
      createBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '创建人员ID',
      },

      updateBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '更新人员ID',
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'content_categories',
      comment: '内容分类表',

      // 🔥 添加虚拟字段以保持与 MongoDB 风格的兼容性
      getterMethods: {
        // 虚拟 URL 字段
        url() {
          return this.defaultUrl ? `/${this.defaultUrl}___${this.id}` : `/category/${this.id}`;
        },

        // 状态文本
        statusText() {
          return this.enable ? '启用' : '禁用';
        },

        // 类型文本
        typeText() {
          const typeMap = {
            1: '普通分类',
            2: '单页面',
          };
          return typeMap[this.type] || '未知类型';
        },
      },

      // 🔥 数据验证和处理钩子
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
          // 确保必要字段的默认值
          if (!instance.type) {
            instance.type = '1';
          }
          if (!instance.parentId) {
            instance.parentId = '0';
          }
          if (!instance.sortPath) {
            instance.sortPath = '0';
          }
          if (!instance.homePage) {
            instance.homePage = 'ui';
          }
        },
      },

      // 索引定义
      indexes: [
        {
          fields: ['enable'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['parentId'],
        },
        {
          fields: ['sortId'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['defaultUrl'],
          unique: true,
          where: {
            defaultUrl: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        // 复合索引
        {
          fields: ['parentId', 'sortId'],
        },
        {
          fields: ['type', 'enable'],
        },
        {
          fields: ['enable', 'sortId'],
        },
        // 树形结构查询优化
        {
          fields: ['sortPath'],
        },
      ],

      // 验证规则
      validate: {
        nameRequired() {
          if (!this.name || this.name.trim() === '') {
            throw new Error('分类名称不能为空');
          }
        },

        typeValid() {
          if (!['1', '2'].includes(this.type)) {
            throw new Error('分类类型必须是 1（普通分类）或 2（单页面）');
          }
        },

        sortIdValid() {
          if (this.sortId < 1) {
            throw new Error('排序值必须是正整数');
          }
        },

        defaultUrlValid() {
          if (this.defaultUrl && this.defaultUrl.trim() === '') {
            throw new Error('默认URL不能为空字符串');
          }
        },

        parentIdValid() {
          if (this.parentId === this.id) {
            throw new Error('父分类不能是自己');
          }
        },

        sortPathValid() {
          if (this.sortPath && !this.sortPath.startsWith('0')) {
            throw new Error('排序路径必须以 0 开头');
          }
        },
      },
    }
  );

  // 定义关联关系
  ContentCategory.associate = models => {
    // 🔥 ContentCategory 与 Content 的多对多关联
    if (models.Content) {
      ContentCategory.belongsToMany(models.Content, {
        through: 'ContentCategoryRelation',
        foreignKey: 'category_id',
        otherKey: 'content_id',
        as: 'contents',
        constraints: true,
      });
    }

    // 🔥 自关联 - 父子分类关系（可选，用于树形查询优化）
    ContentCategory.belongsTo(ContentCategory, {
      foreignKey: 'parentId',
      as: 'parent',
      constraints: false,
    });

    ContentCategory.hasMany(ContentCategory, {
      foreignKey: 'parentId',
      as: 'children',
      constraints: false,
    });

    // 创建和更新人员关联（可选）
    // ContentCategory.belongsTo(models.User, { foreignKey: 'createBy', as: 'creator' });
    // ContentCategory.belongsTo(models.User, { foreignKey: 'updateBy', as: 'updater' });
  };

  // 🔥 类方法（基于Menu模块经验）
  ContentCategory.findByStatus = function (enable) {
    return this.findAll({ where: { enable } });
  };

  ContentCategory.findByType = function (type) {
    return this.findAll({
      where: { type },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  ContentCategory.findByParentId = function (parentId) {
    return this.findAll({
      where: { parentId },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  ContentCategory.findEnabledCategories = function () {
    return this.findAll({
      where: { enable: true },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  ContentCategory.findRootCategories = function () {
    return this.findAll({
      where: { parentId: '0', enable: true },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  ContentCategory.findByDefaultUrl = function (defaultUrl) {
    return this.findOne({ where: { defaultUrl } });
  };

  ContentCategory.checkNameUnique = async function (name, parentId = '0', excludeId = null) {
    const where = { name, parentId };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  ContentCategory.checkDefaultUrlUnique = async function (defaultUrl, excludeId = null) {
    const where = { defaultUrl };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count === 0;
  };

  ContentCategory.findByKeywords = function (keywords) {
    const { Op } = sequelize.Sequelize;
    return this.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${keywords}%` } },
          { keywords: { [Op.like]: `%${keywords}%` } },
          { comments: { [Op.like]: `%${keywords}%` } },
        ],
      },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  ContentCategory.findBySortPath = function (sortPath) {
    const { Op } = sequelize.Sequelize;
    return this.findAll({
      where: {
        sortPath: { [Op.like]: `${sortPath}%` },
      },
      order: [
        ['sortId', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  // 🔥 实例方法（基于Menu模块成功实践）
  ContentCategory.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加虚拟 URL 字段
    values.url = values.defaultUrl ? `/${values.defaultUrl}___${values.id}` : `/category/${values.id}`;

    // 🔥 格式化日期（使用 moment 格式化）
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 🔥 添加状态和类型的文本描述
    values.statusText = values.enable ? '启用' : '禁用';

    const typeMap = {
      1: '普通分类',
      2: '单页面',
    };
    values.typeText = typeMap[values.type] || '未知类型';

    return values;
  };

  ContentCategory.prototype.getDisplayName = function () {
    return this.name || `分类-${this.id}`;
  };

  ContentCategory.prototype.getUrl = function () {
    return this.defaultUrl ? `/${this.defaultUrl}___${this.id}` : `/category/${this.id}`;
  };

  ContentCategory.prototype.isEnabled = function () {
    return this.enable === true;
  };

  ContentCategory.prototype.isDisabled = function () {
    return this.enable === false;
  };

  ContentCategory.prototype.isRootCategory = function () {
    return this.parentId === '0';
  };

  ContentCategory.prototype.isNormalCategory = function () {
    return this.type === '1';
  };

  ContentCategory.prototype.isSinglePage = function () {
    return this.type === '2';
  };

  ContentCategory.prototype.hasIcon = function () {
    return !!(this.icon && this.icon.trim() !== '');
  };

  ContentCategory.prototype.hasImage = function () {
    return !!(this.sImg && this.sImg.trim() !== '');
  };

  ContentCategory.prototype.hasTemplate = function () {
    return !!(this.contentTemp && this.contentTemp.trim() !== '');
  };

  ContentCategory.prototype.getSortPathArray = function () {
    if (!this.sortPath) return [];
    return this.sortPath.split(',').filter(id => id && id !== '0');
  };

  ContentCategory.prototype.getDepth = function () {
    return this.getSortPathArray().length;
  };

  ContentCategory.prototype.isChildOf = function (parentId) {
    const pathArray = this.getSortPathArray();
    return pathArray.includes(String(parentId));
  };

  ContentCategory.prototype.getParentIds = function () {
    return this.getSortPathArray().slice(0, -1); // 排除自己的ID
  };

  ContentCategory.prototype.updateSortPath = function (parentSortPath) {
    if (parentSortPath === '0' || !parentSortPath) {
      this.sortPath = '0,' + this.id;
    } else {
      this.sortPath = parentSortPath + ',' + this.id;
    }
  };

  return ContentCategory;
};

module.exports = ContentCategorySchema;
