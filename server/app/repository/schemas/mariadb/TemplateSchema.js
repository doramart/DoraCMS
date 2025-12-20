/*
 * @Author: AI Assistant
 * @Date: 2025-01-19
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2025-01-19
 * @Description: Template MariaDB Schema 定义 - 基于新的模板系统设计
 */

'use strict';

const { DataTypes } = require('sequelize');

/**
 * Template Schema for MariaDB
 * 模板主题表结构定义 - 统一管理主题模板
 * @param sequelize
 * @param app
 */
const TemplateSchema = (sequelize, app) => {
  const Template = sequelize.define(
    'Template',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键ID',
      },

      // 基础信息
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '主题名称',
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },

      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '主题标识符，用于文件夹名',
        validate: {
          notEmpty: true,
          len: [1, 50],
          is: /^[a-zA-Z0-9-_]+$/, // 只允许字母数字下划线横线
        },
      },

      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0',
        comment: '版本号',
      },

      author: {
        type: DataTypes.STRING(100),
        defaultValue: 'doramart',
        comment: '作者',
      },

      description: {
        type: DataTypes.TEXT,
        comment: '主题描述',
      },

      screenshot: {
        type: DataTypes.STRING(255),
        defaultValue: '/stylesheets/backstage/img/screenshot.png',
        comment: '主题截图',
      },

      // 主题配置 - JSON存储
      config: {
        type: DataTypes.JSON,
        defaultValue: {
          layouts: ['default', 'sidebar', 'full-width'],
          templates: ['index', 'post', 'page', 'category', 'archive', 'search'],
          components: ['header', 'footer', 'nav', 'breadcrumb', 'sidebar'],
          supports: ['responsive', 'seo', 'social-share'],
          customOptions: {},
        },
        comment: '主题配置信息',
        get() {
          const value = this.getDataValue('config');
          if (!value) {
            return {
              layouts: ['default'],
              templates: ['index'],
              components: ['header', 'footer'],
              supports: ['responsive'],
              customOptions: {},
            };
          }
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return {
                layouts: ['default'],
                templates: ['index'],
                components: ['header', 'footer'],
                supports: ['responsive'],
                customOptions: {},
              };
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('config', value);
        },
      },

      // 系统状态
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否激活（全局唯一）',
      },

      installed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否已安装',
      },

      isSystemTemplate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否为系统模板（系统模板不允许卸载）',
      },

      marketId: {
        type: DataTypes.STRING(50),
        comment: '模板市场ID',
      },

      // 兼容性配置 - JSON存储
      compatibility: {
        type: DataTypes.JSON,
        defaultValue: {
          minVersion: '1.0.0',
          maxVersion: null,
        },
        comment: '兼容性配置',
        get() {
          const value = this.getDataValue('compatibility');
          if (!value) return { minVersion: '1.0.0', maxVersion: null };
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return { minVersion: '1.0.0', maxVersion: null };
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('compatibility', value);
        },
      },

      // 统计信息 - JSON存储
      stats: {
        type: DataTypes.JSON,
        defaultValue: {
          downloadCount: 0,
          rating: 5.0,
          reviewCount: 0,
        },
        comment: '统计信息',
        get() {
          const value = this.getDataValue('stats');
          if (!value) return { downloadCount: 0, rating: 5.0, reviewCount: 0 };
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return { downloadCount: 0, rating: 5.0, reviewCount: 0 };
            }
          }
          return value;
        },
        set(value) {
          this.setDataValue('stats', value);
        },
      },

      // 状态字段
      status: {
        type: DataTypes.STRING(10),
        defaultValue: '1',
        comment: '状态: 0-禁用, 1-启用',
        validate: {
          isIn: [['0', '1']],
        },
      },

      // 时间字段
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

      // 创建和更新用户
      createBy: {
        type: DataTypes.STRING(50),
        comment: '创建用户ID',
      },

      updateBy: {
        type: DataTypes.STRING(50),
        comment: '更新用户ID',
      },
    },
    {
      timestamps: false, // 使用自定义时间字段
      tableName: 'templates',
      comment: '模板主题表',

      // 添加虚拟字段
      getterMethods: {
        templatePath() {
          return `app/view/${this.slug}`;
        },

        canUninstall() {
          // 系统模板不允许卸载
          return !this.isSystemTemplate;
        },

        // 模板配置的快捷访问方法
        layouts() {
          const config = this.config || {};
          return config.layouts || ['default'];
        },

        templates() {
          const config = this.config || {};
          return config.templates || ['index'];
        },

        components() {
          const config = this.config || {};
          return config.components || ['header', 'footer'];
        },

        supports() {
          const config = this.config || {};
          return config.supports || ['responsive'];
        },
      },

      // 数据验证
      validate: {
        nameRequired() {
          if (!this.name || this.name.trim() === '') {
            throw new Error('主题名称不能为空');
          }
        },

        slugRequired() {
          if (!this.slug || this.slug.trim() === '') {
            throw new Error('主题标识符不能为空');
          }
        },

        slugFormat() {
          if (this.slug && !/^[a-zA-Z0-9-_]+$/.test(this.slug)) {
            throw new Error('主题标识符只能包含字母、数字、下划线和横线');
          }
        },

        versionFormat() {
          if (this.version && !/^\d+\.\d+\.\d+$/.test(this.version)) {
            throw new Error('版本号格式不正确，应为 x.y.z 格式');
          }
        },

        statusValid() {
          if (!['0', '1'].includes(this.status)) {
            throw new Error('状态必须是 0（禁用）或 1（启用）');
          }
        },

        // 只能有一个激活主题
        async uniqueActiveTheme() {
          if (this.active) {
            const activeCount = await this.constructor.count({
              where: {
                active: true,
                id: { [sequelize.Sequelize.Op.ne]: this.id || 0 },
              },
            });
            if (activeCount > 0) {
              throw new Error('只能有一个激活的主题');
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

        beforeValidate(instance) {
          // 确保 JSON 字段的默认值
          if (!instance.config) {
            instance.config = {
              layouts: ['default'],
              templates: ['index'],
              components: ['header', 'footer'],
              supports: ['responsive'],
              customOptions: {},
            };
          }

          if (!instance.compatibility) {
            instance.compatibility = {
              minVersion: '1.0.0',
              maxVersion: null,
            };
          }

          if (!instance.stats) {
            instance.stats = {
              downloadCount: 0,
              rating: 5.0,
              reviewCount: 0,
            };
          }
        },
      },

      // 索引定义
      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
        {
          fields: ['active'],
        },
        {
          fields: ['installed'],
        },
        {
          fields: ['isSystemTemplate'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['marketId'],
        },
      ],
    }
  );

  // 定义关联关系
  Template.associate = models => {
    // 如果需要关联用户表
    // Template.belongsTo(models.Admin, { foreignKey: 'createBy', as: 'creator' });
    // Template.belongsTo(models.Admin, { foreignKey: 'updateBy', as: 'updater' });
  };

  // 类方法
  Template.getActiveTheme = async function () {
    return await this.findOne({
      where: { active: true, status: '1' },
    });
  };

  Template.activateTheme = async function (themeId, transaction = null) {
    const options = transaction ? { transaction } : {};

    // 先停用所有主题
    await this.update(
      { active: false },
      {
        where: { active: true },
        ...options,
      }
    );

    // 激活指定主题
    return await this.update(
      { active: true, updatedAt: new Date() },
      {
        where: { id: themeId },
        ...options,
      }
    );
  };

  Template.isSlugAvailable = async function (slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeId };
    }

    const count = await this.count({ where });
    return count === 0;
  };

  Template.findBySlug = function (slug) {
    return this.findOne({ where: { slug } });
  };

  Template.findEnabledThemes = function () {
    return this.findAll({
      where: { status: '1', installed: true },
      order: [
        ['active', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  // 实例方法
  Template.prototype.getTemplatePath = function (templateType = 'index', categoryType = null) {
    const basePath = `app/view/${this.slug}`;

    if (categoryType) {
      return `${basePath}/templates/category-${categoryType}.html`;
    }

    return `${basePath}/templates/${templateType}.html`;
  };

  Template.prototype.getLayoutPath = function (layoutName = 'default') {
    return `app/view/${this.slug}/layouts/${layoutName}.html`;
  };

  Template.prototype.supportsFeature = function (feature) {
    const config = this.config || {};
    const supports = config.supports || [];
    return supports.includes(feature);
  };

  Template.prototype.getStats = function () {
    const stats = this.stats || {};
    return {
      downloadCount: stats.downloadCount || 0,
      rating: stats.rating || 5.0,
      reviewCount: stats.reviewCount || 0,
    };
  };

  // 重写 toJSON 方法
  Template.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    // 添加虚拟字段
    values.templatePath = `app/view/${values.slug}`;
    values.canUninstall = !values.isSystemTemplate;

    // 格式化日期
    if (values.createdAt) {
      const moment = require('moment');
      values.createdAt = moment(values.createdAt).format('YYYY-MM-DD HH:mm:ss');
    }
    if (values.updatedAt) {
      const moment = require('moment');
      values.updatedAt = moment(values.updatedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    // 添加状态文本描述
    values.statusText = values.status === '1' ? '启用' : '禁用';
    values.activeText = values.active ? '已激活' : '未激活';
    values.installedText = values.installed ? '已安装' : '未安装';

    return values;
  };

  return Template;
};

module.exports = TemplateSchema;
