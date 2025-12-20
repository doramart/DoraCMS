/**
 * Template Manager Service
 * 模板管理服务 - 负责主题安装、激活、维护等功能
 */
'use strict';

const Service = require('egg').Service;
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
// const { promisify } = require('util');
const TemplateLayoutGenerator = require('../../scripts/template-layout-generator');

class TemplateManagerService extends Service {
  /**
   * 安装主题包
   * @param {Object} themePackage 主题包信息
   * @param {Buffer|String} packageData 主题包数据（文件路径或Buffer）
   * @return {Promise<Object>} 安装结果
   */
  async installTheme(themePackage, packageData) {
    const { slug, name, version = '1.0.0' } = themePackage;

    try {
      // 1. 检查主题是否已存在
      const existingTheme = await this.ctx.service.template.findBySlug(slug);
      if (existingTheme) {
        throw new Error(this.ctx.__('template.error.exists', [slug]));
      }

      let themePath;
      let isDirectoryPath = false;

      // 2. 判断packageData是目录路径还是压缩包
      if (typeof packageData === 'string' && fs.existsSync(packageData) && fs.statSync(packageData).isDirectory()) {
        // 如果是已解压的目录，直接使用
        themePath = packageData;
        isDirectoryPath = true;
      } else {
        // 如果是压缩包，需要解压
        themePath = path.join(this.app.baseDir, 'app', 'view', slug);
        await this._extractThemePackage(packageData, themePath);
      }

      // 3. 验证主题结构
      await this._validateThemeStructure(themePath);

      // 4. 读取主题配置文件
      const themeConfig = await this._readThemeConfig(themePath, themePackage);

      // 提取配置字段到 config 对象中
      const { layouts, templates, components, supports, customOptions, ...otherConfig } = themeConfig;

      const theme = {
        ...otherConfig, // 其他配置（assets, settings, colors 等）
        ...themePackage, // 使用传入的themePackage覆盖配置
        slug,
        name,
        version,
        installed: true,
        active: false,
        config: {
          ...themePackage.config, // 保留传入的 config
          layouts, // 从 themeConfig 提取
          templates,
          components,
          supports,
          customOptions,
        },
        createBy: this.ctx.session.adminUserInfo?.id || 'system',
      };

      // 🎯 执行安装前钩子
      await this.ctx.service.templateHooks.executeHook('before:install', theme, {
        packageData,
        themePath,
        autoGenerate: true,
        installType: 'local',
      });

      // 5. 保存主题信息到数据库
      const createdTheme = await this.ctx.service.template.create(theme);

      // 6. 如果是目录路径，需要复制到正确位置
      const targetPath = path.join(this.app.baseDir, 'app', 'view', slug);
      const normalizedThemePath = path.resolve(themePath);
      const normalizedTargetPath = path.resolve(targetPath);

      if (isDirectoryPath && normalizedThemePath !== normalizedTargetPath) {
        await this._copyThemeDirectory(themePath, targetPath);
        themePath = targetPath;
      } else if (normalizedThemePath === normalizedTargetPath) {
        this.ctx.logger.debug(`Theme already in correct location: ${targetPath}`);
      }

      // 🎯 执行安装后钩子（包含自动生成）
      await this.ctx.service.templateHooks.executeHook('after:install', createdTheme, {
        packageData,
        themePath,
        autoGenerate: true,
        installType: 'local',
      });

      // 7. 清除模板缓存
      await this._clearTemplateCache();

      this.ctx.logger.info(`Theme "${slug}" installed successfully`);

      return {
        success: true,
        theme: createdTheme,
        message: this.ctx.__('template.message.installSuccessWithName', [name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to install theme "${slug}":`, error);

      // 清理已创建的文件
      await this._cleanupThemeFiles(slug);

      throw error;
    }
  }

  /**
   * 从远程安装主题
   * @param {Object} themePackage 主题包信息
   * @param {String} extractedPath 已解压的目录路径
   * @param {Object} options 额外选项
   * @return {Promise<Object>} 安装结果
   */
  async installFromRemote(themePackage, extractedPath, options = {}) {
    const { slug, name, version = '1.0.0' } = themePackage;

    try {
      // 1. 检查主题是否已存在
      const existingTheme = await this.ctx.service.template.findBySlug(slug);
      if (existingTheme) {
        throw new Error(this.ctx.__('template.error.exists', [slug]));
      }

      // 2. 处理可能的嵌套目录并验证主题结构
      extractedPath = await this._handleNestedDirectory(extractedPath, slug);
      await this._validateThemeStructure(extractedPath);

      // 3. 读取主题配置文件
      const themeConfig = await this._readThemeConfig(extractedPath, themePackage);

      // 提取配置字段到 config 对象中
      const { layouts, templates, components, supports, customOptions, ...otherConfig } = themeConfig;

      const theme = {
        ...otherConfig, // 其他配置（assets, settings, colors 等）
        ...themePackage, // 基本信息（会覆盖 themeConfig 中的同名字段）
        slug,
        name,
        version,
        installed: true,
        active: false,
        marketId: options.marketId,
        screenshot: options.screenshot || themeConfig.screenshot,
        config: {
          ...themePackage.config, // 保留传入的 config
          layouts, // 从 themeConfig 提取
          templates,
          components,
          supports,
          customOptions,
        },
        stats: {
          downloadCount: 0,
          rating: 0,
          reviewCount: 0,
        },
        createBy: this.ctx.session.adminUserInfo?.id || 'system',
      };

      // 🎯 执行安装前钩子
      await this.ctx.service.templateHooks.executeHook('before:install', theme, {
        extractedPath,
        autoGenerate: true,
        installType: 'remote',
        ...options,
      });

      // 4. 保存主题信息到数据库
      const createdTheme = await this.ctx.service.template.create(theme);

      // 5. 复制主题文件到正确位置（如果需要）
      const targetPath = path.join(this.app.baseDir, 'app', 'view', slug);

      // 规范化路径进行比较
      const normalizedExtractedPath = path.resolve(extractedPath);
      const normalizedTargetPath = path.resolve(targetPath);

      if (normalizedExtractedPath !== normalizedTargetPath) {
        await this._copyThemeDirectory(extractedPath, targetPath);
      } else {
        this.ctx.logger.debug(`Theme already in correct location: ${targetPath}`);
      }

      // 🎯 执行安装后钩子（包含自动生成）
      await this.ctx.service.templateHooks.executeHook('after:install', createdTheme, {
        extractedPath,
        themePath: targetPath,
        autoGenerate: true,
        installType: 'remote',
        ...options,
      });

      // 6. 清除模板缓存
      await this._clearTemplateCache();

      this.ctx.logger.info(`Remote theme "${slug}" installed successfully`);

      return {
        success: true,
        theme: createdTheme,
        message: this.ctx.__('template.message.remoteInstallSuccessWithName', [name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to install remote theme "${slug}":`, error);

      // 清理已创建的文件
      await this._cleanupThemeFiles(slug);

      throw error;
    }
  }

  /**
   * 卸载主题
   * @param {String} themeId 主题ID
   * @param {Boolean} removeFiles 是否删除文件
   * @return {Promise<Object>} 卸载结果
   */
  async uninstallTheme(themeId, removeFiles = true) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      // 检查是否为激活主题
      if (theme.active) {
        throw new Error(this.ctx.__('template.error.cannotUninstallActive', [theme.name]));
      }

      // 检查是否为系统模板
      if (theme.isSystemTemplate) {
        throw new Error(this.ctx.__('template.error.cannotUninstallSystem', [theme.name]));
      }

      const operatorId = this.ctx.session.adminUserInfo?.id;

      // 🎯 执行卸载前钩子
      await this.ctx.service.templateHooks.executeHook('before:uninstall', theme, {
        operatorId,
        removeFiles,
      });

      // 删除数据库记录
      await this.ctx.service.template.remove(themeId);

      // 删除主题文件
      if (removeFiles) {
        await this._cleanupThemeFiles(theme.slug);
      }

      // 🎯 执行卸载后钩子
      await this.ctx.service.templateHooks.executeHook('after:uninstall', theme, {
        operatorId,
        removeFiles,
      });

      // 清除模板缓存
      await this._clearTemplateCache();

      this.ctx.logger.info(`Theme "${theme.slug}" uninstalled successfully`);

      return {
        success: true,
        message: this.ctx.__('template.message.uninstallSuccessWithName', [theme.name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to uninstall theme "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 激活主题
   * @param {String} themeId 主题ID
   * @return {Promise<Object>} 激活结果
   */
  async activateTheme(themeId) {
    try {
      const operatorId = this.ctx.session.adminUserInfo?.id;
      const theme = await this.ctx.service.template.findById(themeId);

      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      // 🎯 执行激活前钩子
      await this.ctx.service.templateHooks.executeHook('before:activate', theme, {
        operatorId,
      });

      const activatedTheme = await this.ctx.service.template.activateTheme(themeId, operatorId);

      // 🎯 执行激活后钩子
      await this.ctx.service.templateHooks.executeHook('after:activate', activatedTheme, {
        operatorId,
      });

      // 清除模板缓存
      await this._clearTemplateCache();

      this.ctx.logger.info(`Theme "${activatedTheme.slug}" activated successfully`);

      return {
        success: true,
        theme: activatedTheme,
        message: this.ctx.__('template.message.activateSuccessWithName', [activatedTheme.name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to activate theme "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 停用主题
   * @param {String} themeId 主题ID
   * @return {Promise<Object>} 停用结果
   */
  async deactivateTheme(themeId) {
    try {
      const operatorId = this.ctx.session.adminUserInfo?.id;
      const deactivatedTheme = await this.ctx.service.template.deactivateTheme(themeId, operatorId);

      // 清除模板缓存
      await this._clearTemplateCache();

      this.ctx.logger.info(`Theme "${deactivatedTheme.slug}" deactivated successfully`);

      return {
        success: true,
        theme: deactivatedTheme,
        message: this.ctx.__('template.message.deactivateSuccessWithName', [deactivatedTheme.name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to deactivate theme "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 更新主题
   * @param {String} themeId 主题ID
   * @param {Object} updateData 更新数据
   * @return {Promise<Object>} 更新结果
   */
  async updateTheme(themeId, updateData) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      // 验证更新数据
      if (updateData.slug && updateData.slug !== theme.slug) {
        await this.ctx.service.template.checkSlugUnique(updateData.slug, themeId);
      }

      const operatorId = this.ctx.session.adminUserInfo?.id;

      // 🎯 执行更新前钩子
      await this.ctx.service.templateHooks.executeHook('before:update', theme, updateData, {
        operatorId,
        autoGenerate: true,
      });

      const updatedTheme = await this.ctx.service.template.update(themeId, {
        ...updateData,
        updateBy: operatorId,
      });

      // 🎯 执行更新后钩子
      await this.ctx.service.templateHooks.executeHook('after:update', updatedTheme, {
        operatorId,
        autoGenerate: true,
        originalTheme: theme,
      });

      // 如果更新了激活主题，清除缓存
      if (theme.active) {
        await this._clearTemplateCache();
      }

      return {
        success: true,
        theme: updatedTheme,
        message: this.ctx.__('template.message.updateSuccessWithName', [updatedTheme.name]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to update theme "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 检查主题完整性
   * @param {String} themeId 主题ID
   * @return {Promise<Object>} 检查结果
   */
  async checkThemeIntegrity(themeId) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      // 检查主题文件
      const fileCheck = await this.ctx.service.template.checkThemeFiles(theme.slug);

      // 检查主题配置
      const configCheck = this._validateThemeConfig(theme.config);

      // 获取主题模板文件列表
      const templates = await this.ctx.service.template.getThemeTemplates(theme.slug);

      const result = {
        theme: theme.name,
        slug: theme.slug,
        files: fileCheck,
        config: configCheck,
        templates,
        overall: fileCheck.isValid && configCheck.isValid,
      };

      return result;
    } catch (error) {
      this.ctx.logger.error(`Failed to check theme integrity "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 导出主题
   * @param {String} themeId 主题ID
   * @return {Promise<Object>} 导出结果
   */
  async exportTheme(themeId) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);

      if (!fs.existsSync(themePath)) {
        throw new Error(this.ctx.__('template.error.themeFileMissing', [theme.slug]));
      }

      // 创建ZIP包
      const zip = new AdmZip();

      // 添加主题配置文件
      const themeInfo = {
        name: theme.name,
        slug: theme.slug,
        version: theme.version,
        author: theme.author,
        description: theme.description,
        config: theme.config,
        exportTime: new Date().toISOString(),
      };

      zip.addFile('theme.json', Buffer.from(JSON.stringify(themeInfo, null, 2)));

      // 递归添加主题文件
      this._addDirectoryToZip(zip, themePath, '');

      const zipBuffer = zip.toBuffer();
      const fileName = `${theme.slug}-${theme.version}-${Date.now()}.zip`;

      return {
        success: true,
        fileName,
        buffer: zipBuffer,
        size: zipBuffer.length,
        theme: theme.name,
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to export theme "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 自动生成主题模板布局变体
   * @param {String} themeId 主题ID
   * @param {Object} options 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generateThemeLayouts(themeId, options = {}) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
      if (!fs.existsSync(themePath)) {
        throw new Error(this.ctx.__('template.error.themeFileMissing', [theme.slug]));
      }

      // 创建模板生成器实例
      const generator = new TemplateLayoutGenerator({
        baseDir: this.app.baseDir,
        verbose: options.verbose || false,
      });

      // 生成配置
      const generateOptions = {
        overwrite: options.overwrite || false,
        contentTypes: options.contentTypes || this._getDefaultContentTypes(),
        ...options,
      };

      // 执行生成
      const generatedCount = await generator.generateThemeLayoutVariants(theme.slug, generateOptions);

      this.ctx.logger.info(`Generated ${generatedCount} template variants for theme "${theme.slug}"`);

      return {
        success: true,
        theme: theme.slug,
        generatedCount,
        message: this.ctx.__('template.message.generatedVariants', [theme.name, generatedCount]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to generate theme layouts for "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 批量生成主题模板
   * @param {String} themeId 主题ID
   * @param {Object} options 批量生成选项
   * @return {Promise<Object>} 生成结果
   */
  async batchGenerateTemplates(themeId, options = {}) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      const results = {
        layouts: 0,
        templates: 0,
        components: 0,
        errors: [],
      };

      const generator = new TemplateLayoutGenerator({
        baseDir: this.app.baseDir,
        verbose: options.verbose || false,
      });

      // 1. 生成缺失的布局文件
      if (options.generateLayouts !== false) {
        const layoutResult = await this._generateMissingLayouts(generator, theme, options);
        results.layouts = layoutResult.count;
        results.errors.push(...layoutResult.errors);
      }

      // 2. 生成模板变体
      if (options.generateTemplates !== false) {
        const templateResult = await this._generateTemplateVariants(generator, theme, options);
        results.templates = templateResult.count;
        results.errors.push(...templateResult.errors);
      }

      // 3. 生成基础组件（可选）
      if (options.generateComponents === true) {
        const componentResult = await this._generateBasicComponents(generator, theme, options);
        results.components = componentResult.count;
        results.errors.push(...componentResult.errors);
      }

      const total = results.layouts + results.templates + results.components;

      return {
        success: results.errors.length === 0,
        theme: theme.slug,
        results,
        total,
        message: this.ctx.__('template.message.batchGenerateSummary', [total, results.errors.length]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to batch generate templates for "${themeId}":`, error);
      throw error;
    }
  }

  /**
   * 检查并生成缺失的模板文件
   * @param {String} themeId 主题ID
   * @param {Object} options 检查选项
   * @return {Promise<Object>} 检查和生成结果
   */
  async checkAndGenerateMissingTemplates(themeId, options = {}) {
    try {
      const theme = await this.ctx.service.template.findById(themeId);
      if (!theme) {
        throw new Error(this.ctx.__('template.error.notFoundWithId', [themeId]));
      }

      const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
      const missingFiles = await this._analyzeThemeCompleteness(themePath, theme.config);

      if (missingFiles.length === 0) {
        return {
          success: true,
          theme: theme.slug,
          missing: [],
          generated: 0,
          message: this.ctx.__('template.message.themeFilesComplete'),
        };
      }

      // 自动生成缺失文件
      const generator = new TemplateLayoutGenerator({
        baseDir: this.app.baseDir,
        verbose: options.verbose || false,
      });

      let generatedCount = 0;
      const errors = [];

      for (const missingFile of missingFiles) {
        try {
          await this._generateSpecificFile(generator, theme, missingFile, options);
          generatedCount++;
        } catch (error) {
          errors.push(this.ctx.__('template.error.generateFileFailed', [missingFile.path, error.message]));
        }
      }

      return {
        success: errors.length === 0,
        theme: theme.slug,
        missing: missingFiles,
        generated: generatedCount,
        errors,
        message: this.ctx.__('template.message.generateMissingFiles', [generatedCount]),
      };
    } catch (error) {
      this.ctx.logger.error(`Failed to check missing templates for "${themeId}":`, error);
      throw error;
    }
  }

  // ===== 私有方法 =====

  /**
   * 解压主题包
   * @param {Buffer|String} packageData 包数据
   * @param {String} targetPath 目标路径
   * @private
   */
  async _extractThemePackage(packageData, targetPath) {
    try {
      // 确保目标目录存在
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      let zip;
      if (Buffer.isBuffer(packageData)) {
        zip = new AdmZip(packageData);
      } else if (typeof packageData === 'string' && fs.existsSync(packageData)) {
        zip = new AdmZip(packageData);
      } else {
        throw new Error('Invalid package data');
      }

      zip.extractAllTo(targetPath, true);
    } catch (error) {
      throw new Error(this.ctx.__('template.error.extractFailed', [error.message]));
    }
  }

  /**
   * 处理嵌套目录（如果 zip 文件内有同名目录）
   * @param {String} extractedPath 解压路径
   * @param {String} slug 主题标识
   * @return {Promise<String>} 处理后的路径
   * @private
   */
  async _handleNestedDirectory(extractedPath, slug) {
    try {
      // 读取解压目录的内容
      const items = fs.readdirSync(extractedPath);

      // 过滤掉系统文件和 __MACOSX 目录
      const validItems = items.filter(item => !item.startsWith('.') && !item.startsWith('__MACOSX'));

      // 如果只有一个目录，检查是否需要展开
      if (validItems.length === 1) {
        const itemPath = path.join(extractedPath, validItems[0]);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          // 检查内层目录是否包含主题文件
          const innerThemeJson = path.join(itemPath, 'theme.json');

          if (fs.existsSync(innerThemeJson)) {
            this.ctx.logger.info(`Detected nested directory structure, flattening: ${validItems[0]}`);

            // 将内层目录内容移到外层
            const innerItems = fs.readdirSync(itemPath);
            for (const innerItem of innerItems) {
              const src = path.join(itemPath, innerItem);
              const dest = path.join(extractedPath, innerItem);
              fs.renameSync(src, dest);
            }

            // 删除空的内层目录
            fs.rmdirSync(itemPath);

            this.ctx.logger.info('Flattened nested directory structure');
          }
        }
      }

      // 清理 __MACOSX 目录（如果存在）
      const macosxPath = path.join(extractedPath, '__MACOSX');
      if (fs.existsSync(macosxPath)) {
        fs.removeSync(macosxPath);
        this.ctx.logger.info('Removed __MACOSX directory');
      }

      return extractedPath;
    } catch (error) {
      this.ctx.logger.warn(`Failed to handle nested directory: ${error.message}`);
      return extractedPath;
    }
  }

  /**
   * 验证主题结构
   * @param {String} themePath 主题路径
   * @private
   */
  async _validateThemeStructure(themePath) {
    const requiredDirs = ['layouts', 'templates'];
    const requiredFiles = ['layouts/default.html', 'templates/index.html'];

    // 检查必需目录
    for (const dir of requiredDirs) {
      const dirPath = path.join(themePath, dir);
      if (!fs.existsSync(dirPath)) {
        throw new Error(`缺少必需目录: ${dir}`);
      }
    }

    // 检查必需文件
    for (const file of requiredFiles) {
      const filePath = path.join(themePath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必需文件: ${file}`);
      }
    }
  }

  /**
   * 读取主题配置文件
   * @param {String} themePath 主题路径
   * @param {Object} fallbackConfig 回退配置
   * @return {Promise<Object>} 主题配置
   * @private
   */
  async _readThemeConfig(themePath, fallbackConfig = {}) {
    const configPath = path.join(themePath, 'theme.json');

    // 默认配置（仅在配置文件不存在或缺少字段时使用）
    const defaultConfig = {
      layouts: ['default'],
      templates: ['index'],
      components: ['header', 'footer'],
      supports: ['responsive'],
      customOptions: {},
    };

    // 优先使用配置文件
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const fileConfig = JSON.parse(configContent);

        // 处理 theme.json 中的配置格式
        const normalizedConfig = this._normalizeThemeConfig(fileConfig);

        // 以配置文件为准，只对缺失的必需字段使用默认值
        const config = {
          ...defaultConfig, // 默认值（底层）
          ...fallbackConfig, // 传入的回退配置
          ...normalizedConfig, // 配置文件（最高优先级）
        };

        this.ctx.logger.debug(`Theme config loaded from file: ${configPath}`);
        return config;
      } catch (error) {
        this.ctx.logger.warn(`Failed to read theme config file, using defaults: ${error.message}`);
      }
    } else {
      this.ctx.logger.debug(`Theme config file not found: ${configPath}, using defaults`);
    }

    // 配置文件不存在或读取失败时，使用默认配置
    return {
      ...defaultConfig,
      ...fallbackConfig,
    };
  }

  /**
   * 规范化主题配置格式
   * 将对象格式转换为数组格式（兼容不同的 theme.json 格式）
   * @param {Object} fileConfig 从文件读取的配置
   * @return {Object} 规范化后的配置
   * @private
   */
  _normalizeThemeConfig(fileConfig) {
    const normalized = { ...fileConfig };

    // 转换 layouts: { "default": "path" } => layouts: ["default"]
    if (normalized.layouts && typeof normalized.layouts === 'object' && !Array.isArray(normalized.layouts)) {
      normalized.layouts = Object.keys(normalized.layouts);
    }

    // 转换 templates: { "index": "path" } => templates: ["index"]
    if (normalized.templates && typeof normalized.templates === 'object' && !Array.isArray(normalized.templates)) {
      normalized.templates = Object.keys(normalized.templates);
    }

    // 转换 components/partials: { "header": "path" } => components: ["header"]
    if (normalized.components && typeof normalized.components === 'object' && !Array.isArray(normalized.components)) {
      normalized.components = Object.keys(normalized.components);
    }

    // 支持 partials 字段（作为 components 的别名）
    if (normalized.partials && !normalized.components) {
      if (typeof normalized.partials === 'object' && !Array.isArray(normalized.partials)) {
        normalized.components = Object.keys(normalized.partials);
      } else {
        normalized.components = normalized.partials;
      }
    }

    return normalized;
  }

  /**
   * 验证主题配置
   * @param {Object} config 主题配置
   * @return {Object} 验证结果
   * @private
   */
  _validateThemeConfig(config) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!config) {
      result.isValid = false;
      result.errors.push('主题配置为空');
      return result;
    }

    // 检查必需字段
    const requiredFields = ['layouts', 'templates'];
    for (const field of requiredFields) {
      if (!config[field] || !Array.isArray(config[field]) || config[field].length === 0) {
        result.isValid = false;
        result.errors.push(`缺少必需配置: ${field}`);
      }
    }

    // 检查布局配置
    if (config.layouts && !config.layouts.includes('default')) {
      result.warnings.push('建议包含 default 布局');
    }

    // 检查模板配置
    if (config.templates && !config.templates.includes('index')) {
      result.warnings.push('建议包含 index 模板');
    }

    return result;
  }

  /**
   * 清理主题文件
   * @param {String} slug 主题标识符
   * @private
   */
  async _cleanupThemeFiles(slug) {
    try {
      const themePath = path.join(this.app.baseDir, 'app', 'view', slug);
      if (fs.existsSync(themePath)) {
        // 使用 fs.rmSync 代替 rimraf (Node.js 14.14.0+)
        fs.rmSync(themePath, { recursive: true, force: true });
        this.ctx.logger.info(`Cleaned up theme files: ${themePath}`);
      }
    } catch (error) {
      this.ctx.logger.warn(`Failed to cleanup theme files for "${slug}": ${error.message}`);
    }
  }

  /**
   * 清除模板缓存
   * @private
   */
  async _clearTemplateCache() {
    try {
      // 清除 TemplateResolver 缓存
      if (this.ctx.service.templateResolver) {
        await this.ctx.service.templateResolver.clearCache();
      }

      // 清除应用级缓存
      const cacheKeys = [
        `${this.app.config.session_secret}_active_theme`,
        `${this.app.config.session_secret}_default_temp`,
      ];

      for (const key of cacheKeys) {
        await this.app.cache.delete(key);
      }
    } catch (error) {
      this.ctx.logger.warn(`Failed to clear template cache: ${error.message}`);
    }
  }

  /**
   * 模板安装后处理（自动生成）
   * @param {Object} theme 主题对象
   * @param {String} themePath 主题路径
   * @private
   */
  async _postInstallProcessing(theme, themePath) {
    try {
      // 获取自动生成配置
      const autoGenConfig = this._getAutoGenerationConfig();

      if (!autoGenConfig.enabled) {
        this.ctx.logger.info('Auto-generation disabled, skipping post-install processing');
        return;
      }

      this.ctx.logger.info(`Starting post-install processing for theme "${theme.slug}"`);

      const generator = new TemplateLayoutGenerator({
        baseDir: this.app.baseDir,
        verbose: autoGenConfig.verbose || false,
      });

      // 1. 生成缺失的基础布局
      if (autoGenConfig.generateLayouts) {
        await this._generateMissingLayouts(generator, theme, autoGenConfig);
      }

      // 2. 生成模板变体（仅缺失的）
      if (autoGenConfig.generateTemplates) {
        const options = {
          ...autoGenConfig,
          overwrite: false, // 安装时不覆盖现有文件
          onlyMissing: true,
        };
        await this._generateTemplateVariants(generator, theme, options);
      }

      // 3. 生成基础组件（可选）
      if (autoGenConfig.generateComponents) {
        await this._generateBasicComponents(generator, theme, autoGenConfig);
      }

      this.ctx.logger.info(`Post-install processing completed for theme "${theme.slug}"`);
    } catch (error) {
      // 后处理失败不应该阻止安装过程
      this.ctx.logger.warn(this.ctx.__('template.error.postInstallFailed', [`${theme.slug}: ${error.message}`]));
    }
  }

  /**
   * 生成缺失的布局文件
   * @param {TemplateLayoutGenerator} generator 生成器实例
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _generateMissingLayouts(generator, theme, options = {}) {
    const result = { count: 0, errors: [] };

    try {
      const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
      const layoutsDir = path.join(themePath, 'layouts');

      // 确保layouts目录存在
      if (!fs.existsSync(layoutsDir)) {
        fs.mkdirSync(layoutsDir, { recursive: true });
      }

      // 获取应生成的布局列表
      const requiredLayouts = this._getRequiredLayouts(theme.config);

      for (const layoutName of requiredLayouts) {
        const layoutPath = path.join(layoutsDir, `${layoutName}.html`);

        if (!fs.existsSync(layoutPath) || options.overwrite) {
          try {
            await generator.generateLayout(themePath, layoutName);
            result.count++;
          } catch (error) {
            result.errors.push(`生成布局 ${layoutName} 失败: ${error.message}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`生成布局文件失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 生成模板变体
   * @param {TemplateLayoutGenerator} generator 生成器实例
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _generateTemplateVariants(generator, theme, options = {}) {
    const result = { count: 0, errors: [] };

    try {
      const contentTypes = options.contentTypes || this._getDefaultContentTypes();
      const layouts = this._getRequiredLayouts(theme.config);

      for (const contentType of contentTypes) {
        for (const layout of layouts) {
          if (layout === 'default') continue; // 默认布局不需要后缀

          try {
            const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
            const generated = await generator.generateTemplateVariant(themePath, contentType, layout, {
              overwrite: options.overwrite || false,
            });

            if (generated) {
              result.count++;
            }
          } catch (error) {
            result.errors.push(
              this.ctx.__('template.error.generateTemplateFailed', [contentType, layout, error.message])
            );
          }
        }
      }
    } catch (error) {
      result.errors.push(this.ctx.__('template.error.generateVariantsFailed', [error.message]));
    }

    return result;
  }

  /**
   * 生成基础组件
   * @param {TemplateLayoutGenerator} generator 生成器实例
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _generateBasicComponents(generator, theme, options = {}) {
    const result = { count: 0, errors: [] };

    try {
      const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
      const componentsDir = path.join(themePath, 'components');

      // 确保components目录存在
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }

      const basicComponents = ['header', 'footer', 'nav', 'breadcrumb', 'pagination'];

      for (const component of basicComponents) {
        const componentPath = path.join(componentsDir, `${component}.html`);

        if (!fs.existsSync(componentPath) || options.overwrite) {
          try {
            const componentContent = this._generateComponentContent(component);
            fs.writeFileSync(componentPath, componentContent);
            result.count++;
          } catch (error) {
            result.errors.push(`生成组件 ${component} 失败: ${error.message}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`生成基础组件失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 分析主题完整性
   * @param {String} themePath 主题路径
   * @param {Object} config 主题配置
   * @private
   */
  async _analyzeThemeCompleteness(themePath, config) {
    const missingFiles = [];

    try {
      // 检查布局文件
      const layouts = this._getRequiredLayouts(config);
      for (const layout of layouts) {
        const layoutPath = path.join(themePath, 'layouts', `${layout}.html`);
        if (!fs.existsSync(layoutPath)) {
          missingFiles.push({
            type: 'layout',
            name: layout,
            path: `layouts/${layout}.html`,
            required: layout === 'default',
          });
        }
      }

      // 检查模板文件
      const contentTypes = this._getDefaultContentTypes();
      for (const contentType of contentTypes) {
        const templatePath = path.join(themePath, 'templates', `${contentType}.html`);
        if (!fs.existsSync(templatePath)) {
          missingFiles.push({
            type: 'template',
            name: contentType,
            path: `templates/${contentType}.html`,
            required: contentType === 'index',
          });
        }
      }

      // 检查组件文件（可选）
      const components = config.components || [];
      for (const component of components) {
        const componentPath = path.join(themePath, 'components', `${component}.html`);
        if (!fs.existsSync(componentPath)) {
          missingFiles.push({
            type: 'component',
            name: component,
            path: `components/${component}.html`,
            required: false,
          });
        }
      }
    } catch (error) {
      this.ctx.logger.warn(`Failed to analyze theme completeness: ${error.message}`);
    }

    return missingFiles;
  }

  /**
   * 生成特定文件
   * @param {TemplateLayoutGenerator} generator 生成器实例
   * @param {Object} theme 主题对象
   * @param {Object} fileSpec 文件规格
   * @param {Object} options 选项
   * @private
   */
  async _generateSpecificFile(generator, theme, fileSpec, options = {}) {
    const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);

    switch (fileSpec.type) {
      case 'layout': {
        await generator.generateLayout(themePath, fileSpec.name);
        break;
      }

      case 'template': {
        // 为每个布局生成模板变体
        const layouts = this._getRequiredLayouts(theme.config);
        for (const layout of layouts) {
          if (layout !== 'default') {
            await generator.generateTemplateVariant(themePath, fileSpec.name, layout, options);
          }
        }
        break;
      }

      case 'component': {
        const componentPath = path.join(themePath, 'components', `${fileSpec.name}.html`);
        const componentContent = this._generateComponentContent(fileSpec.name);
        fs.writeFileSync(componentPath, componentContent);
        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * 获取自动生成配置
   * @private
   */
  _getAutoGenerationConfig() {
    const config = this.app.config.templateAutoGeneration || {};

    return {
      enabled: config.enabled !== false, // 默认启用
      generateLayouts: config.generateLayouts !== false,
      generateTemplates: config.generateTemplates !== false,
      generateComponents: config.generateComponents || false,
      verbose: config.verbose || false,
      contentTypes: config.contentTypes || this._getDefaultContentTypes(),
      ...config,
    };
  }

  /**
   * 获取默认内容类型
   * @private
   */
  _getDefaultContentTypes() {
    return ['index', 'category', 'post', 'search', 'tag', 'author', 'archive'];
  }

  /**
   * 获取必需的布局列表
   * @param {Object} config 主题配置
   * @private
   */
  _getRequiredLayouts(config) {
    const defaultLayouts = ['default', 'sidebar', 'wide'];

    if (config && config.layouts && Array.isArray(config.layouts)) {
      return [...new Set([...defaultLayouts, ...config.layouts])];
    }

    return defaultLayouts;
  }

  /**
   * 生成组件内容
   * @param {String} componentName 组件名称
   * @private
   */
  _generateComponentContent(componentName) {
    const componentTemplates = {
      header: `<header class="site-header">
  <div class="container">
    <h1 class="site-title">
      <a href="/">{{ siteDynamic.title || 'DoraCMS' }}</a>
    </h1>
    <nav class="main-nav">
      <a href="/">首页</a>
      <a href="/category">分类</a>
      <a href="/search">搜索</a>
    </nav>
  </div>
</header>`,

      footer: `<footer class="site-footer">
  <div class="container">
    <p>&copy; {{ "now" | date("YYYY") }} {{ siteDynamic.title || 'DoraCMS' }}. All rights reserved.</p>
    <div class="footer-links">
      <a href="/about">关于我们</a>
      <a href="/contact">联系我们</a>
      <a href="/privacy">隐私政策</a>
    </div>
  </div>
</footer>`,

      nav: `<nav class="navigation">
  <ul class="nav-list">
    <li><a href="/" class="{{ 'active' if currentPath === '/' }}">首页</a></li>
    <li><a href="/category" class="{{ 'active' if currentPath.startsWith('/category') }}">分类</a></li>
    <li><a href="/search" class="{{ 'active' if currentPath === '/search' }}">搜索</a></li>
  </ul>
</nav>`,

      breadcrumb: `<nav class="breadcrumb">
  <ol class="breadcrumb-list">
    <li><a href="/">首页</a></li>
    {% if category %}
      <li><a href="/category/{{ category.id }}">{{ category.name }}</a></li>
    {% endif %}
    {% if content %}
      <li class="current">{{ content.title }}</li>
    {% endif %}
  </ol>
</nav>`,

      pagination: `{% if pagination and pagination.pages > 1 %}
<nav class="pagination">
  {% if pagination.prev %}
    <a href="?page={{ pagination.prev }}" class="pagination-prev">上一页</a>
  {% endif %}
  
  {% for page in pagination.pageRange %}
    {% if page === pagination.current %}
      <span class="pagination-current">{{ page }}</span>
    {% else %}
      <a href="?page={{ page }}" class="pagination-page">{{ page }}</a>
    {% endif %}
  {% endfor %}
  
  {% if pagination.next %}
    <a href="?page={{ pagination.next }}" class="pagination-next">下一页</a>
  {% endif %}
</nav>
{% endif %}`,
    };

    return (
      componentTemplates[componentName] ||
      `<!-- ${componentName} 组件 -->
<div class="${componentName}-component">
  <p>这是 ${componentName} 组件的默认内容。</p>
</div>`
    );
  }

  /**
   * 复制主题目录
   * @param {String} sourcePath 源路径
   * @param {String} targetPath 目标路径
   * @private
   */
  async _copyThemeDirectory(sourcePath, targetPath) {
    const fs = require('fs-extra');

    try {
      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetPath));

      // 复制整个目录
      await fs.copy(sourcePath, targetPath, {
        overwrite: true,
        filter: src => {
          // 过滤掉不需要的文件
          const basename = path.basename(src);
          return !basename.startsWith('.') && basename !== 'node_modules' && basename !== '.git';
        },
      });

      this.ctx.logger.debug(`Copied theme directory from ${sourcePath} to ${targetPath}`);
    } catch (error) {
      this.ctx.logger.error(`Failed to copy theme directory: ${error.message}`);
      throw new Error(`复制主题目录失败: ${error.message}`);
    }
  }

  /**
   * 递归添加目录到ZIP包
   * @param {AdmZip} zip ZIP对象
   * @param {String} dirPath 目录路径
   * @param {String} zipPath ZIP内路径
   * @private
   */
  _addDirectoryToZip(zip, dirPath, zipPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemZipPath = zipPath ? `${zipPath}/${item}` : item;

      if (fs.statSync(itemPath).isDirectory()) {
        this._addDirectoryToZip(zip, itemPath, itemZipPath);
      } else {
        zip.addLocalFile(itemPath, zipPath, item);
      }
    }
  }
}

module.exports = TemplateManagerService;
