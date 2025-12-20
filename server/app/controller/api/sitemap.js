/**
 * Sitemap API Controller - 提供 sitemap 管理接口
 * 🔧 用于生产环境的 sitemap 管理和监控
 */
'use strict';

const Controller = require('egg').Controller;

class SitemapApiController extends Controller {
  /**
   * 获取 sitemap 缓存状态
   */
  async cacheStatus() {
    const { ctx } = this;

    try {
      const stats = await ctx.service.sitemap.getCacheStats();

      ctx.helper.renderSuccess(ctx, {
        data: stats,
        message: 'Sitemap cache status retrieved successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to get sitemap cache status:', error);
      ctx.helper.renderFail(ctx, {
        data: {},
        message: 'Failed to get cache status',
      });
    }
  }

  /**
   * 清除 sitemap 缓存
   */
  async clearCache() {
    const { ctx } = this;

    try {
      await ctx.service.sitemap.clearAllCache();

      ctx.helper.renderSuccess(ctx, {
        data: {},
        message: 'Sitemap cache cleared successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to clear sitemap cache:', error);
      ctx.helper.renderFail(ctx, {
        data: {},
        message: 'Failed to clear cache',
      });
    }
  }
}

module.exports = SitemapApiController;
