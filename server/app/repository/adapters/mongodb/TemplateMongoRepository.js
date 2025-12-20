/**
 * Template MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 专注于Template特有的业务逻辑和模板管理功能
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class TemplateMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Template');

    // 设置 MongoDB 模型
    this.model = this.app.model.Template;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // Template 模块暂无关联关系
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // Template 模块暂无关联查询需求
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'slug', 'author', 'description'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'active', order: 'desc' }, // 激活的主题排在前面
      { field: 'createdAt', order: 'desc' }, // 创建时间倒序
    ];
  }

  /**
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理 - Template 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 添加 Template 特有的数据处理
    item.templatePath = `app/view/${item.slug}`;

    // 添加状态文本
    item.activeText = item.active ? '已激活' : '未激活';
    item.installedText = item.installed ? '已安装' : '未安装';
    item.canUninstall = !item.isSystemTemplate;

    // 确保配置字段的默认值
    if (!item.config) {
      item.config = {
        layouts: ['default'],
        templates: ['index'],
        components: ['header', 'footer'],
        supports: ['responsive'],
        customOptions: {},
      };
    }

    // 确保统计信息的默认值
    if (!item.stats) {
      item.stats = {
        downloadCount: 0,
        rating: 5.0,
        reviewCount: 0,
      };
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理 - Template 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 设置默认值
    if (!data.version) data.version = '1.0.0';
    if (!data.author) data.author = 'doramart';
    if (!data.screenshot) data.screenshot = '/stylesheets/backstage/img/screenshot.png';
    if (typeof data.active === 'undefined') data.active = false;
    if (typeof data.installed === 'undefined') data.installed = true;
    if (typeof data.isSystemTemplate === 'undefined') data.isSystemTemplate = false;

    // 系统模板列表（不允许删除/卸载）
    const SYSTEM_TEMPLATE_SLUGS = ['standard-template', 'default'];
    if (SYSTEM_TEMPLATE_SLUGS.includes(data.slug)) {
      data.isSystemTemplate = true;
    }

    // 确保配置字段的默认值
    if (!data.config) {
      data.config = {
        layouts: ['default', 'sidebar', 'full-width'],
        templates: ['index', 'post', 'page', 'category', 'archive', 'search'],
        components: ['header', 'footer', 'nav', 'breadcrumb', 'sidebar'],
        supports: ['responsive', 'seo', 'social-share'],
        customOptions: {},
      };
    }

    // 确保兼容性配置的默认值
    if (!data.compatibility) {
      data.compatibility = {
        minVersion: '1.0.0',
        maxVersion: null,
      };
    }

    // 确保统计信息的默认值
    if (!data.stats) {
      data.stats = {
        downloadCount: 0,
        rating: 5.0,
        reviewCount: 0,
      };
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - Template 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 更新时间会在基类中自动设置
    return data;
  }

  // ===== 🔥 重写CRUD方法以包含自动唯一性验证 =====

  /**
   * 创建模板（自动验证唯一性）
   * @param {Object} data 模板数据
   * @return {Promise<Object>} 创建的模板
   * @throws {UniqueConstraintError} 当slug不唯一时抛出
   */
  async create(data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性
      if (data.slug) {
        await this.checkSlugUnique(data.slug);
      }

      // 调用父类的create方法
      return await super.create(data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'create', data);
    }
  }

  /**
   * 更新模板（自动验证唯一性）
   * @param {String} id 模板ID
   * @param {Object} data 要更新的数据
   * @return {Promise<Object>} 更新后的模板
   * @throws {UniqueConstraintError} 当slug不唯一时抛出
   */
  async update(id, data) {
    try {
      // 🔥 Phase2扩展：自动验证唯一性（排除当前ID）
      if (data.slug) {
        await this.checkSlugUnique(data.slug, id);
      }

      // 调用父类的update方法
      return await super.update(id, data);
    } catch (error) {
      // 透传UniqueConstraintError，其他错误由_handleError处理
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'update', { id, data });
    }
  }

  // ===== Template 特有的业务方法 =====

  /**
   * 检查主题标识符是否唯一 - 统一异常处理版本
   * @param {String} slug 主题标识符
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当标识符已存在时抛出异常
   */
  async checkSlugUnique(slug, excludeId = null) {
    try {
      // 🔥 使用UniqueChecker统一处理唯一性验证
      const isUnique = await UniqueChecker.checkTemplateSlugUnique(this, slug, excludeId);
      if (!isUnique) {
        throw this.exceptions.template.slugExists(slug);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkSlugUnique', { slug, excludeId });
    }
  }

  /**
   * 获取当前激活的主题
   * @return {Promise<Object|null>} 激活的主题
   */
  async getActiveTheme() {
    try {
      const activeTheme = await this.findOne({ active: true });
      this._logOperation('getActiveTheme', {}, activeTheme);
      return activeTheme;
    } catch (error) {
      this._handleError(error, 'getActiveTheme', {});
    }
  }

  /**
   * 激活指定主题 - 统一异常处理版本
   * @param {String} themeId 主题ID
   * @param {String} operatorId 操作用户ID
   * @return {Promise<Object>} 激活的主题
   * @throws {NotFoundError} 当主题不存在时抛出异常
   * @throws {BusinessRuleError} 当主题未安装时抛出异常
   */
  async activateTheme(themeId, operatorId = null) {
    try {
      // 检查主题是否存在
      const theme = await this.findById(themeId);
      if (!theme) {
        throw this.exceptions.template.notFound(themeId);
      }

      // 检查主题是否已安装
      if (!theme.installed) {
        throw this.exceptions.template.notInstalled(themeId);
      }

      // 先停用所有主题
      await this.model.updateMany({}, { active: false, updatedAt: new Date() });

      // 激活指定主题
      const updateData = {
        active: true,
        updatedAt: new Date(),
      };
      if (operatorId) {
        updateData.updateBy = operatorId;
      }

      const activatedTheme = await this.update(themeId, updateData);

      this._logOperation('activateTheme', { themeId, operatorId }, activatedTheme);
      return activatedTheme;
    } catch (error) {
      if (['NotFoundError', 'BusinessRuleError'].includes(error.name)) {
        throw error;
      }
      this._handleError(error, 'activateTheme', { themeId, operatorId });
    }
  }

  /**
   * 停用指定主题
   * @param {String} themeId 主题ID
   * @param {String} operatorId 操作用户ID
   * @return {Promise<Object>} 停用的主题
   */
  async deactivateTheme(themeId, operatorId = null) {
    try {
      const updateData = {
        active: false,
        updatedAt: new Date(),
      };
      if (operatorId) {
        updateData.updateBy = operatorId;
      }

      const deactivatedTheme = await this.update(themeId, updateData);

      this._logOperation('deactivateTheme', { themeId, operatorId }, deactivatedTheme);
      return deactivatedTheme;
    } catch (error) {
      this._handleError(error, 'deactivateTheme', { themeId, operatorId });
    }
  }

  /**
   * 根据slug查找主题
   * @param {String} slug 主题标识符
   * @return {Promise<Object|null>} 主题对象
   */
  async findBySlug(slug) {
    try {
      const theme = await this.findOne({ slug });
      this._logOperation('findBySlug', { slug }, theme);
      return theme;
    } catch (error) {
      this._handleError(error, 'findBySlug', { slug });
    }
  }

  /**
   * 获取已安装的主题列表
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 已安装的主题列表
   */
  async getInstalledThemes(options = {}) {
    try {
      const filters = { installed: { $eq: true } };
      const result = await this.find({}, { ...options, filters });

      this._logOperation('getInstalledThemes', { options }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getInstalledThemes', { options });
    }
  }

  /**
   * 检查主题文件是否存在
   * @param {String} slug 主题标识符
   * @return {Promise<Object>} 文件检查结果
   */
  async checkThemeFiles(slug) {
    try {
      const themePath = path.join(this.app.baseDir, 'app', 'view', slug);
      const requiredDirs = ['layouts', 'templates'];
      const requiredFiles = ['layouts/default.html', 'templates/index.html'];

      const result = {
        exists: fs.existsSync(themePath),
        missingDirs: [],
        missingFiles: [],
        isValid: true,
      };

      if (!result.exists) {
        result.isValid = false;
        result.missingDirs = requiredDirs;
        result.missingFiles = requiredFiles;
      } else {
        // 检查必需目录
        for (const dir of requiredDirs) {
          const dirPath = path.join(themePath, dir);
          if (!fs.existsSync(dirPath)) {
            result.missingDirs.push(dir);
            result.isValid = false;
          }
        }

        // 检查必需文件
        for (const file of requiredFiles) {
          const filePath = path.join(themePath, file);
          if (!fs.existsSync(filePath)) {
            result.missingFiles.push(file);
            result.isValid = false;
          }
        }
      }

      this._logOperation('checkThemeFiles', { slug }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'checkThemeFiles', { slug });
    }
  }

  /**
   * 获取主题的模板文件列表
   * @param {String} slug 主题标识符
   * @return {Promise<Object>} 模板文件列表
   */
  async getThemeTemplates(slug) {
    try {
      const themePath = path.join(this.app.baseDir, 'app', 'view', slug);
      const templatesPath = path.join(themePath, 'templates');

      const result = {
        layouts: [],
        templates: [],
        components: [],
        partials: [],
      };

      if (!fs.existsSync(templatesPath)) {
        return result;
      }

      // 扫描各个目录
      const scanDir = (dirPath, type) => {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          return files
            .filter(file => file.endsWith('.html'))
            .map(file => ({
              name: file.replace('.html', ''),
              filename: file,
              path: path.join(dirPath, file),
              type,
            }));
        }
        return [];
      };

      result.layouts = scanDir(path.join(themePath, 'layouts'), 'layout');
      result.templates = scanDir(templatesPath, 'template');
      result.components = scanDir(path.join(themePath, 'components'), 'component');
      result.partials = scanDir(path.join(themePath, 'partials'), 'partial');

      this._logOperation('getThemeTemplates', { slug }, result);
      return result;
    } catch (error) {
      this._handleError(error, 'getThemeTemplates', { slug });
    }
  }

  /**
   * 更新主题统计信息
   * @param {String} themeId 主题ID
   * @param {Object} statsUpdate 统计信息更新
   * @return {Promise<Object>} 更新后的主题
   */
  async updateStats(themeId, statsUpdate) {
    try {
      const theme = await this.findById(themeId);
      if (!theme) {
        throw this.exceptions.template.notFound(themeId);
      }

      const currentStats = theme.stats || {
        downloadCount: 0,
        rating: 5.0,
        reviewCount: 0,
      };

      const newStats = { ...currentStats, ...statsUpdate };

      const updatedTheme = await this.update(themeId, {
        stats: newStats,
        updatedAt: new Date(),
      });

      this._logOperation('updateStats', { themeId, statsUpdate }, updatedTheme);
      return updatedTheme;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
      this._handleError(error, 'updateStats', { themeId, statsUpdate });
    }
  }

  /**
   * 批量更新主题状态
   * @param {Array} themeIds 主题ID数组
   * @param {String} status 新状态
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(themeIds, status) {
    try {
      const idArray = Array.isArray(themeIds) ? themeIds : [themeIds];
      const result = await this.model.updateMany(
        { _id: { $in: idArray } },
        { $set: { status, updatedAt: new Date() } }
      );

      this._logOperation('batchUpdateStatus', { themeIds, status }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'batchUpdateStatus', { themeIds, status });
    }
  }

  /**
   * 获取主题统计信息
   * @param {Object} filters 过滤条件
   * @return {Promise<Object>} 统计信息
   */
  async getTemplateStats(filters = {}) {
    try {
      const pipeline = [
        { $match: filters },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$active', 1, 0] } },
            installed: { $sum: { $cond: ['$installed', 1, 0] } },
            totalDownloads: { $sum: '$stats.downloadCount' },
            avgRating: { $avg: '$stats.rating' },
          },
        },
      ];

      const result = await this.model.aggregate(pipeline);
      const stats = result[0] || {
        total: 0,
        active: 0,
        installed: 0,
        totalDownloads: 0,
        avgRating: 0,
      };

      this._logOperation('getTemplateStats', { filters }, stats);
      return stats;
    } catch (error) {
      this._handleError(error, 'getTemplateStats', { filters });
      return {
        total: 0,
        active: 0,
        installed: 0,
        totalDownloads: 0,
        avgRating: 0,
      };
    }
  }
}

module.exports = TemplateMongoRepository;
