/**
 * AI Usage Log MariaDB Repository
 * 继承 BaseMariaRepository，实现 AI 使用日志的数据访问
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

// 缓存动态创建的类
let AIUsageLogMariaRepositoryClass = null;

/**
 * 获取 AIUsageLogMariaRepository 类（延迟创建）
 * @param {Application} app Egg Application 实例
 * @return {Class} AIUsageLogMariaRepository 类
 */
function getAIUsageLogMariaRepository(app) {
  if (!AIUsageLogMariaRepositoryClass) {
    // 动态加载基类
    const BaseMariaRepository = BaseRepositoryLoader.getBaseMariaRepository(app);

    // 动态创建继承类
    AIUsageLogMariaRepositoryClass = class AIUsageLogMariaRepository extends BaseMariaRepository {
      constructor(ctx) {
        // 调用父类构造函数
        super(ctx, 'AIUsageLog');

        // 动态获取 MariaDB 连接管理器（支持 npm 发布）
        const ConnectionLoader = require('../../base/ConnectionLoader');
        this.connection = ConnectionLoader.getMariaDBConnectionInstance(ctx.app);
        this.model = null; // 将在 _initializeConnection 中设置
      }

      /**
       * 初始化数据库连接和模型
       * @private
       */
      async _initializeConnection() {
        try {
          // 确保连接管理器已初始化
          await this.connection.initialize();

          // 从连接管理器获取模型
          this.model = this.connection.getModel('AIUsageLog');

          if (!this.model) {
            throw new Error('AIUsageLog 模型未找到，请检查模型加载顺序');
          }

          // 注册模型和关联关系
          this.registerModel({
            mariaModel: this.model,
            relations: {
              model: {
                model: this.connection.getModel('AIModel'),
                type: 'belongsTo',
                foreignKey: 'modelId',
                as: 'model',
                select: ['id', 'displayName', 'provider', 'modelName'],
              },
              promptTemplate: {
                model: this.connection.getModel('PromptTemplate'),
                type: 'belongsTo',
                foreignKey: 'promptTemplateId',
                as: 'promptTemplate',
                select: ['id', 'name', 'taskType'],
              },
            },
          });
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] Initialization failed:', error);
          throw error;
        }
      }

      /**
       * 确保连接已建立
       * @private
       */
      async _ensureConnection() {
        if (!this.model) {
          await this._initializeConnection();
        }
      }

      /**
       * 获取默认的关联查询配置
       */
      _getDefaultPopulate() {
        return ['model', 'promptTemplate'];
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] findByUser failed:', error);
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] findByModel failed:', error);
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] findByTaskType failed:', error);
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
          const where = { userId };
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          const results = await this.model.findAll({
            where,
            attributes: [
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalCalls'],
              [
                this.ctx.app.Sequelize.fn(
                  'SUM',
                  this.ctx.app.Sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
                ),
                'successCalls',
              ],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('totalTokens')), 'totalTokens'],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
            ],
            raw: true,
          });

          return {
            totalCalls: parseInt(results[0].totalCalls) || 0,
            successCalls: parseInt(results[0].successCalls) || 0,
            totalTokens: parseInt(results[0].totalTokens) || 0,
            totalCost: parseFloat(results[0].totalCost) || 0,
            averageResponseTime: parseFloat(results[0].averageResponseTime) || 0,
          };
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getUserStats failed:', error);
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
          const where = { modelId };
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          const results = await this.model.findAll({
            where,
            attributes: [
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalCalls'],
              [
                this.ctx.app.Sequelize.fn(
                  'SUM',
                  this.ctx.app.Sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
                ),
                'successCalls',
              ],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('totalTokens')), 'totalTokens'],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
            ],
            raw: true,
          });

          return {
            totalCalls: parseInt(results[0].totalCalls) || 0,
            successCalls: parseInt(results[0].successCalls) || 0,
            totalTokens: parseInt(results[0].totalTokens) || 0,
            totalCost: parseFloat(results[0].totalCost) || 0,
            averageResponseTime: parseFloat(results[0].averageResponseTime) || 0,
          };
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getModelStats failed:', error);
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
          const where = {};
          if (taskType) where.taskType = taskType;
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          if (taskType) {
            // 单个任务类型统计
            const results = await this.model.findAll({
              where,
              attributes: [
                [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalCalls'],
                [
                  this.ctx.app.Sequelize.fn(
                    'SUM',
                    this.ctx.app.Sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
                  ),
                  'successCalls',
                ],
                [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('totalTokens')), 'totalTokens'],
                [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
                [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
              ],
              raw: true,
            });

            return {
              totalCalls: parseInt(results[0].totalCalls) || 0,
              successCalls: parseInt(results[0].successCalls) || 0,
              totalTokens: parseInt(results[0].totalTokens) || 0,
              totalCost: parseFloat(results[0].totalCost) || 0,
              averageResponseTime: parseFloat(results[0].averageResponseTime) || 0,
            };
          }
          // 所有任务类型统计
          const results = await this.model.findAll({
            where,
            attributes: [
              'taskType',
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalCalls'],
              [
                this.ctx.app.Sequelize.fn(
                  'SUM',
                  this.ctx.app.Sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
                ),
                'successCalls',
              ],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('totalTokens')), 'totalTokens'],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
            ],
            group: ['taskType'],
            raw: true,
          });

          return results.map(r => ({
            taskType: r.taskType,
            totalCalls: parseInt(r.totalCalls) || 0,
            successCalls: parseInt(r.successCalls) || 0,
            totalTokens: parseInt(r.totalTokens) || 0,
            totalCost: parseFloat(r.totalCost) || 0,
            averageResponseTime: parseFloat(r.averageResponseTime) || 0,
          }));
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getTaskTypeStats failed:', error);
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
          // MariaDB 日期格式化
          const formatMap = {
            hour: '%Y-%m-%d %H:00',
            day: '%Y-%m-%d',
            week: '%Y-%U',
            month: '%Y-%m',
          };

          const results = await this.model.findAll({
            where: {
              createdAt: {
                [this.ctx.app.Sequelize.Op.gte]: startDate,
                [this.ctx.app.Sequelize.Op.lte]: endDate,
              },
            },
            attributes: [
              [
                this.ctx.app.Sequelize.fn('DATE_FORMAT', this.ctx.app.Sequelize.col('createdAt'), formatMap[groupBy]),
                'timeGroup',
              ],
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'count'],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('totalTokens')), 'totalTokens'],
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
            ],
            group: ['timeGroup'],
            order: [[this.ctx.app.Sequelize.literal('timeGroup'), 'ASC']],
            raw: true,
          });

          return results.map(r => ({
            _id: r.timeGroup,
            count: parseInt(r.count) || 0,
            totalTokens: parseInt(r.totalTokens) || 0,
            totalCost: parseFloat(r.totalCost) || 0,
            averageResponseTime: parseFloat(r.averageResponseTime) || 0,
          }));
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getUsageByTimeRange failed:', error);
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] findFailedLogs failed:', error);
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
          const where = {};
          if (filter.userId) where.userId = filter.userId;
          if (filter.modelId) where.modelId = filter.modelId;
          if (filter.taskType) where.taskType = filter.taskType;
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          const results = await this.model.findAll({
            where,
            attributes: [
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalCalls'],
              [
                this.ctx.app.Sequelize.fn(
                  'SUM',
                  this.ctx.app.Sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
                ),
                'successCalls',
              ],
              [
                this.ctx.app.Sequelize.fn(
                  'SUM',
                  this.ctx.app.Sequelize.literal("CASE WHEN status = 'failure' THEN 1 ELSE 0 END")
                ),
                'failedCalls',
              ],
            ],
            raw: true,
          });

          const totalCalls = parseInt(results[0].totalCalls) || 0;
          const successCalls = parseInt(results[0].successCalls) || 0;
          const failedCalls = parseInt(results[0].failedCalls) || 0;

          return {
            totalCalls,
            successCalls,
            failedCalls,
            successRate: totalCalls > 0 ? successCalls / totalCalls : 0,
          };
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getSuccessRate failed:', error);
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
          const where = {};
          if (filter.userId) where.userId = filter.userId;
          if (filter.modelId) where.modelId = filter.modelId;
          if (filter.taskType) where.taskType = filter.taskType;
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          const results = await this.model.findAll({
            where,
            attributes: [
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('responseTime')), 'averageResponseTime'],
            ],
            raw: true,
          });

          return parseFloat(results[0]?.averageResponseTime) || 0;
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getAverageResponseTime failed:', error);
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
          const where = {};
          if (filter.userId) where.userId = filter.userId;
          if (filter.modelId) where.modelId = filter.modelId;
          if (filter.taskType) where.taskType = filter.taskType;
          if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = startDate;
            if (endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = endDate;
          }

          // 总成本统计
          const totalResults = await this.model.findAll({
            where,
            attributes: [
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('AVG', this.ctx.app.Sequelize.col('cost')), 'averageCost'],
            ],
            raw: true,
          });

          // 按模型分组统计
          const costByModel = await this.model.findAll({
            where,
            attributes: [
              'modelId',
              [this.ctx.app.Sequelize.fn('SUM', this.ctx.app.Sequelize.col('cost')), 'totalCost'],
              [this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'count'],
            ],
            group: ['modelId'],
            order: [[this.ctx.app.Sequelize.literal('totalCost'), 'DESC']],
            raw: true,
          });

          return {
            totalCost: parseFloat(totalResults[0]?.totalCost) || 0,
            averageCost: parseFloat(totalResults[0]?.averageCost) || 0,
            costByModel: costByModel.map(r => ({
              _id: r.modelId,
              totalCost: parseFloat(r.totalCost) || 0,
              count: parseInt(r.count) || 0,
            })),
          };
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] getCostStats failed:', error);
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
          return await this.model.bulkCreate(logs);
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] batchCreate failed:', error);
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

          const deletedCount = await this.model.destroy({
            where: {
              createdAt: {
                [this.ctx.app.Sequelize.Op.lt]: cutoffDate,
              },
            },
          });

          return { deletedCount };
        } catch (error) {
          this.ctx.logger.error('[AIUsageLogMariaRepository] cleanupOldLogs failed:', error);
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
          const where = {};
          if (filter.userId) where.userId = filter.userId;
          if (filter.modelId) where.modelId = filter.modelId;
          if (filter.taskType) where.taskType = filter.taskType;
          if (filter.startDate || filter.endDate) {
            where.createdAt = {};
            if (filter.startDate) where.createdAt[this.ctx.app.Sequelize.Op.gte] = filter.startDate;
            if (filter.endDate) where.createdAt[this.ctx.app.Sequelize.Op.lte] = filter.endDate;
          }

          const logs = await this.model.findAll({ where, raw: true });

          if (format === 'json') {
            return logs;
          }

          // CSV 格式
          if (format === 'csv') {
            const headers = ['ID', 'UserID', 'TaskType', 'ModelID', 'Status', 'Cost', 'ResponseTime', 'CreatedAt'];
            const rows = logs.map(log => [
              log.id,
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] exportLogs failed:', error);
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
          this.ctx.logger.error('[AIUsageLogMariaRepository] getTokenUsageTrend failed:', error);
          throw this.exceptions.RepositoryError('Failed to get token usage trend', {
            startDate,
            endDate,
            groupBy,
            error: error.message,
          });
        }
      }
    };
  }

  return AIUsageLogMariaRepositoryClass;
}

// 导出工厂函数，在注册时调用以获取类
module.exports = getAIUsageLogMariaRepository;
