/*
 * @Description: 缓存监控控制器 - 管理后台
 */

'use strict';

const Controller = require('egg').Controller;

class CacheMonitorController extends Controller {
  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    try {
      const templateStats = this.ctx.service.templateService.getEnhancedCacheStats();

      // 计算缓存健康度
      const healthScore = this._calculateCacheHealth(templateStats);

      this.ctx.helper.renderSuccess(this.ctx, {
        data: {
          template: templateStats,
          health: {
            score: healthScore,
            status: this._getHealthStatus(healthScore),
            recommendations: this._getHealthRecommendations(templateStats, healthScore),
          },
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Get stats failed:', error);
      throw error;
    }
  }

  /**
   * 手动触发缓存预热
   */
  async warmupCache() {
    try {
      // 获取预热选项
      const { batchSize = 3, batchDelay = 100 } = this.ctx.request.body;

      // 异步执行预热，不阻塞响应
      this.ctx.runInBackground(async () => {
        await this.ctx.service.templateService.warmupCache({ batchSize, batchDelay });
      });

      this.ctx.helper.renderSuccess(this.ctx, {
        message: 'Cache warmup initiated successfully',
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Warmup failed:', error);
      throw error;
    }
  }

  /**
   * 清理特定类型的缓存
   */
  async clearCache() {
    const { type = 'all', args = {} } = this.ctx.request.body;

    try {
      const result = await this.ctx.service.templateService.clearCache(type, args);

      this.ctx.helper.renderSuccess(this.ctx, {
        data: { success: result },
        message: result ? 'Cache cleared successfully' : 'Failed to clear cache',
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * 获取缓存配置
   */
  async getCacheConfig() {
    try {
      const config = this.ctx.service.templateService.cacheConfig;

      this.ctx.helper.renderSuccess(this.ctx, {
        data: config,
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Get config failed:', error);
      throw error;
    }
  }

  /**
   * 重置缓存统计信息
   */
  async resetCacheStats() {
    try {
      this.ctx.service.templateService.resetCacheStats();

      this.ctx.helper.renderSuccess(this.ctx, {
        message: 'Cache statistics reset successfully',
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Reset stats failed:', error);
      throw error;
    }
  }

  /**
   * 获取缓存热点分析
   */
  async getCacheHotspots() {
    try {
      // 这里可以扩展为真实的热点分析
      const hotspots = await this._analyzeHotspots();

      this.ctx.helper.renderSuccess(this.ctx, {
        data: hotspots,
      });
    } catch (error) {
      this.ctx.logger.error('[CacheMonitor] Get hotspots failed:', error);
      throw error;
    }
  }

  /**
   * 计算缓存健康度
   * @param {Object} stats 统计信息
   * @return {Number} 健康度分数 (0-100)
   */
  _calculateCacheHealth(stats) {
    let score = 100;

    // 命中率权重 40%
    const hitRate = parseFloat(stats.hitRate);
    if (hitRate < 50) score -= 30;
    else if (hitRate < 70) score -= 15;
    else if (hitRate < 85) score -= 5;

    // 错误率权重 30%
    const errorRate = stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) * 100 : 0;
    if (errorRate > 5) score -= 25;
    else if (errorRate > 2) score -= 15;
    else if (errorRate > 1) score -= 8;

    // 响应时间权重 20%
    if (stats.avgResponseTime > 1000) score -= 15;
    else if (stats.avgResponseTime > 500) score -= 10;
    else if (stats.avgResponseTime > 200) score -= 5;

    // 系统运行时间权重 10%
    const uptimeHours = stats.uptime / (1000 * 60 * 60);
    if (uptimeHours < 1) score -= 5; // 新启动的系统

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 获取健康状态
   * @param {Number} score 健康度分数
   * @return {String} 状态
   */
  _getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * 获取健康建议
   * @param {Object} stats 统计信息
   * @param {Number} score 健康度分数
   * @return {Array} 建议列表
   */
  _getHealthRecommendations(stats, score) {
    const recommendations = [];

    const hitRate = parseFloat(stats.hitRate);
    if (hitRate < 70) {
      recommendations.push({
        type: 'warning',
        message: '缓存命中率偏低，建议增加常用数据的TTL时间',
        action: 'optimize_ttl',
      });
    }

    const errorRate = stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) * 100 : 0;
    if (errorRate > 2) {
      recommendations.push({
        type: 'error',
        message: '缓存错误率较高，请检查缓存服务器状态',
        action: 'check_cache_server',
      });
    }

    if (stats.avgResponseTime > 500) {
      recommendations.push({
        type: 'warning',
        message: '平均响应时间较长，建议优化缓存策略',
        action: 'optimize_performance',
      });
    }

    if (score < 60) {
      recommendations.push({
        type: 'critical',
        message: '缓存系统需要立即关注和优化',
        action: 'system_review',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: '缓存系统运行良好',
        action: 'maintain_current_state',
      });
    }

    return recommendations;
  }

  /**
   * 分析缓存热点（示例实现）
   * @return {Object} 热点分析结果
   */
  async _analyzeHotspots() {
    // 这里可以实现真实的热点分析逻辑
    // 比如记录各个缓存键的访问频率、最近访问时间等

    return {
      summary: {
        totalKeys: 'N/A',
        hotKeysCount: 'N/A',
        coldKeysCount: 'N/A',
      },
      topKeys: [
        { key: 'template:content:recommend', estimatedHits: 'High', category: 'content' },
        { key: 'template:category:tree', estimatedHits: 'High', category: 'taxonomy' },
        { key: 'template:content:hot', estimatedHits: 'Medium', category: 'content' },
        { key: 'template:tags:hot', estimatedHits: 'Medium', category: 'taxonomy' },
      ],
      recommendations: [
        {
          type: 'optimization',
          message: '建议为高频访问的内容标签实现内存缓存',
          keys: ['template:content:recommend', 'template:category:tree'],
        },
      ],
    };
  }
}

module.exports = CacheMonitorController;
