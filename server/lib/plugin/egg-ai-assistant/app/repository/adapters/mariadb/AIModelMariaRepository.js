/**
 * AI Model MariaDB Repository
 * 继承 BaseMariaRepository，实现 AI 模型的数据访问
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

// 缓存动态创建的类
let AIModelMariaRepositoryClass = null;

/**
 * 获取 AIModelMariaRepository 类（延迟创建）
 * @param {Application} app Egg Application 实例
 * @return {Class} AIModelMariaRepository 类
 */
function getAIModelMariaRepository(app) {
  if (!AIModelMariaRepositoryClass) {
    // 动态加载基类
    const BaseMariaRepository = BaseRepositoryLoader.getBaseMariaRepository(app);

    // 动态创建继承类
    AIModelMariaRepositoryClass = class AIModelMariaRepository extends BaseMariaRepository {
      constructor(ctx) {
        // 调用父类构造函数
        super(ctx, 'AIModel');

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
          this.model = this.connection.getModel('AIModel');

          if (!this.model) {
            throw new Error('AIModel 模型未找到，请检查模型加载顺序');
          }

          // 注册模型和关联关系
          this.registerModel({
            mariaModel: this.model,
            relations: {
              fallbackModel: {
                model: this.connection.getModel('AIModel'),
                type: 'belongsTo',
                foreignKey: 'fallbackModelId',
                as: 'fallbackModel',
                select: ['id', 'displayName', 'provider', 'modelName'],
              },
            },
          });
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] Initialization failed:', error);
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
        return ['fallbackModel'];
      }

      /**
       * 获取默认的搜索字段
       */
      _getDefaultSearchKeys() {
        return ['displayName', 'description', 'modelName'];
      }

      /**
       * 获取默认的排序配置
       */
      _getDefaultSort() {
        return [
          { field: 'priority', order: 'desc' },
          { field: 'createdAt', order: 'desc' },
        ];
      }

      /**
       * 根据提供商和模型名查找
       * @param {String} provider 提供商
       * @param {String} modelName 模型名称
       * @return {Promise<Object|null>}
       */
      async findByProviderAndModel(provider, modelName) {
        try {
          const result = await this.findOne({
            filters: {
              provider: { $eq: provider },
              modelName: { $eq: modelName },
            },
          });
          return result;
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] findByProviderAndModel failed:', error);
          throw this.exceptions.RepositoryError('Failed to find AI model', {
            provider,
            modelName,
            error: error.message,
          });
        }
      }

      /**
       * 获取启用的模型列表
       * @param {String} taskType 任务类型（可选）
       * @return {Promise<Array>}
       */
      async findEnabledModels(taskType = null) {
        try {
          const filters = {
            isEnabled: { $eq: true },
          };

          // MariaDB: JSON 数组查询
          // supportedTasks 是 JSON 类型字段，存储数组
          if (taskType) {
            // 使用 JSON_CONTAINS 函数
            filters.supportedTasks = { $contains: taskType };
          }

          const result = await this.find(
            { isPaging: '0' }, // 不分页，返回所有结果
            {
              filters,
              populate: [], // 🔥 临时修复：禁用关联查询，避免表别名问题
              sort: [
                { field: 'priority', order: 'desc' },
                { field: 'costPerRequest', order: 'asc' },
              ],
            }
          );

          return result;
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] findEnabledModels failed:', error);
          throw this.exceptions.RepositoryError('Failed to find enabled AI models', {
            taskType,
            error: error.message,
          });
        }
      }

      /**
       * 根据任务类型获取最优模型
       * @param {String} taskType 任务类型
       * @return {Promise<Object|null>}
       */
      async findOptimalModel(taskType) {
        try {
          const models = await this.findEnabledModels(taskType);
          return models.length > 0 ? models[0] : null;
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] findOptimalModel failed:', error);
          throw this.exceptions.RepositoryError('Failed to find optimal AI model', {
            taskType,
            error: error.message,
          });
        }
      }

      /**
       * 更新模型统计信息
       * 使用 Sequelize 的 increment 方法
       * @param {String} id 模型ID
       * @param {Object} stats 统计数据 {calls, tokens, cost, averageResponseTime}
       * @return {Promise<Object>}
       */
      async updateStats(id, stats) {
        try {
          const model = await this.model.findByPk(id);

          if (!model) {
            throw this.exceptions.NotFoundError('AI Model not found', { id });
          }

          // 获取当前统计数据
          const currentStats = model.statistics || {};

          // 更新统计字段
          const newStats = {
            totalCalls: (currentStats.totalCalls || 0) + (stats.calls || 1),
            totalTokens: (currentStats.totalTokens || 0) + (stats.tokens || 0),
            totalCost: (currentStats.totalCost || 0) + (stats.cost || 0),
            successRate: currentStats.successRate || 1.0,
            averageResponseTime: stats.averageResponseTime || currentStats.averageResponseTime || 0,
            lastUsedAt: new Date(),
          };

          // 更新模型
          model.statistics = newStats;
          await model.save();

          return model.toJSON();
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] updateStats failed:', error);
          throw this.exceptions.RepositoryError('Failed to update AI model stats', {
            id,
            stats,
            error: error.message,
          });
        }
      }

      /**
       * 更新模型健康状态
       * @param {String} id 模型ID
       * @param {Object} healthData 健康数据
       * @return {Promise<Object>}
       */
      async updateHealthStatus(id, healthData) {
        try {
          const model = await this.model.findByPk(id);

          if (!model) {
            throw this.exceptions.NotFoundError('AI Model not found', { id });
          }

          const currentHealth = model.health || {};

          model.health = {
            ...currentHealth,
            isHealthy: healthData.isHealthy,
            lastCheckTime: healthData.lastCheckTime || new Date(),
            errorCount: healthData.errorCount !== undefined ? healthData.errorCount : currentHealth.errorCount,
            lastError: healthData.lastError || currentHealth.lastError,
          };

          await model.save();
          return model.toJSON();
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] updateHealthStatus failed:', error);
          throw this.exceptions.RepositoryError('Failed to update health status', {
            id,
            error: error.message,
          });
        }
      }

      /**
       * 批量启用/禁用模型
       * @param {Array} modelIds 模型ID数组
       * @param {Boolean} isEnabled 是否启用
       * @return {Promise<Object>}
       */
      async batchUpdateStatus(modelIds, isEnabled) {
        try {
          const [affectedCount] = await this.model.update(
            { isEnabled },
            {
              where: {
                id: modelIds,
              },
            }
          );

          return {
            modifiedCount: affectedCount,
            matchedCount: affectedCount,
          };
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] batchUpdateStatus failed:', error);
          throw this.exceptions.RepositoryError('Failed to batch update status', {
            modelIds,
            isEnabled,
            error: error.message,
          });
        }
      }

      /**
       * 根据提供商查找所有模型
       * @param {String} provider 提供商
       * @param {Object} options 查询选项
       * @return {Promise<Array>}
       */
      async findByProvider(provider, options = {}) {
        try {
          return await this.find(
            { isPaging: '0' },
            {
              filters: { provider: { $eq: provider } },
              ...options,
            }
          );
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] findByProvider failed:', error);
          throw this.exceptions.RepositoryError('Failed to find models by provider', {
            provider,
            error: error.message,
          });
        }
      }

      /**
       * 获取模型统计摘要
       * @param {String} modelId 模型ID
       * @param {Date} startDate 开始日期
       * @param {Date} endDate 结束日期
       * @return {Promise<Object>}
       */
      async getStatsSummary(modelId = null, startDate = null, endDate = null) {
        try {
          // MariaDB 使用 Sequelize 的聚合函数
          const where = modelId ? { id: modelId } : {};

          const results = await this.model.findAll({
            where,
            attributes: [[this.ctx.app.Sequelize.fn('COUNT', this.ctx.app.Sequelize.col('id')), 'totalModels']],
            raw: true,
          });

          // 由于 statistics 是 JSON 字段，需要在应用层计算
          const models = await this.model.findAll({ where, raw: true });

          let totalCalls = 0;
          let totalTokens = 0;
          let totalCost = 0;
          let totalResponseTime = 0;
          let count = 0;

          models.forEach(model => {
            const stats = model.statistics || {};
            totalCalls += stats.totalCalls || 0;
            totalTokens += stats.totalTokens || 0;
            totalCost += stats.totalCost || 0;
            totalResponseTime += stats.averageResponseTime || 0;
            count++;
          });

          return {
            totalModels: count,
            totalCalls,
            totalTokens,
            totalCost,
            avgResponseTime: count > 0 ? totalResponseTime / count : 0,
          };
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] getStatsSummary failed:', error);
          throw this.exceptions.RepositoryError('Failed to get stats summary', {
            modelId,
            error: error.message,
          });
        }
      }

      /**
       * 检查模型配置完整性
       * @param {String} id 模型ID
       * @return {Promise<Object>}
       */
      async validateModelConfig(id) {
        try {
          const model = await this.findById(id);
          if (!model) {
            throw this.exceptions.NotFoundError('AI Model not found', { id });
          }

          const missingFields = [];
          const config = model.config || {};

          // 检查必需字段
          if (!config.apiKey) missingFields.push('apiKey');
          if (!config.apiEndpoint) missingFields.push('apiEndpoint');

          return {
            isValid: missingFields.length === 0,
            missingFields,
          };
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] validateModelConfig failed:', error);
          throw this.exceptions.RepositoryError('Failed to validate model config', {
            id,
            error: error.message,
          });
        }
      }

      /**
       * 获取降级链
       * @param {String} modelId 主模型ID
       * @return {Promise<Array>}
       */
      async getFallbackChain(modelId) {
        try {
          const chain = [];
          let currentId = modelId;
          const visited = new Set();

          // 防止循环引用
          while (currentId && !visited.has(currentId)) {
            visited.add(currentId);

            const model = await this.findById(currentId, {
              populate: ['fallbackModel'],
            });

            if (!model) break;

            chain.push(model);

            // 获取下一个降级模型
            currentId = model.fallbackModelId;
          }

          return chain;
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] getFallbackChain failed:', error);
          throw this.exceptions.RepositoryError('Failed to get fallback chain', {
            modelId,
            error: error.message,
          });
        }
      }

      /**
       * 根据成本范围查找模型
       * @param {Number} minCost 最小成本
       * @param {Number} maxCost 最大成本
       * @param {Object} options 查询选项
       * @return {Promise<Array>}
       */
      async findByCostRange(minCost, maxCost, options = {}) {
        try {
          return await this.find(
            { isPaging: '0' },
            {
              filters: {
                costPerRequest: { $gte: minCost, $lte: maxCost },
              },
              ...options,
            }
          );
        } catch (error) {
          this.ctx.logger.error('[AIModelMariaRepository] findByCostRange failed:', error);
          throw this.exceptions.RepositoryError('Failed to find models by cost range', {
            minCost,
            maxCost,
            error: error.message,
          });
        }
      }
    };
  }

  return AIModelMariaRepositoryClass;
}

// 导出工厂函数，在注册时调用以获取类
module.exports = getAIModelMariaRepository;
