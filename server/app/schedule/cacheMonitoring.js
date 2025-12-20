/*
 * @Description: 缓存性能监控定时任务
 */

'use strict';

const Subscription = require('egg').Subscription;

class CacheMonitoringTask extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '5m', // 每5分钟执行一次
      type: 'worker', // 只有一个 worker 执行
      immediate: false,
      disable: false,
      env: ['prod', 'local'], // 只在生产环境和本地环境运行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { ctx } = this;

    try {
      // 检查是否有TemplateService
      if (!ctx.service || !ctx.service.templateService) {
        return;
      }

      // 获取缓存统计信息
      const stats = ctx.service.templateService.getEnhancedCacheStats();

      // 检查缓存健康状态
      const hitRate = parseFloat(stats.hitRate);
      const errorRate = stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) * 100 : 0;
      const avgResponseTime = stats.avgResponseTime;

      // 记录关键指标
      ctx.logger.info(
        `[CacheMonitoring] Cache metrics: Hit Rate: ${hitRate}%, Error Rate: ${errorRate.toFixed(2)}%, Avg Response: ${avgResponseTime.toFixed(2)}ms`
      );

      // 检查异常情况并发出警告
      const warnings = [];

      if (hitRate < 50 && stats.totalRequests > 50) {
        warnings.push(`Low cache hit rate: ${hitRate}%`);
      }

      if (errorRate > 5) {
        warnings.push(`High cache error rate: ${errorRate.toFixed(2)}%`);
      }

      if (avgResponseTime > 1000) {
        warnings.push(`High average response time: ${avgResponseTime.toFixed(2)}ms`);
      }

      // 内存使用率检查
      const memUsage = process.memoryUsage();
      const memUtilization = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      if (memUtilization > 85) {
        warnings.push(`High memory utilization: ${memUtilization.toFixed(2)}%`);
      }

      // 发出警告
      if (warnings.length > 0) {
        ctx.logger.warn(`[CacheMonitoring] Cache performance warnings: ${warnings.join(', ')}`);

        // 如果错误率过高，尝试清理部分缓存
        if (errorRate > 10) {
          ctx.logger.warn('[CacheMonitoring] High error rate detected, attempting cache cleanup...');
          try {
            // 清理随机内容缓存（影响最小）
            await ctx.service.templateService.clearCache('content', { actionType: 'random' });
          } catch (error) {
            ctx.logger.error('[CacheMonitoring] Cache cleanup failed:', error);
          }
        }
      }

      // 系统资源监控
      this._monitorSystemResources(ctx, memUsage);
    } catch (error) {
      ctx.logger.error('[CacheMonitoring] Cache monitoring failed:', error);
    }
  }

  /**
   * 监控系统资源
   * @param {Object} ctx 上下文
   * @param {Object} memUsage 内存使用情况
   */
  _monitorSystemResources(ctx, memUsage) {
    const memUtilization = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // 记录系统资源使用情况
    ctx.logger.debug(
      `[CacheMonitoring] System resources: Memory: ${memUtilization.toFixed(2)}%, Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
    );

    // 检查是否需要垃圾回收
    if (memUtilization > 80 && global.gc) {
      ctx.logger.info('[CacheMonitoring] High memory usage detected, triggering GC...');
      try {
        global.gc();
        const newMemUsage = process.memoryUsage();
        const newMemUtilization = (newMemUsage.heapUsed / newMemUsage.heapTotal) * 100;
        ctx.logger.info(
          `[CacheMonitoring] GC completed, memory utilization: ${memUtilization.toFixed(2)}% -> ${newMemUtilization.toFixed(2)}%`
        );
      } catch (error) {
        ctx.logger.warn('[CacheMonitoring] GC failed:', error);
      }
    }
  }
}

module.exports = CacheMonitoringTask;
