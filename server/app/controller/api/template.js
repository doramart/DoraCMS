/**
 * Template Controller - 前端API模板管理
 * 提供前端模板相关的接口
 */
'use strict';

const TemplateController = {
  /**
   * 获取当前激活的主题信息
   * @param ctx
   */
  async getActiveTheme(ctx) {
    const activeTheme = await ctx.service.template.getActiveTheme();

    if (!activeTheme) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.noActiveTheme') });
    }

    // 只返回前端需要的信息
    const themeInfo = {
      id: activeTheme.id,
      name: activeTheme.name,
      slug: activeTheme.slug,
      version: activeTheme.version,
      author: activeTheme.author,
      description: activeTheme.description,
      screenshot: activeTheme.screenshot,
      config: activeTheme.config || {},
    };

    ctx.helper.renderSuccess(ctx, { data: themeInfo });
  },

  /**
   * 获取主题列表（仅显示已安装且启用的主题）
   * @param ctx
   */
  async getThemes(ctx) {
    const filters = {
      status: { $eq: '1' },
      installed: { $eq: true },
    };

    const options = {
      filters,
      fields: ['id', 'name', 'slug', 'version', 'author', 'description', 'screenshot', 'active', 'stats'],
      sort: [
        { field: 'active', order: 'desc' },
        { field: 'stats.rating', order: 'desc' },
      ],
    };

    const result = await ctx.service.template.find({}, options);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 获取主题详情
   * @param ctx
   */
  async getThemeDetail(ctx) {
    const { slug } = ctx.params;

    const theme = await ctx.service.template.findBySlug(slug);

    if (!theme || theme.status !== '1' || !theme.installed) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.unavailable') });
    }

    // 获取主题模板文件列表
    const templates = await ctx.service.template.getThemeTemplates(theme.slug);

    const themeDetail = {
      id: theme.id,
      name: theme.name,
      slug: theme.slug,
      version: theme.version,
      author: theme.author,
      description: theme.description,
      screenshot: theme.screenshot,
      config: theme.config || {},
      stats: theme.stats || {},
      templates,
      active: theme.active,
    };

    ctx.helper.renderSuccess(ctx, { data: themeDetail });
  },

  /**
   * 获取主题配置（供模板渲染使用）
   * @param ctx
   */
  async getThemeConfig(ctx) {
    const { slug } = ctx.params;

    let theme;
    if (slug) {
      theme = await ctx.service.template.findBySlug(slug);
    } else {
      theme = await ctx.service.template.getActiveTheme();
    }

    if (!theme || theme.status !== '1' || !theme.installed) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.unavailable') });
    }

    // 返回主题配置信息
    const config = {
      theme: {
        name: theme.name,
        slug: theme.slug,
        version: theme.version,
        author: theme.author,
        config: theme.config || {},
      },
      layouts: theme.config?.layouts || ['default'],
      templates: theme.config?.templates || ['index'],
      components: theme.config?.components || ['header', 'footer'],
      supports: theme.config?.supports || ['responsive'],
    };

    ctx.helper.renderSuccess(ctx, { data: config });
  },

  /**
   * 获取主题统计信息（公开）
   * @param ctx
   */
  async getThemeStats(ctx) {
    const filters = {
      status: { $eq: '1' },
      installed: { $eq: true },
    };

    const stats = await ctx.service.template.getTemplateStats(filters);

    ctx.helper.renderSuccess(ctx, { data: stats });
  },

  /**
   * 增加主题下载次数
   * @param ctx
   */
  async incrementDownload(ctx) {
    const { id } = ctx.params;

    const theme = await ctx.service.template.findById(id);
    if (!theme || theme.status !== '1' || !theme.installed) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.unavailable') });
    }

    // 更新下载次数
    const currentStats = theme.stats || { downloadCount: 0, rating: 5.0, reviewCount: 0 };
    const newStats = {
      ...currentStats,
      downloadCount: (currentStats.downloadCount || 0) + 1,
    };

    await ctx.service.template.updateStats(id, newStats);

    ctx.helper.renderSuccess(ctx, { message: ctx.__('template.message.downloadUpdated') });
  },

  /**
   * 主题评分
   * @param ctx
   */
  async rateTheme(ctx) {
    const { id } = ctx.params;
    const { rating } = ctx.request.body;

    // 简单验证
    if (!rating || rating < 1 || rating > 5) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.ratingRange') });
    }

    const theme = await ctx.service.template.findById(id);
    if (!theme || theme.status !== '1' || !theme.installed) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.unavailable') });
    }

    // 更新评分（这里简化处理，实际应该考虑多用户评分的平均值）
    const currentStats = theme.stats || { downloadCount: 0, rating: 5.0, reviewCount: 0 };
    const newStats = {
      ...currentStats,
      rating:
        ((currentStats.rating || 5.0) * (currentStats.reviewCount || 0) + rating) /
        ((currentStats.reviewCount || 0) + 1),
      reviewCount: (currentStats.reviewCount || 0) + 1,
    };

    // 保留两位小数
    newStats.rating = Math.round(newStats.rating * 100) / 100;

    await ctx.service.template.updateStats(id, newStats);

    ctx.helper.renderSuccess(ctx, {
      message: ctx.__('template.message.rateSuccess'),
      data: { rating: newStats.rating, reviewCount: newStats.reviewCount },
    });
  },

  /**
   * 检查主题更新
   * @param ctx
   */
  async checkUpdate(ctx) {
    const { slug } = ctx.params;

    const theme = await ctx.service.template.findBySlug(slug);
    if (!theme) {
      return ctx.helper.renderFail(ctx, { message: ctx.__('template.error.notFound') });
    }

    // 这里可以对接主题市场API检查更新
    // 暂时返回无更新
    const updateInfo = {
      hasUpdate: false,
      currentVersion: theme.version,
      latestVersion: theme.version,
      updateLog: '',
    };

    ctx.helper.renderSuccess(ctx, { data: updateInfo });
  },
};

module.exports = TemplateController;
