/**
 * Sitemap Management Controller - 站点地图管理控制器
 * 🔥 提供后台管理界面的 sitemap 管理功能
 */
'use strict';

const Controller = require('egg').Controller;

class SitemapController extends Controller {
  /**
   * 获取 Sitemap 状态信息
   */
  async getStatus() {
    const { ctx } = this;

    try {
      // 获取缓存统计
      const cacheStats = await ctx.service.sitemap.getCacheStats();

      // 获取系统配置
      const configs = await ctx.service.systemConfig.getConfigsAsObject();

      // 统计内容数量
      const [categoryCount, contentCount] = await Promise.all([
        ctx.service.contentCategory.count({ enable: { $eq: true } }),
        ctx.service.content.count({
          state: { $eq: '2' }, // 已发布状态
          draft: { $eq: '0' }, // 不在回收站
        }),
      ]);

      const status = {
        // 缓存状态
        cache: cacheStats,

        // 内容统计
        statistics: {
          categories: categoryCount,
          contents: contentCount,
          totalUrls: 1 + categoryCount + contentCount, // 1 为首页
          lastGenerated: new Date().toISOString(),
        },

        // 配置信息
        config: {
          siteDomain: configs.siteDomain || 'Not configured',
          autoRefresh: true,
          cacheEnabled: true,
          cacheExpire: 3600, // 1小时
        },

        // 健康状态
        health: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
        },
      };

      ctx.helper.renderSuccess(ctx, {
        data: status,
        message: 'Sitemap status retrieved successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to get sitemap status:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to get sitemap status',
        error: error.message,
      });
    }
  }

  /**
   * 手动刷新 Sitemap
   */
  async refresh() {
    const { ctx } = this;

    try {
      const startTime = Date.now();

      // 清除缓存并重新生成
      await ctx.service.sitemap.clearAllCache();

      const xml = await ctx.service.sitemap.generateXMLSitemap({
        useCache: true,
        forceRefresh: true,
      });

      const duration = Date.now() - startTime;

      // 记录操作日志
      ctx.logger.info('Sitemap manually refreshed', {
        operator: ctx.session.adminUserInfo?.userName || 'unknown',
        duration: `${duration}ms`,
        xmlLength: xml.length,
      });

      ctx.helper.renderSuccess(ctx, {
        data: {
          duration: `${duration}ms`,
          xmlLength: xml.length,
          timestamp: new Date().toISOString(),
        },
        message: 'Sitemap refreshed successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to refresh sitemap:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to refresh sitemap',
        error: error.message,
      });
    }
  }

  /**
   * 清除 Sitemap 缓存
   */
  async clearCache() {
    const { ctx } = this;

    try {
      await ctx.service.sitemap.clearAllCache();

      // 记录操作日志
      ctx.logger.info('Sitemap cache cleared', {
        operator: ctx.session.adminUserInfo?.userName || 'unknown',
        timestamp: new Date().toISOString(),
      });

      ctx.helper.renderSuccess(ctx, {
        message: 'Sitemap cache cleared successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to clear sitemap cache:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to clear sitemap cache',
        error: error.message,
      });
    }
  }

  /**
   * 预览 Sitemap XML
   */
  async preview() {
    const { ctx } = this;

    try {
      const xml = await ctx.service.sitemap.generateXMLSitemap({
        useCache: true,
        forceRefresh: false,
      });

      // 解析 XML 为可读格式
      const preview = this.parseXmlForPreview(xml);

      ctx.helper.renderSuccess(ctx, {
        data: {
          xml: xml.substring(0, 1000) + (xml.length > 1000 ? '...' : ''), // 截取前1000字符预览
          preview,
          fullLength: xml.length,
          generated: new Date().toISOString(),
        },
        message: 'Sitemap preview generated successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to preview sitemap:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to preview sitemap',
        error: error.message,
      });
    }
  }

  /**
   * 获取 Sitemap 配置
   */
  async getConfig() {
    const { ctx } = this;

    try {
      const configs = await ctx.service.systemConfig.getConfigsAsObject();

      const sitemapConfig = {
        siteDomain: configs.siteDomain || '',
        autoRefresh: true,
        cacheEnabled: true,
        cacheExpire: 3600,
        includeCategories: true,
        includeContents: true,
        includeStaticPages: true,
        maxUrls: 50000,
        updateFrequency: {
          homepage: 'daily',
          categories: 'weekly',
          contents: 'weekly',
          staticPages: 'monthly',
        },
        priorities: {
          homepage: 1.0,
          categories: 0.8,
          contents: 0.5,
          staticPages: 0.6,
        },
      };

      ctx.helper.renderSuccess(ctx, {
        data: sitemapConfig,
        message: 'Sitemap configuration retrieved successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to get sitemap config:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to get sitemap configuration',
        error: error.message,
      });
    }
  }

  /**
   * 更新 Sitemap 配置
   */
  async updateConfig() {
    const { ctx } = this;

    try {
      // 验证请求参数
      ctx.validate({
        siteDomain: { type: 'string', required: false },
        autoRefresh: { type: 'boolean', required: false },
        cacheEnabled: { type: 'boolean', required: false },
      });

      const { siteDomain, autoRefresh, cacheEnabled } = ctx.request.body;

      // 更新系统配置
      if (siteDomain) {
        await ctx.service.systemConfig.updateByKey('siteDomain', siteDomain);
      }

      // 记录操作日志
      ctx.logger.info('Sitemap configuration updated', {
        operator: ctx.session.adminUserInfo?.userName || 'unknown',
        changes: { siteDomain, autoRefresh, cacheEnabled },
        timestamp: new Date().toISOString(),
      });

      // 如果域名发生变化，清除缓存
      if (siteDomain) {
        await ctx.service.sitemap.clearAllCache();
      }

      ctx.helper.renderSuccess(ctx, {
        message: 'Sitemap configuration updated successfully',
      });
    } catch (error) {
      ctx.logger.error('Failed to update sitemap config:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Failed to update sitemap configuration',
        error: error.message,
      });
    }
  }

  /**
   * 测试 Sitemap 访问
   */
  async testAccess() {
    const { ctx } = this;

    try {
      const configs = await ctx.service.systemConfig.getConfigsAsObject();
      const siteDomain = configs.siteDomain;

      if (!siteDomain) {
        return ctx.helper.renderFail(ctx, {
          message: 'Site domain not configured',
        });
      }

      const sitemapUrl = `${siteDomain}/sitemap.xml`;

      // 测试 sitemap 访问
      const response = await ctx.curl(sitemapUrl, {
        method: 'GET',
        timeout: 10000,
        followRedirect: true,
      });

      const testResult = {
        url: sitemapUrl,
        status: response.status,
        accessible: response.status === 200,
        responseTime: response.rt,
        contentLength: response.data ? response.data.length : 0,
        contentType: response.headers['content-type'],
        lastModified: response.headers['last-modified'],
        cacheControl: response.headers['cache-control'],
      };

      ctx.helper.renderSuccess(ctx, {
        data: testResult,
        message: 'Sitemap access test completed',
      });
    } catch (error) {
      ctx.logger.error('Sitemap access test failed:', error);
      ctx.helper.renderFail(ctx, {
        message: 'Sitemap access test failed',
        error: error.message,
      });
    }
  }

  /**
   * 解析 XML 为预览格式
   * @param {String} xml XML 内容
   * @return {Array} 预览数据
   * @private
   */
  parseXmlForPreview(xml) {
    const urls = [];

    try {
      // 简单的 XML 解析 (生产环境建议使用专业的 XML 解析库)
      const urlMatches = xml.match(/<url>(.*?)<\/url>/gs);

      if (urlMatches) {
        urlMatches.slice(0, 10).forEach(urlMatch => {
          // 只预览前10个URL
          const loc = this.extractXmlValue(urlMatch, 'loc');
          const changefreq = this.extractXmlValue(urlMatch, 'changefreq');
          const priority = this.extractXmlValue(urlMatch, 'priority');
          const lastmod = this.extractXmlValue(urlMatch, 'lastmod');

          if (loc) {
            urls.push({ loc, changefreq, priority, lastmod });
          }
        });
      }
    } catch (error) {
      this.ctx.logger.warn('Failed to parse XML for preview:', error);
    }

    return urls;
  }

  /**
   * 从 XML 中提取值
   * @param {String} xml XML 片段
   * @param {String} tag 标签名
   * @return {String} 提取的值
   * @private
   */
  extractXmlValue(xml, tag) {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }
}

module.exports = SitemapController;
