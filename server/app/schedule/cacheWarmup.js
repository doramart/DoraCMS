/*
 * @Description: 缓存预热定时任务
 */

'use strict';

const Subscription = require('egg').Subscription;

class CacheWarmupTask extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '30m', // 每30分钟执行一次
      type: 'all', // 指定所有的 worker 都需要执行
      immediate: false, // 不立即执行
      disable: false, // 默认启用
      env: ['prod', 'local'], // 只在生产环境和本地环境运行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { ctx } = this;

    try {
      ctx.logger.info('[CacheWarmup] Starting scheduled cache warmup...');

      // 检查是否有TemplateService
      if (!ctx.service || !ctx.service.templateService) {
        ctx.logger.warn('[CacheWarmup] TemplateService not available, skipping warmup');
        return;
      }

      // 获取缓存统计信息
      const stats = ctx.service.templateService.getEnhancedCacheStats();
      const hitRate = parseFloat(stats.hitRate);

      // 根据命中率决定是否需要预热
      if (hitRate < 70 || stats.totalRequests < 100) {
        ctx.logger.info(`[CacheWarmup] Hit rate: ${hitRate}%, executing warmup...`);

        // 执行预热，使用较小的批次避免影响正常服务
        await ctx.service.templateService.warmupCache({
          batchSize: 2,
          batchDelay: 500, // 较长延迟，避免影响正常请求
        });

        ctx.logger.info('[CacheWarmup] Scheduled cache warmup completed');
      } else {
        ctx.logger.info(`[CacheWarmup] Hit rate: ${hitRate}%, skipping warmup`);
      }
    } catch (error) {
      ctx.logger.error('[CacheWarmup] Scheduled cache warmup failed:', error);
    }
  }
}

module.exports = CacheWarmupTask;
