/**
 * 标准化的 SystemOptionLog MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class SystemOptionLogMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'SystemOptionLog');

    // 设置 MongoDB 模型
    this.model = this.app.model.SystemOptionLog;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // SystemOptionLog 通常没有关联关系，主要是日志记录
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // SystemOptionLog 通常不需要关联查询
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['logs', 'type'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' }, // 最新日志在前
    ];
  }

  /**
   * 重写状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.TYPE_TEXT;
  }

  /**
   * 子类自定义的数据项处理
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 添加日志类型文本描述
    if (item.type) {
      item.typeText = this._getStatusText(item.type);
    }

    // 格式化日志内容长度显示
    if (item.logs) {
      item.logsSummary = item.logs.length > 100 ? `${item.logs.substring(0, 100)}...` : item.logs;
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 设置默认值
    if (!data.type) {
      data.type = 'operation';
    }

    // 确保必要字段存在
    if (!data.logs) {
      data.logs = '';
    }

    return data;
  }

  // ===== 🔥 SystemOptionLog 特有的业务方法 =====

  /**
   * 根据操作类型查找日志
   * @param {String} type 操作类型
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByType(type, payload = {}, options = {}) {
    const filters = { type, ...options.filters };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 根据时间范围查找日志
   * @param {Date|String} startDate 开始时间
   * @param {Date|String} endDate 结束时间
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByDateRange(startDate, endDate, payload = {}, options = {}) {
    const filters = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      ...options.filters,
    };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 根据日志内容关键词搜索
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async searchByLogs(keyword, payload = {}, options = {}) {
    const filters = {
      logs: { $regex: keyword, $options: 'i' },
      ...options.filters,
    };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 清空所有日志
   * @return {Promise<Object>} 删除结果
   */
  async removeAll() {
    try {
      const result = await this.model.deleteMany({});
      this._logOperation('removeAll', {}, result);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'removeAll', {});
    }
  }

  /**
   * 清空指定时间范围的日志
   * @param {Date|String} beforeDate 清空此时间之前的日志
   * @return {Promise<Object>} 删除结果
   */
  async removeByDate(beforeDate) {
    try {
      const result = await this.model.deleteMany({
        createdAt: { $lt: new Date(beforeDate) },
      });
      this._logOperation('removeByDate', { beforeDate }, result);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'removeByDate', { beforeDate });
    }
  }

  /**
   * 清空指定类型的日志
   * @param {String} type 日志类型
   * @return {Promise<Object>} 删除结果
   */
  async removeByType(type) {
    try {
      const result = await this.model.deleteMany({ type });
      this._logOperation('removeByType', { type }, result);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this._handleError(error, 'removeByType', { type });
    }
  }

  /**
   * 获取日志统计信息
   * @param {Object} options 统计选项 { groupBy, dateRange }
   * @return {Promise<Object>} 统计结果
   */
  async getLogStats(options = {}) {
    try {
      const { groupBy = 'type', dateRange } = options;

      // 构建匹配条件
      const matchCondition = {};
      if (dateRange) {
        matchCondition.createdAt = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end),
        };
      }

      // 构建聚合管道
      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: `$${groupBy}`,
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ];

      const stats = await this.model.aggregate(pipeline);
      const totalCount = await this.count(matchCondition);

      this._logOperation('getLogStats', options, { statsCount: stats.length, totalCount });

      return {
        stats: stats.map(stat => ({
          id: stat._id,
          count: stat.count,
        })),
        totalCount,
        groupBy,
      };
    } catch (error) {
      this._handleError(error, 'getLogStats', options);
    }
  }

  /**
   * 批量创建日志记录
   * @param {Array} logs 日志记录数组
   * @return {Promise<Array>} 创建结果
   */
  async createBatch(logs) {
    try {
      const processedLogs = logs.map(log => this._preprocessDataForCreate(log));
      const results = await this.model.insertMany(processedLogs);

      const processedResults = results.map(result => this._postprocessData(result.toObject()));
      this._logOperation('createBatch', { count: logs.length }, { createdCount: results.length });

      return processedResults;
    } catch (error) {
      this._handleError(error, 'createBatch', { count: logs.length });
    }
  }

  /**
   * 获取最近的日志记录
   * @param {Number} limit 限制数量
   * @param {String} type 日志类型（可选）
   * @return {Promise<Array>} 最近的日志记录
   */
  async getRecentLogs(limit = 100, type = null) {
    const filters = type ? { type } : {};
    const options = {
      filters,
      sort: [{ field: 'createdAt', order: 'desc' }],
    };

    const payload = {
      current: 1,
      pageSize: limit,
      isPaging: '1',
    };

    const result = await this.find(payload, options);
    return result.isPaging ? result.docs : result;
  }

  /**
   * 获取异常日志统计
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 异常统计结果
   */
  async getExceptionStats(options = {}) {
    try {
      const { dateRange } = options;

      // 构建匹配条件
      const matchCondition = { type: 'exception' };
      if (dateRange) {
        matchCondition.createdAt = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end),
        };
      }

      // 按日期分组统计
      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ];

      const dailyStats = await this.model.aggregate(pipeline);
      const totalExceptions = await this.count(matchCondition);

      this._logOperation('getExceptionStats', options, {
        totalExceptions,
        dailyStatsCount: dailyStats.length,
      });

      return {
        totalExceptions,
        dailyStats: dailyStats.map(stat => ({
          id: { createdAt: stat._id },
          count: stat.count,
        })),
        dateRange: dateRange || null,
      };
    } catch (error) {
      this._handleError(error, 'getExceptionStats', options);
    }
  }

  /**
   * 批量更新日志状态（如果支持状态字段）
   * @param {Array} ids ID数组
   * @param {Object} updateData 更新数据
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdate(ids, updateData) {
    try {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const result = await this.model.updateMany(
        { _id: { $in: idArray } },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      this._logOperation('batchUpdate', { ids: idArray, updateData }, result);
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this._handleError(error, 'batchUpdate', { ids, updateData });
    }
  }
}

module.exports = SystemOptionLogMongoRepository;
