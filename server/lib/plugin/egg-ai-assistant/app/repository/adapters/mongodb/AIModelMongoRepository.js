/**
 * AI Model MongoDB Repository
 * 继承 BaseMongoRepository，实现 AI 模型的数据访问
 *
 * 使用工厂函数模式动态创建类，解决 npm 发布后的路径问题
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('../../base/BaseRepositoryLoader');

/**
 * 创建 AIModel MongoDB Repository 类
 * @param {Application} app - EggJS Application 实例
 * @return {Class} AIModelMongoRepository 类
 */
function createAIModelMongoRepository(app) {
  // 动态加载基类
  const BaseMongoRepository = BaseRepositoryLoader.getBaseMongoRepository(app);

  // 动态创建继承类
  class AIModelMongoRepository extends BaseMongoRepository {
    constructor(ctx) {
      super(ctx, 'AIModel');

      // 设置 MongoDB Model（插件的模型需要通过 ctx.model 访问）
      this.model = ctx.model.AIModel;

      // 注册模型和关联关系
      this.registerModel({
        mongoModel: this.model,
        relations: {
          fallbackModel: {
            model: ctx.model.AIModel,
            path: 'fallbackModelId',
            select: ['displayName', 'provider', 'modelName', 'id'],
          },
          createdBy: {
            model: ctx.app.model.Admin,
            path: 'createdBy',
            select: ['userName', 'name', 'id'],
          },
          updatedBy: {
            model: ctx.app.model.Admin,
            path: 'updatedBy',
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
          path: 'fallbackModelId',
          select: ['displayName', 'provider', 'modelName', 'id'],
        },
      ];
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
        this.ctx.logger.error('[AIModelMongoRepository] findByProviderAndModel failed:', error);
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
          'health.isHealthy': { $eq: true },
        };

        // 如果指定了任务类型，添加过滤条件
        if (taskType) {
          filters.supportedTasks = { $elemMatch: { $eq: taskType } };
        }

        const result = await this.find(
          { isPaging: '0' }, // 不分页，返回所有结果
          {
            filters,
            sort: [
              { field: 'priority', order: 'desc' },
              { field: 'costPerRequest', order: 'asc' },
            ],
          }
        );

        return result;
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] findEnabledModels failed:', error);
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
        this.ctx.logger.error('[AIModelMongoRepository] findOptimalModel failed:', error);
        throw this.exceptions.RepositoryError('Failed to find optimal AI model', {
          taskType,
          error: error.message,
        });
      }
    }

    /**
     * 更新模型统计信息
     * 使用 MongoDB 原子操作
     * @param {String} id 模型ID
     * @param {Object} stats 统计数据 {calls, tokens, cost, averageResponseTime}
     * @return {Promise<Object>}
     */
    async updateStats(id, stats) {
      try {
        const updateData = {
          $inc: {
            'statistics.totalCalls': stats.calls || 1,
            'statistics.totalTokens': stats.tokens || 0,
          },
          $set: {
            'statistics.lastUsedAt': new Date(),
          },
        };

        // 成本累加
        if (stats.cost) {
          updateData.$inc['statistics.totalCost'] = stats.cost;
        }

        // 计算新的平均响应时间
        if (stats.averageResponseTime) {
          updateData.$set['statistics.averageResponseTime'] = stats.averageResponseTime;
        }

        // 使用 MongoDB 原生的 findOneAndUpdate 进行原子操作
        const result = await this.model.findByIdAndUpdate(id, updateData, {
          new: true, // 返回更新后的文档
          runValidators: true,
        });

        if (!result) {
          throw this.exceptions.NotFoundError('AI Model not found', { id });
        }

        return this._mapIdFromDatabase(result.toObject());
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] updateStats failed:', error);
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
        const updateData = {
          $set: {
            'health.isHealthy': healthData.isHealthy,
            'health.lastCheckTime': healthData.lastCheckTime || new Date(),
          },
        };

        if (healthData.errorCount !== undefined) {
          updateData.$set['health.errorCount'] = healthData.errorCount;
        }

        if (healthData.lastError) {
          updateData.$set['health.lastError'] = healthData.lastError;
        }

        const result = await this.model.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

        if (!result) {
          throw this.exceptions.NotFoundError('AI Model not found', { id });
        }

        return this._mapIdFromDatabase(result.toObject());
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] updateHealthStatus failed:', error);
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
        const result = await this.model.updateMany({ _id: { $in: modelIds } }, { $set: { isEnabled } });

        return {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        };
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] batchUpdateStatus failed:', error);
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
        this.ctx.logger.error('[AIModelMongoRepository] findByProvider failed:', error);
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
        const match = {};
        if (modelId) {
          match._id = modelId;
        }

        // 使用聚合查询统计
        const result = await this.model.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalModels: { $sum: 1 },
              totalCalls: { $sum: '$statistics.totalCalls' },
              totalTokens: { $sum: '$statistics.totalTokens' },
              totalCost: { $sum: '$statistics.totalCost' },
              avgResponseTime: { $avg: '$statistics.averageResponseTime' },
            },
          },
        ]);

        return (
          result[0] || {
            totalModels: 0,
            totalCalls: 0,
            totalTokens: 0,
            totalCost: 0,
            avgResponseTime: 0,
          }
        );
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] getStatsSummary failed:', error);
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
        this.ctx.logger.error('[AIModelMongoRepository] validateModelConfig failed:', error);
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
            populate: [{ path: 'fallbackModelId' }],
          });

          if (!model) break;

          chain.push(model);

          // 获取下一个降级模型
          currentId = model.fallbackModelId?._id || model.fallbackModelId;
        }

        return chain;
      } catch (error) {
        this.ctx.logger.error('[AIModelMongoRepository] getFallbackChain failed:', error);
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
        this.ctx.logger.error('[AIModelMongoRepository] findByCostRange failed:', error);
        throw this.exceptions.RepositoryError('Failed to find models by cost range', {
          minCost,
          maxCost,
          error: error.message,
        });
      }
    }
  }

  return AIModelMongoRepository;
}

/**
 * 导出工厂函数
 * 用法：const AIModelMongoRepository = require('...')(app);
 */
module.exports = createAIModelMongoRepository;
