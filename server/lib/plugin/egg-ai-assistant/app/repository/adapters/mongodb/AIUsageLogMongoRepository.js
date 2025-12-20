/**
 * AI Usage Log MongoDB Repository
 * 继承 BaseMongoRepository，实现 AI 使用日志的数据访问
 *
 * 使用工厂函数模式动态创建类，解决 npm 发布后的路径问题
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

/**
 * 创建 AIUsageLog MongoDB Repository 类
 * @param {Application} app - EggJS Application 实例
 * @return {Class} AIUsageLogMongoRepository 类
 */
function createAIUsageLogMongoRepository(app) {
  // 动态加载基类
  const BaseMongoRepository = BaseRepositoryLoader.getBaseMongoRepository(app);

  // 动态创建继承类
  class AIUsageLogMongoRepository extends BaseMongoRepository {
    constructor(ctx) {
      super(ctx, 'AIUsageLog');

      // 设置 MongoDB Model
      this.model = ctx.model.AIUsageLog;

      // 注册模型和关联关系
      this.registerModel({
        mongoModel: this.model,
        relations: {
          model: {
            model: ctx.model.AIModel,
            path: 'modelId',
            select: ['displayName', 'provider', 'modelName', 'id'],
          },
          promptTemplate: {
            model: ctx.model.PromptTemplate,
            path: 'promptTemplateId',
            select: ['name', 'taskType', 'language', 'id'],
          },
          user: {
            model: ctx.app.model.Admin,
            path: 'userId',
            select: ['userName', 'name', 'id'],
          },
        },
      });
    }

    /**
     * 获取默认的关联查询配置
     */
    _getDefaultPopulate() {
      return [
        {
          path: 'modelId',
          select: ['displayName', 'provider', 'modelName', 'id'],
        },
        {
          path: 'promptTemplateId',
          select: ['name', 'taskType', 'id'],
        },
      ];
    }

    /**
     * 获取默认的搜索字段
     */
    _getDefaultSearchKeys() {
      return ['taskType', 'taskDescription'];
    }

    /**
     * 获取默认的排序配置
     */
    _getDefaultSort() {
      return [{ field: 'createdAt', order: 'desc' }];
    }

    /**
     * 根据用户ID查找使用记录
     * @param {String} userId 用户ID
     * @param {Object} payload 分页参数
     * @param {Object} options 查询选项
     * @return {Promise<Object>} 分页结果
     */
    async findByUser(userId, payload = {}, options = {}) {
      try {
        return await this.find(payload, {
          filters: { userId: { $eq: userId } },
          ...options,
        });
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] findByUser failed:', error);
        throw this.exceptions.RepositoryError('Failed to find logs by user', {
          userId,
          error: error.message,
        });
      }
    }

    /**
     * 根据模型ID查找使用记录
     * @param {String} modelId 模型ID
     * @param {Object} payload 分页参数
     * @param {Object} options 查询选项
     * @return {Promise<Object>}
     */
    async findByModel(modelId, payload = {}, options = {}) {
      try {
        return await this.find(payload, {
          filters: { modelId: { $eq: modelId } },
          ...options,
        });
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] findByModel failed:', error);
        throw this.exceptions.RepositoryError('Failed to find logs by model', {
          modelId,
          error: error.message,
        });
      }
    }

    /**
     * 根据任务类型查找使用记录
     * @param {String} taskType 任务类型
     * @param {Object} payload 分页参数
     * @param {Object} options 查询选项
     * @return {Promise<Object>}
     */
    async findByTaskType(taskType, payload = {}, options = {}) {
      try {
        return await this.find(payload, {
          filters: { taskType: { $eq: taskType } },
          ...options,
        });
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] findByTaskType failed:', error);
        throw this.exceptions.RepositoryError('Failed to find logs by task type', {
          taskType,
          error: error.message,
        });
      }
    }

    /**
     * 获取用户使用统计
     * @param {String} userId 用户ID
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Object>}
     */
    async getUserStats(userId, startDate = null, endDate = null) {
      try {
        const match = { userId };
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalCalls: { $sum: 1 },
              successCalls: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
              },
              totalTokens: { $sum: '$totalTokens' },
              totalCost: { $sum: '$cost' },
              averageResponseTime: { $avg: '$responseTime' },
            },
          },
        ]);

        return (
          stats[0] || {
            totalCalls: 0,
            successCalls: 0,
            totalTokens: 0,
            totalCost: 0,
            averageResponseTime: 0,
          }
        );
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getUserStats failed:', error);
        throw this.exceptions.RepositoryError('Failed to get user stats', {
          userId,
          error: error.message,
        });
      }
    }

    /**
     * 获取模型使用统计
     * @param {String} modelId 模型ID
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Object>}
     */
    async getModelStats(modelId, startDate = null, endDate = null) {
      try {
        const match = { modelId };
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalCalls: { $sum: 1 },
              successCalls: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
              },
              totalTokens: { $sum: '$totalTokens' },
              totalCost: { $sum: '$cost' },
              averageResponseTime: { $avg: '$responseTime' },
            },
          },
        ]);

        return (
          stats[0] || {
            totalCalls: 0,
            successCalls: 0,
            totalTokens: 0,
            totalCost: 0,
            averageResponseTime: 0,
          }
        );
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getModelStats failed:', error);
        throw this.exceptions.RepositoryError('Failed to get model stats', {
          modelId,
          error: error.message,
        });
      }
    }

    /**
     * 获取任务类型统计
     * @param {String} taskType 任务类型
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Object>}
     */
    async getTaskTypeStats(taskType = null, startDate = null, endDate = null) {
      try {
        const match = {};
        if (taskType) match.taskType = taskType;
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: taskType ? null : '$taskType',
              totalCalls: { $sum: 1 },
              successCalls: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
              },
              totalTokens: { $sum: '$totalTokens' },
              totalCost: { $sum: '$cost' },
              averageResponseTime: { $avg: '$responseTime' },
            },
          },
        ]);

        return taskType ? stats[0] || {} : stats;
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getTaskTypeStats failed:', error);
        throw this.exceptions.RepositoryError('Failed to get task type stats', {
          taskType,
          error: error.message,
        });
      }
    }

    /**
     * 按时间范围统计使用情况
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @param {String} groupBy 分组方式
     * @return {Promise<Array>}
     */
    async getUsageByTimeRange(startDate, endDate, groupBy = 'day') {
      try {
        const groupFormat = {
          hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          week: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        };

        return await this.model.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: groupFormat[groupBy],
              count: { $sum: 1 },
              totalTokens: { $sum: '$totalTokens' },
              totalCost: { $sum: '$cost' },
              averageResponseTime: { $avg: '$responseTime' },
            },
          },
          { $sort: { _id: 1 } },
        ]);
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getUsageByTimeRange failed:', error);
        throw this.exceptions.RepositoryError('Failed to get usage by time range', {
          startDate,
          endDate,
          groupBy,
          error: error.message,
        });
      }
    }

    /**
     * 获取失败的使用记录
     * @param {Object} payload 分页参数
     * @param {Object} filter 过滤条件
     * @return {Promise<Object>}
     */
    async findFailedLogs(payload = {}, filter = {}) {
      try {
        const filters = { status: { $eq: 'failure' } };

        if (filter.userId) {
          filters.userId = { $eq: filter.userId };
        }
        if (filter.modelId) {
          filters.modelId = { $eq: filter.modelId };
        }
        if (filter.taskType) {
          filters.taskType = { $eq: filter.taskType };
        }

        return await this.find(payload, { filters });
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] findFailedLogs failed:', error);
        throw this.exceptions.RepositoryError('Failed to find failed logs', {
          filter,
          error: error.message,
        });
      }
    }

    /**
     * 获取成功率统计
     * @param {Object} filter 过滤条件
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Object>}
     */
    async getSuccessRate(filter = {}, startDate = null, endDate = null) {
      try {
        const match = {};

        if (filter.userId) match.userId = filter.userId;
        if (filter.modelId) match.modelId = filter.modelId;
        if (filter.taskType) match.taskType = filter.taskType;
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalCalls: { $sum: 1 },
              successCalls: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
              },
              failedCalls: {
                $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
              },
            },
          },
        ]);

        const result = stats[0] || { totalCalls: 0, successCalls: 0, failedCalls: 0 };
        result.successRate = result.totalCalls > 0 ? result.successCalls / result.totalCalls : 0;

        return result;
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getSuccessRate failed:', error);
        throw this.exceptions.RepositoryError('Failed to get success rate', {
          filter,
          error: error.message,
        });
      }
    }

    /**
     * 获取平均响应时间
     * @param {Object} filter 过滤条件
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Number>}
     */
    async getAverageResponseTime(filter = {}, startDate = null, endDate = null) {
      try {
        const match = {};

        if (filter.userId) match.userId = filter.userId;
        if (filter.modelId) match.modelId = filter.modelId;
        if (filter.taskType) match.taskType = filter.taskType;
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              averageResponseTime: { $avg: '$responseTime' },
            },
          },
        ]);

        return stats[0]?.averageResponseTime || 0;
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getAverageResponseTime failed:', error);
        throw this.exceptions.RepositoryError('Failed to get average response time', {
          filter,
          error: error.message,
        });
      }
    }

    /**
     * 获取成本统计
     * @param {Object} filter 过滤条件
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @return {Promise<Object>}
     */
    async getCostStats(filter = {}, startDate = null, endDate = null) {
      try {
        const match = {};

        if (filter.userId) match.userId = filter.userId;
        if (filter.modelId) match.modelId = filter.modelId;
        if (filter.taskType) match.taskType = filter.taskType;
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = startDate;
          if (endDate) match.createdAt.$lte = endDate;
        }

        const stats = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalCost: { $sum: '$cost' },
              averageCost: { $avg: '$cost' },
            },
          },
        ]);

        // 按模型分组统计成本
        const costByModel = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$modelId',
              totalCost: { $sum: '$cost' },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalCost: -1 } },
        ]);

        return {
          totalCost: stats[0]?.totalCost || 0,
          averageCost: stats[0]?.averageCost || 0,
          costByModel,
        };
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getCostStats failed:', error);
        throw this.exceptions.RepositoryError('Failed to get cost stats', {
          filter,
          error: error.message,
        });
      }
    }

    /**
     * 批量创建日志
     * @param {Array} logs 日志数组
     * @return {Promise<Array>}
     */
    async batchCreate(logs) {
      try {
        return await this.model.insertMany(logs);
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] batchCreate failed:', error);
        throw this.exceptions.RepositoryError('Failed to batch create logs', {
          count: logs.length,
          error: error.message,
        });
      }
    }

    /**
     * 清理过期日志
     * @param {Number} days 保留天数
     * @return {Promise<Object>}
     */
    async cleanupOldLogs(days = 90) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await this.model.deleteMany({
          createdAt: { $lt: cutoffDate },
        });

        return { deletedCount: result.deletedCount };
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] cleanupOldLogs failed:', error);
        throw this.exceptions.RepositoryError('Failed to cleanup old logs', {
          days,
          error: error.message,
        });
      }
    }

    /**
     * 导出使用日志
     * @param {Object} filter 过滤条件
     * @param {String} format 导出格式
     * @return {Promise<String|Object>}
     */
    async exportLogs(filter = {}, format = 'json') {
      try {
        const match = {};
        if (filter.userId) match.userId = filter.userId;
        if (filter.modelId) match.modelId = filter.modelId;
        if (filter.taskType) match.taskType = filter.taskType;
        if (filter.startDate || filter.endDate) {
          match.createdAt = {};
          if (filter.startDate) match.createdAt.$gte = filter.startDate;
          if (filter.endDate) match.createdAt.$lte = filter.endDate;
        }

        const logs = await this.model.find(match).lean();

        if (format === 'json') {
          return logs;
        }

        // CSV 格式
        if (format === 'csv') {
          const headers = ['ID', 'UserID', 'TaskType', 'ModelID', 'Status', 'Cost', 'ResponseTime', 'CreatedAt'];
          const rows = logs.map(log => [
            log._id,
            log.userId,
            log.taskType,
            log.modelId,
            log.status,
            log.cost,
            log.responseTime,
            log.createdAt,
          ]);

          return { headers, rows };
        }

        return logs;
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] exportLogs failed:', error);
        throw this.exceptions.RepositoryError('Failed to export logs', {
          filter,
          format,
          error: error.message,
        });
      }
    }

    /**
     * 获取Token使用趋势
     * @param {Date} startDate 开始日期
     * @param {Date} endDate 结束日期
     * @param {String} groupBy 分组方式
     * @return {Promise<Array>}
     */
    async getTokenUsageTrend(startDate, endDate, groupBy = 'day') {
      try {
        return await this.getUsageByTimeRange(startDate, endDate, groupBy);
      } catch (error) {
        this.ctx.logger.error('[AIUsageLogMongoRepository] getTokenUsageTrend failed:', error);
        throw this.exceptions.RepositoryError('Failed to get token usage trend', {
          startDate,
          endDate,
          groupBy,
          error: error.message,
        });
      }
    }
  }

  return AIUsageLogMongoRepository;
}

/**
 * 导出工厂函数
 * 用法：const AIUsageLogMongoRepository = require('...')(app);
 */
module.exports = createAIUsageLogMongoRepository;
