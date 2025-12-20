/**
 * Sitemap Refresh Schedule - 定时刷新站点地图
 * 🔥 定期更新 sitemap 缓存，确保数据新鲜度
 */
'use strict';

const Subscription = require('egg').Subscription;

class SitemapRefreshSchedule extends Subscription {
  /**
   * 定时任务配置
   */
  static get schedule() {
    return {
      cron: '0 2 * * *', // 每天凌晨2点执行
      type: 'worker', // 只在一个 worker 进程中执行
      immediate: false, // 启动时不立即执行
      disable: false, // 是否禁用
      env: ['prod', 'local'], // 只在生产和本地环境执行
    };
  }

  /**
   * 执行定时任务
   */
  async subscribe() {
    const ctx = this.ctx;
    const startTime = Date.now();

    try {
      ctx.logger.info('Sitemap refresh schedule started');

      // 1. 清除所有 sitemap 相关缓存
      await ctx.service.sitemap.clearAllCache();
      ctx.logger.info('Sitemap cache cleared');

      // 2. 预热缓存 - 生成新的 sitemap
      await ctx.service.sitemap.generateXMLSitemap({
        useCache: true,
        forceRefresh: true,
      });
      ctx.logger.info('Sitemap cache warmed up');

      // 3. 获取缓存统计
      const cacheStats = await ctx.service.sitemap.getCacheStats();

      // 4. 记录执行结果
      const duration = Date.now() - startTime;
      ctx.logger.info('Sitemap refresh schedule completed', {
        duration: `${duration}ms`,
        cacheStats,
        timestamp: new Date().toISOString(),
      });

      // 5. 可选：通知搜索引擎 (如果配置了的话)
      if (this.config.sitemap && this.config.sitemap.autoNotifySearchEngines) {
        await this.notifySearchEngines();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      ctx.logger.error('Sitemap refresh schedule failed:', error, {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      // 发送错误通知 (可选)
      await this.sendErrorNotification(error);
    }
  }

  /**
   * 通知搜索引擎更新
   * @private
   */
  async notifySearchEngines() {
    const ctx = this.ctx;

    try {
      // 获取系统配置
      const configs = await ctx.service.systemConfig.getConfigsAsObject();
      const siteDomain = configs.siteDomain;

      if (!siteDomain) {
        ctx.logger.warn('Site domain not configured, skipping search engine notification');
        return;
      }

      const sitemapUrl = `${siteDomain}/sitemap.xml`;

      // 搜索引擎 ping 地址
      const searchEngines = [
        {
          name: 'Google',
          url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        },
        {
          name: 'Bing',
          url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        },
      ];

      // 并行通知所有搜索引擎
      const notifications = searchEngines.map(async engine => {
        try {
          const response = await ctx.curl(engine.url, {
            method: 'GET',
            timeout: 10000, // 10秒超时
            followRedirect: true,
          });

          if (response.status === 200) {
            ctx.logger.info(`Successfully notified ${engine.name}`, {
              url: engine.url,
              status: response.status,
            });
            return { engine: engine.name, success: true };
          }
          ctx.logger.warn(`Failed to notify ${engine.name}`, {
            url: engine.url,
            status: response.status,
          });
          return { engine: engine.name, success: false, status: response.status };
        } catch (error) {
          ctx.logger.error(`Error notifying ${engine.name}:`, error, {
            url: engine.url,
          });
          return { engine: engine.name, success: false, error: error.message };
        }
      });

      const results = await Promise.all(notifications);

      // 统计通知结果
      const successful = results.filter(r => r.success).length;
      const total = results.length;

      ctx.logger.info('Search engine notification completed', {
        successful,
        total,
        results,
      });
    } catch (error) {
      ctx.logger.error('Search engine notification failed:', error);
    }
  }

  /**
   * 发送错误通知
   * @param {Error} error 错误对象
   * @private
   */
  async sendErrorNotification(error) {
    const ctx = this.ctx;

    try {
      // 这里可以集成邮件、钉钉、企业微信等通知方式
      // 示例：记录到系统日志表

      const errorLog = {
        type: 'sitemap_schedule_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        severity: 'error',
      };

      // 如果有系统日志服务，可以调用
      // await ctx.service.systemLog.create(errorLog);

      ctx.logger.error('Sitemap schedule error logged', errorLog);
    } catch (logError) {
      ctx.logger.error('Failed to send error notification:', logError);
    }
  }
}

module.exports = SitemapRefreshSchedule;
