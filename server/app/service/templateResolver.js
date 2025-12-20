/**
 * Template Resolver Service
 * 模板解析引擎 - 负责模板文件解析和路径解析
 * 基于 nunjucks 模板引擎的智能模板解析器
 */
'use strict';

const Service = require('egg').Service;
const path = require('path');
const fs = require('fs');

class TemplateResolverService extends Service {
  constructor(ctx) {
    super(ctx);
    this.activeTheme = null;
    this.templateCache = new Map();
  }

  /**
   * 获取当前激活的主题
   * @return {Promise<Object|null>} 激活的主题
   */
  async getActiveTheme() {
    if (!this.activeTheme) {
      // 优先从缓存获取
      const cacheKey = `${this.app.config.session_secret}_active_theme`;
      this.activeTheme = await this.app.cache.get(cacheKey);

      if (!this.activeTheme) {
        // 从数据库获取
        this.activeTheme = await this.ctx.service.template.getActiveTheme();

        if (this.activeTheme) {
          // 缓存1小时
          this.ctx.helper.setMemoryCache(cacheKey, this.activeTheme, 1000 * 60 * 60);
        }
      }
    }

    return this.activeTheme;
  }

  /**
   * 解析模板文件路径（增强版 - 支持动态布局配置）
   * @param {Object} category 内容分类对象
   * @param {String} contentType 内容类型 (list|post|search|archive)
   * @param {String} layoutOverride 运行时布局覆盖
   * @return {Promise<Object>} 模板配置对象
   */
  async resolveTemplate(category, contentType = 'list', layoutOverride = null) {
    const theme = await this.getActiveTheme();

    if (!theme) {
      throw new Error('No active theme found');
    }

    const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);

    // 获取配置的布局（支持运行时覆盖）
    const configuredLayout = layoutOverride || this._getConfiguredLayout(category, theme);

    // 构建增强的模板解析规则，支持动态布局配置
    const resolutionRules = this._buildEnhancedResolutionRules(theme, category, contentType, configuredLayout);

    // 查找第一个存在的模板文件
    for (const rule of resolutionRules) {
      if (fs.existsSync(rule.templatePath)) {
        return {
          template: rule.template,
          layout: rule.layout,
          theme: theme.slug,
          templatePath: rule.templatePath,
          category: category ? category.id : null,
          contentType,
          renderStrategy: rule.strategy || 'direct', // 添加渲染策略
        };
      }
    }

