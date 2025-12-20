/**
 * Template 模板主题模型
 * 替代原有的 ContentTemplate，统一管理主题模板
 * @Author: AI Assistant
 * @Date: 2025-01-19
 */
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;

  const TemplateSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },

    // 基础信息
    name: {
      type: String,
      required: true,
      maxlength: 100,
    }, // 主题名称

    slug: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    }, // 主题标识符，用于文件夹名

    version: {
      type: String,
      default: '1.0.0',
    }, // 版本号

    author: {
      type: String,
      default: 'doramart',
    }, // 作者

    description: {
      type: String,
      maxlength: 500,
    }, // 主题描述

    screenshot: {
      type: String,
      default: '/stylesheets/backstage/img/screenshot.png',
    }, // 主题截图

    // 主题配置 - JSON存储灵活配置
    config: {
      // 支持的布局列表
      layouts: [
        {
          type: String,
          default: ['default', 'sidebar', 'full-width'],
        },
      ],

      // 支持的模板列表
      templates: [
        {
          type: String,
          default: ['index', 'post', 'page', 'category', 'archive', 'search'],
        },
      ],

      // 支持的组件列表
      components: [
        {
          type: String,
          default: ['header', 'footer', 'nav', 'breadcrumb', 'sidebar'],
        },
      ],

      // 主题特性支持
      supports: [
        {
          type: String,
          default: ['responsive', 'seo', 'social-share'],
        },
      ],

      // 自定义配置选项
      customOptions: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // 系统状态
    active: {
      type: Boolean,
      default: false,
    }, // 是否激活（全局唯一）

    installed: {
      type: Boolean,
      default: true,
    }, // 是否已安装

    isSystemTemplate: {
      type: Boolean,
      default: false,
    }, // 是否为系统模板（系统模板不允许卸载）

    marketId: {
      type: String,
    }, // 模板市场ID

    // 兼容性字段
    compatibility: {
      minVersion: {
        type: String,
        default: '1.0.0',
      }, // 最小兼容版本
      maxVersion: {
        type: String,
      }, // 最大兼容版本
    },

    // 统计信息
    stats: {
      downloadCount: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5,
      },
      reviewCount: {
        type: Number,
        default: 0,
      },
    },

    // 时间字段
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // 创建和更新用户
    createBy: {
      type: String,
      ref: 'Admin',
    },

    updateBy: {
      type: String,
      ref: 'Admin',
    },
  });

  // 索引
  TemplateSchema.index({ slug: 1 }, { unique: true });
  TemplateSchema.index({ active: 1 });
  TemplateSchema.index({ installed: 1 });
  TemplateSchema.index({ isSystemTemplate: 1 });
  TemplateSchema.index({ createdAt: -1 });

  // 虚拟字段
  TemplateSchema.virtual('templatePath').get(function () {
    return `app/view/${this.slug}`;
  });

  TemplateSchema.virtual('canUninstall').get(function () {
    // 系统模板不允许卸载
    return !this.isSystemTemplate;
  });

  // 实例方法
  TemplateSchema.methods = {
    /**
     * 获取模板文件路径
     * @param {String} templateType 模板类型
     * @param {String} categoryType 分类类型
     * @return {String} 模板文件路径
     */
    getTemplatePath(templateType = 'index', categoryType = null) {
      const basePath = `app/view/${this.slug}`;

      if (categoryType) {
        return `${basePath}/templates/category-${categoryType}.html`;
      }

      return `${basePath}/templates/${templateType}.html`;
    },

    /**
     * 获取布局文件路径
     * @param {String} layoutName 布局名称
     * @return {String} 布局文件路径
     */
    getLayoutPath(layoutName = 'default') {
      return `app/view/${this.slug}/layouts/${layoutName}.html`;
    },

    /**
     * 检查是否支持某个特性
     * @param {String} feature 特性名称
     * @return {Boolean} 是否支持
     */
    supportsFeature(feature) {
      return this.config.supports && this.config.supports.includes(feature);
    },

    /**
     * 获取主题统计信息
     * @return {Object} 统计信息
     */
    getStats() {
      return {
        downloadCount: this.stats.downloadCount || 0,
        rating: this.stats.rating || 5.0,
        reviewCount: this.stats.reviewCount || 0,
      };
    },
  };

  // 静态方法
  TemplateSchema.statics = {
    /**
     * 获取当前激活的主题
     * @return {Promise<Object>} 激活的主题
     */
    async getActiveTheme() {
      return await this.findOne({ active: true }).lean();
    },

    /**
     * 激活指定主题
     * @param {String} themeId 主题ID
     * @return {Promise<Object>} 操作结果
     */
    async activateTheme(themeId) {
      // 先停用所有主题
      await this.updateMany({}, { active: false });

      // 激活指定主题
      return await this.findByIdAndUpdate(themeId, { active: true, updatedAt: new Date() }, { new: true });
    },

    /**
     * 检查主题slug是否可用
     * @param {String} slug 主题标识符
     * @param {String} excludeId 排除的ID
     * @return {Promise<Boolean>} 是否可用
     */
    async isSlugAvailable(slug, excludeId = null) {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await this.countDocuments(query);
      return count === 0;
    },
  };

  // Mongoose 中间件
  TemplateSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  TemplateSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
  });

  // 时间格式化
  TemplateSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  TemplateSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Template', TemplateSchema, 'templates');
};