    throw new Error(
      `No template found for category ${category ? category.id : 'unknown'} with content type ${contentType}`
    );
  }

  /**
   * 获取配置的布局名称
   * @param {Object} category 分类对象
   * @param {Object} theme 主题对象
   * @return {String} 布局名称
   * @private
   */
  _getConfiguredLayout(category, theme) {
    // 1. 分类级别配置（最高优先级）
    if (category?.themeConfig?.layout) {
      return category.themeConfig.layout;
    }

    // 2. 主题级别配置
    if (theme.config?.layouts?.length > 0) {
      return theme.config.layouts[0];
    }

    // 3. 默认布局
    return 'default';
  }

  /**
   * 构建增强的模板解析规则 - 支持动态布局配置
   * @param {Object} theme 主题对象
   * @param {Object} category 分类对象
   * @param {String} contentType 内容类型
   * @param {String} layout 布局名称
   * @return {Array} 解析规则数组（按优先级排序）
   * @private
   */
  _buildEnhancedResolutionRules(theme, category, contentType, layout) {
    const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
    const rules = [];

    if (category) {
      // 1. 分类+内容类型+布局 特定模板（最高优先级）
      rules.push({
        templatePath: path.join(themePath, 'templates', `category-${category.id}-${contentType}-${layout}.html`),
        template: `${theme.slug}/templates/category-${category.id}-${contentType}-${layout}.html`,
        strategy: 'direct', // 直接渲染，已包含布局
        layout,
        priority: 10,
      });

      // 2. 分类+布局 特定模板
      rules.push({
        templatePath: path.join(themePath, 'templates', `category-${category.id}-${layout}.html`),
        template: `${theme.slug}/templates/category-${category.id}-${layout}.html`,
        strategy: 'direct',
        layout,
        priority: 9,
      });

      // 3. 分类+内容类型 模板 + 动态布局注入
      rules.push({
        templatePath: path.join(themePath, 'templates', `category-${category.id}-${contentType}.html`),
        template: `${theme.slug}/templates/category-${category.id}-${contentType}.html`,
        strategy: 'inject', // 运行时注入布局
        layout,
        priority: 8,
      });

      // 4. 分类特定模板 + 动态布局注入
      rules.push({
        templatePath: path.join(themePath, 'templates', `category-${category.id}.html`),
        template: `${theme.slug}/templates/category-${category.id}.html`,
        strategy: 'inject',
        layout,
        priority: 7,
      });

      // 5. 分类类型+内容类型+布局
      if (category.type) {
        rules.push({
          templatePath: path.join(themePath, 'templates', `category-${category.type}-${contentType}-${layout}.html`),
          template: `${theme.slug}/templates/category-${category.type}-${contentType}-${layout}.html`,
          strategy: 'direct',
          layout,
          priority: 6,
        });
      }

      // 6. 父级分类支持
      if (category.parentId && category.parentId !== '0') {
        rules.push({
          templatePath: path.join(
            themePath,
            'templates',
            `category-${category.parentId}-${contentType}-${layout}.html`
          ),
          template: `${theme.slug}/templates/category-${category.parentId}-${contentType}-${layout}.html`,
          strategy: 'direct',
          layout,
          priority: 5,
        });
      }
    }

    // 7. 内容类型+布局 特定模板
    rules.push({
      templatePath: path.join(themePath, 'templates', `${contentType}-${layout}.html`),
      template: `${theme.slug}/templates/${contentType}-${layout}.html`,
      strategy: 'direct',
      layout,
      priority: 4,
    });

    // 8. 内容类型模板 + 动态布局注入
    rules.push({
      templatePath: path.join(themePath, 'templates', `${contentType}.html`),
      template: `${theme.slug}/templates/${contentType}.html`,
      strategy: 'inject',
      layout,
      priority: 3,
    });

    // 9. 通用模板+布局组合
    const genericTemplates = ['index', 'default', 'main'];
    genericTemplates.forEach((template, index) => {
      // 带布局的通用模板
      rules.push({
        templatePath: path.join(themePath, 'templates', `${template}-${layout}.html`),
        template: `${theme.slug}/templates/${template}-${layout}.html`,
        strategy: 'direct',
        layout,
        priority: 2 - index * 0.1,
      });

      // 通用模板 + 动态布局注入
      rules.push({
        templatePath: path.join(themePath, 'templates', `${template}.html`),
        template: `${theme.slug}/templates/${template}.html`,
        strategy: 'inject',
        layout,
        priority: 1 - index * 0.1,
      });
    });

    // 10. 最终回退 - 直接使用布局文件
    rules.push({
      templatePath: path.join(themePath, 'layouts', `${layout}.html`),
      template: `${theme.slug}/layouts/${layout}.html`,
      strategy: 'layout-only',
      layout,
      priority: 0,
    });

    // 按优先级排序
    return rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 构建模板解析规则（保留原有方法以向后兼容）
   * @param {Object} theme 主题对象
   * @param {Object} category 分类对象
   * @param {String} contentType 内容类型
   * @return {Array} 模板路径数组（按优先级排序）
   * @private
   */
  _buildResolutionRules(theme, category, contentType) {
    const themePath = path.join(this.app.baseDir, 'app', 'view', theme.slug);
    const rules = [];

    if (category) {
      // 1. 分类特定模板 - 最高优先级
      rules.push(
        path.join(themePath, 'templates', `category-${category.id}-${contentType}.html`),
        path.join(themePath, 'templates', `category-${category.id}.html`),
        path.join(themePath, 'templates', `category-${category.type}-${contentType}.html`),
        path.join(themePath, 'templates', `category-${category.type}.html`)
      );

      // 2. 分类层级模板 - 支持父级分类模板继承
      if (category.parentId && category.parentId !== '0') {
        rules.push(
          path.join(themePath, 'templates', `category-${category.parentId}-${contentType}.html`),
          path.join(themePath, 'templates', `category-${category.parentId}.html`)
        );
      }
    }

    // 3. 内容类型特定模板
    rules.push(path.join(themePath, 'templates', `${contentType}.html`));

    // 4. 通用模板
    const genericTemplates = ['index', 'default', 'main'];
    genericTemplates.forEach(template => {
      rules.push(path.join(themePath, 'templates', `${template}.html`));
    });

    // 5. 最终回退 - 使用布局作为模板
    rules.push(path.join(themePath, 'layouts', 'default.html'));

    return rules;
  }

  /**
   * 解析布局文件
   * @param {Object} category 分类对象
   * @param {Object} theme 主题对象
   * @return {String} 布局文件路径
   * @private
   */
  _resolveLayout(category, theme) {
    let layoutName = 'default';

    // 1. 从分类配置中获取布局
    if (category && category.themeConfig && category.themeConfig.layout) {
      layoutName = category.themeConfig.layout;
    }

    // 2. 从主题配置中获取默认布局
    else if (theme.config && theme.config.layouts && theme.config.layouts.length > 0) {
      layoutName = theme.config.layouts[0];
    }

    return this._getRelativeTemplatePath(
      path.join(this.app.baseDir, 'app', 'view', theme.slug, 'layouts', `${layoutName}.html`)
    );
  }

  /**
   * 获取相对模板路径
   * @param {String} absolutePath 绝对路径
   * @return {String} 相对路径
   * @private
   */
  _getRelativeTemplatePath(absolutePath) {
    const viewPath = path.join(this.app.baseDir, 'app', 'view');
    return path.relative(viewPath, absolutePath).replace(/\\/g, '/');
  }

  /**
   * 获取模板数据
   * @param {Object} category 分类对象
   * @param {Object} content 内容对象
   * @param {Object} extraData 额外数据
   * @return {Promise<Object>} 模板数据
   */
  async getTemplateData(category, content = null, extraData = {}) {
    const theme = await this.getActiveTheme();

    if (!theme) {
      throw new Error('No active theme found');
    }

    // 基础模板数据
    const templateData = {
      // 主题信息
      theme: {
        name: theme.name,
        slug: theme.slug,
        version: theme.version,
        author: theme.author,
        config: theme.config || {},
      },

      // 分类信息
      category: category
        ? {
            ...category,
            themeConfig: category.themeConfig || {},
          }
        : null,

      // 内容信息
      content,

      // 组件信息
      components: await this._getAvailableComponents(theme),

      // 站点配置
      // site: await this._getSiteConfig(),

      // 用户信息
      member: this.ctx.session.user || null,
      logined: !!this.ctx.session.user,
      admin: this.ctx.session.adminUserInfo || null,

      // 请求信息
      request: {
        url: this.ctx.request.url,
        path: this.ctx.request.path,
        query: this.ctx.request.query,
        userAgent: this.ctx.request.get('user-agent'),
      },

      // 额外数据
      ...extraData,
    };

    return templateData;
  }

  /**
   * 获取可用组件列表
   * @param {Object} theme 主题对象
   * @return {Promise<Object>} 组件映射对象
   * @private
   */
  async _getAvailableComponents(theme) {
    const componentsPath = path.join(this.app.baseDir, 'app', 'view', theme.slug, 'components');
    const components = {};

    if (fs.existsSync(componentsPath)) {
      try {
        const files = fs.readdirSync(componentsPath);
        files.forEach(file => {
          if (file.endsWith('.html')) {
            const name = file.replace('.html', '');
            components[name] = this._getRelativeTemplatePath(path.join(componentsPath, file));
          }
        });
      } catch (error) {
        this.ctx.logger.warn(`Failed to read components directory: ${error.message}`);
      }
    }

    return components;
  }

  /**
   * 获取站点配置
   * @return {Promise<Object>} 站点配置
   * @private
   */
  async _getSiteConfig() {
    try {
      // 从缓存或数据库获取站点配置
      const cacheKey = `${this.app.config.session_secret}_site_config`;
      let siteConfig = await this.app.cache.get(cacheKey);

      if (!siteConfig) {
        // 🔥 优化：统一从数据库获取站点配置，避免重复逻辑
        const configs = await this.ctx.service.systemConfig.getConfigsAsObject();
        const configMap = {};
        // 🔥 修复：确保 configs 是数组格式
        const configsArray = Array.isArray(configs) ? configs : configs.docs || [];
        configsArray.forEach(config => {
          configMap[config.key] = config.value;
        });

        siteConfig = {
          name: configMap.siteName || this.app.config.siteName || 'DoraCMS',
          description: configMap.siteDescription || this.app.config.siteDescription || '',
          keywords: configMap.siteKeywords || this.app.config.siteKeywords || '',
          logo: configMap.siteLogo || this.app.config.siteLogo || '',
          url: configMap.siteUrl || this.app.config.siteUrl || '',
          // 保留原始配置数组以便模板使用
          configs: configs || [],
        };

        // 缓存30分钟
        this.ctx.helper.setMemoryCache(cacheKey, siteConfig, 1000 * 60 * 30);
      }

      return siteConfig;
    } catch (error) {
      this.ctx.logger.warn(`Failed to get site config: ${error.message}`);
      // 降级到默认配置
      return {
        name: this.app.config.siteName || 'DoraCMS',
        description: this.app.config.siteDescription || '',
        keywords: this.app.config.siteKeywords || '',
        logo: this.app.config.siteLogo || '',
        url: this.app.config.siteUrl || '',
        configs: [],
      };
    }
  }

  /**
   * 渲染模板（增强版 - 支持动态布局配置和多种渲染策略）
   * @param {Object} category 分类对象
   * @param {String} contentType 内容类型
   * @param {Object} content 内容对象
   * @param {Object} extraData 额外数据
   * @param {Object} options 渲染选项
   * @return {Promise<String>} 渲染后的HTML
   */
  async render(category, contentType = 'list', content = null, extraData = {}, options = {}) {
    try {
      // 解析模板配置（支持运行时布局覆盖）
      const templateConfig = await this.resolveTemplate(category, contentType, options.layoutOverride);

      // 获取模板数据
      const templateData = await this.getTemplateData(category, content, extraData);

      // 根据渲染策略选择渲染方式
      return await this._executeRenderStrategy(templateConfig, templateData);
    } catch (error) {
      this.ctx.logger.error(`Template render error: ${error.message}`, {
        // template: templateConfig?.template,
        category: category ? category.id : null,
        contentType,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 执行渲染策略 - 核心渲染逻辑
   * @param {Object} templateConfig 模板配置
   * @param {Object} templateData 模板数据
   * @return {Promise<String>} 渲染结果
   * @private
   */
  async _executeRenderStrategy(templateConfig, templateData) {
    const { renderStrategy, templatePath, layout } = templateConfig;

    switch (renderStrategy) {
      case 'direct':
        return await this._renderDirect(templateConfig, templateData);

      case 'inject':
        return await this._renderWithInjectedLayout(templateConfig, templateData);

      case 'layout-only':
        return await this._renderLayoutOnly(templateConfig, templateData);

      default:
        // 向后兼容：默认使用直接渲染
        return await this._renderDirect(templateConfig, templateData);
    }
  }

  /**
   * 直接渲染 - 模板已包含布局声明
   * @param {Object} templateConfig 模板配置
   * @param {Object} templateData 模板数据
   * @return {Promise<String>} 渲染结果
   * @private
   */
  async _renderDirect(templateConfig, templateData) {
    const templateContent = fs.readFileSync(templateConfig.templatePath, 'utf8');

    const html = await this.ctx.renderString(templateContent, templateData, {
      path: templateConfig.templatePath,
    });

    if (!html) {
      this.ctx.logger.warn('Template render returned empty result', {
        template: templateConfig.template,
        category: templateConfig.category,
        contentType: templateConfig.contentType,
      });
    }

    return html;
  }

  /**
   * 运行时布局注入渲染 - 核心创新
   * @param {Object} templateConfig 模板配置
   * @param {Object} templateData 模板数据
   * @return {Promise<String>} 渲染结果
   * @private
   */
  async _renderWithInjectedLayout(templateConfig, templateData) {
    const templateContent = fs.readFileSync(templateConfig.templatePath, 'utf8');

    // 检查模板是否已有布局声明
    if (this._hasLayoutDeclaration(templateContent)) {
      this.ctx.logger.debug('Template already has layout declaration, using direct render');
      return await this._renderDirect(templateConfig, templateData);
    }

    // 动态注入布局
    const layoutPath = this._resolveLayoutPath(templateConfig.layout);
    const wrappedTemplate = this._wrapTemplateWithLayout(templateContent, layoutPath);

    const html = await this.ctx.renderString(wrappedTemplate, templateData, {
      path: templateConfig.templatePath,
    });

    if (!html) {
      this.ctx.logger.warn('Template render with injected layout returned empty result', {
        template: templateConfig.template,
        layout: templateConfig.layout,
        category: templateConfig.category,
        contentType: templateConfig.contentType,
      });
    }

    return html;
  }

  /**
   * 仅布局渲染 - 当没有找到内容模板时的回退
   * @param {Object} templateConfig 模板配置
   * @param {Object} templateData 模板数据
   * @return {Promise<String>} 渲染结果
   * @private
   */
  async _renderLayoutOnly(templateConfig, templateData) {
    const layoutContent = fs.readFileSync(templateConfig.templatePath, 'utf8');

    // 生成默认内容
    const defaultContent = this._generateDefaultContent(templateConfig, templateData);

    // 将默认内容注入布局
    const wrappedTemplate = this._wrapContentWithLayout(defaultContent, layoutContent);

    const html = await this.ctx.renderString(wrappedTemplate, templateData, {
      path: templateConfig.templatePath,
    });

    return html;
  }

  /**
   * 检查模板是否包含布局声明
   * @param {String} templateContent 模板内容
   * @return {Boolean} 是否包含布局声明
   * @private
   */
  _hasLayoutDeclaration(templateContent) {
    const patterns = [
      /{% extends\s+[^%]+%}/, // Nunjucks extends
      /{{!<\s*[^}]+}}/, // Handlebars layout
      /<!--\s*layout:\s*[^>]+-->/, // HTML comment layout
      /@extends\s*\([^)]+\)/, // 自定义 extends 语法
    ];

    return patterns.some(pattern => pattern.test(templateContent));
  }

  /**
   * 用布局包装模板内容
   * @param {String} templateContent 模板内容
   * @param {String} layoutPath 布局路径
   * @return {String} 包装后的模板
   * @private
   */
  _wrapTemplateWithLayout(templateContent, layoutPath) {
    return `{% extends "${layoutPath}" %}
{% block content %}
${templateContent}
{% endblock %}`;
  }

  /**
   * 用布局包装纯内容
   * @param {String} content 内容
   * @param {String} layoutContent 布局内容
   * @return {String} 包装后的模板
   * @private
   */
  _wrapContentWithLayout(content, layoutContent) {
    // 如果布局包含 block，直接注入
    if (layoutContent.includes('{% block content %}')) {
      return layoutContent.replace(
        /{% block content %}.*?{% endblock %}/s,
        `{% block content %}${content}{% endblock %}`
      );
    }

    // 否则创建包装结构
    return `${layoutContent}
{% block content %}
${content}
{% endblock %}`;
  }

  /**
   * 生成默认内容
   * @param {Object} templateConfig 模板配置
   * @param {Object} templateData 模板数据
   * @return {String} 默认内容
   * @private
   */
  _generateDefaultContent(templateConfig, templateData) {
    const { contentType, category } = templateConfig;

    return `
<div class="default-content ${contentType}-page">
  <h1>${templateData.title || '页面标题'}</h1>
  <p>这是 ${contentType} 页面的默认内容。</p>
  ${category ? `<p>分类: ${category}</p>` : ''}
  <p>模板: ${templateConfig.template}</p>
  <p>布局: ${templateConfig.layout}</p>
</div>
    `;
  }

  /**
   * 解析布局路径
   * @param {String} layoutName 布局名称
   * @return {String} 布局路径
   * @private
   */
  _resolveLayoutPath(layoutName) {
    if (!layoutName || layoutName === 'default') {
      return '../layouts/default.html';
    }

    // 支持多种布局路径格式
    const layoutPaths = [
      `../layouts/${layoutName}.html`,
      `../layouts/${layoutName}/index.html`,
      `../themes/current/layouts/${layoutName}.html`,
    ];

    // 返回第一个存在的布局文件，或默认布局
    for (const layoutPath of layoutPaths) {
      try {
        const absolutePath = path.resolve(path.dirname(this.app.baseDir + '/app/view'), layoutPath);
        if (fs.existsSync(absolutePath)) {
          return layoutPath;
        }
      } catch (error) {
        // 忽略路径解析错误
      }
    }

    return '../layouts/default.html';
  }

  /**
   * 检查模板文件是否存在
   * @param {String} templatePath 模板路径
   * @return {Boolean} 是否存在
   */
  templateExists(templatePath) {
    const fullPath = path.join(this.app.baseDir, 'app', 'view', templatePath);
    return fs.existsSync(fullPath);
  }

  /**
   * 获取主题的所有模板文件
   * @param {String} themeSlug 主题标识符
   * @return {Promise<Object>} 模板文件信息
   */
  async getThemeTemplates(themeSlug = null) {
    const theme = themeSlug ? await this.ctx.service.template.findBySlug(themeSlug) : await this.getActiveTheme();

    if (!theme) {
      throw new Error(`Theme not found: ${themeSlug || 'active theme'}`);
    }

    return await this.ctx.service.template.getThemeTemplates(theme.slug);
  }

  /**
   * 清除模板缓存
   */
  async clearCache() {
    this.activeTheme = null;
    this.templateCache.clear();

    // 清除应用级缓存
    const cacheKeys = [
      `${this.app.config.session_secret}_active_theme`,
      `${this.app.config.session_secret}_site_config`,
    ];

    for (const key of cacheKeys) {
      await this.app.cache.delete(key);
    }
  }

  /**
   * 预热模板缓存
   * @return {Promise<void>}
   */
  async warmupCache() {
    try {
      await this.getActiveTheme();
      // await this._getSiteConfig();
      this.ctx.logger.info('Template cache warmed up successfully');
    } catch (error) {
      this.ctx.logger.error(`Failed to warmup template cache: ${error.message}`);
    }
  }
}

module.exports = TemplateResolverService;
