/**
 * 优化后的 SystemOptionLog MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 SystemOptionLog 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 SystemOptionLog 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 SystemOptionLog 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const SystemOptionLogSchema = require('../../schemas/mariadb/SystemOptionLogSchema');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class SystemOptionLogMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'SystemOptionLog');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例，避免依赖连接管理器的缓存
      this.model = SystemOptionLogSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // SystemOptionLog 通常没有关联关系
        },
      });

      // console.log('✅ SystemOptionLogMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ SystemOptionLogMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - SystemOptionLog 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // SystemOptionLog 通常没有关联查询
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
   * 获取状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.SYSTEM_OPTION_LOG.TYPE_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从Schema获取所有字段，大幅减少维护成本
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 只需要定义需要排除的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // SystemOptionLog模块特有的需要排除的字段
    const moduleExcludeFields = [
      // 通常日志表没有需要排除的字段
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - SystemOptionLog 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item);

    // 添加日志类型文本描述
    if (item.type) {
      const typeMapping = this._getStatusMapping();
      item.typeText = typeMapping[item.type] || '未知';
    }

    // 格式化日志内容长度显示
    if (item.logs) {
      item.logsSummary = item.logs.length > 100 ? `${item.logs.substring(0, 100)}...` : item.logs;
    }

    // 🔥 处理 JSON 字段：确保返回的是对象而不是字符串
    // MariaDB 的 JSON 字段有时会以字符串形式返回，需要手动解析
    const jsonFields = [
      'tags',
      'extra_data',
      'request_params',
      'request_body',
      'request_query',
      'old_value',
      'new_value',
    ];

    jsonFields.forEach(field => {
      if (item[field] !== undefined && item[field] !== null) {
        // 如果是字符串，尝试解析为 JSON
        if (typeof item[field] === 'string') {
          try {
            item[field] = JSON.parse(item[field]);
          } catch (e) {
            // 如果解析失败，保持原值（可能本身就是普通字符串）
            this.app.logger.warn(`[SystemOptionLogMariaRepository] JSON 字段 ${field} 解析失败:`, e.message);
          }
        }
        // 如果已经是对象，保持不变
      }
    });

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - SystemOptionLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 添加 SystemOptionLog 特有的创建前处理
    // 设置默认值
    if (!data.type) data.type = 'operation'; // 默认操作类型
    if (!data.logs) data.logs = ''; // 默认空日志
    if (!data.severity) data.severity = 'medium'; // 默认严重程度

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - SystemOptionLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 添加 SystemOptionLog 特有的更新前处理

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
    const filters = { type: { $eq: type }, ...options.filters };
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
    await this._ensureConnection();

    try {
      const deletedCount = await this.model.destroy({ where: {} });
      this._logOperation('removeAll', {}, { deletedCount });
      return { deletedCount };
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
    await this._ensureConnection();

    try {
      const deletedCount = await this.model.destroy({
        where: {
          createdAt: { [this.Op.lt]: new Date(beforeDate) },
        },
      });
      this._logOperation('removeByDate', { beforeDate }, { deletedCount });
      return { deletedCount };
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
    await this._ensureConnection();

    try {
      const deletedCount = await this.model.destroy({
        where: { type },
      });
      this._logOperation('removeByType', { type }, { deletedCount });
      return { deletedCount };
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
    await this._ensureConnection();

    try {
      const { groupBy = 'type', dateRange } = options;

      const whereClause = {};
      if (dateRange) {
        whereClause.createdAt = {
          [this.Op.between]: [new Date(dateRange.start), new Date(dateRange.end)],
        };
      }

      let stats = [];

      if (groupBy === 'type') {
        stats = await this.model.findAll({
          attributes: ['type', [this.connection.sequelize.fn('COUNT', this.connection.sequelize.col('id')), 'count']],
          where: whereClause,
          group: ['type'],
          order: [[this.connection.sequelize.fn('COUNT', this.connection.sequelize.col('id')), 'DESC']],
        });
      } else if (groupBy === 'createdAt') {
        stats = await this.model.findAll({
          attributes: [
            [this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt')), 'createdAt'],
            [this.connection.sequelize.fn('COUNT', this.connection.sequelize.col('id')), 'count'],
          ],
          where: whereClause,
          group: [this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt'))],
          order: [[this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt')), 'DESC']],
        });
      }

      const totalCount = await this.count(whereClause);

      this._logOperation('getLogStats', options, { statsCount: stats.length, totalCount });

      return {
        stats: stats.map(stat => ({
          id: stat.get(groupBy === 'type' ? 'type' : 'createdAt'),
          count: parseInt(stat.get('count')),
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
    await this._ensureConnection();

    try {
      const processedLogs = logs.map(log => this._customPreprocessForCreate(log));
      const results = await this.model.bulkCreate(processedLogs);

      const processedResults = results.map(result => this._deepToJSON(result));
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
    const filters = type ? { type: { $eq: type } } : {};
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
    await this._ensureConnection();

    try {
      const { dateRange } = options;

      const whereClause = { type: 'exception' };
      if (dateRange) {
        whereClause.createdAt = {
          [this.Op.between]: [new Date(dateRange.start), new Date(dateRange.end)],
        };
      }

      const dailyStats = await this.model.findAll({
        attributes: [
          [this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt')), 'createdAt'],
          [this.connection.sequelize.fn('COUNT', this.connection.sequelize.col('id')), 'count'],
        ],
        where: whereClause,
        group: [this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt'))],
        order: [[this.connection.sequelize.fn('DATE', this.connection.sequelize.col('createdAt')), 'DESC']],
        limit: 30,
      });

      const totalExceptions = await this.count(whereClause);

      this._logOperation('getExceptionStats', options, {
        totalExceptions,
        dailyStatsCount: dailyStats.length,
      });

      return {
        totalExceptions,
        dailyStats: dailyStats.map(stat => ({
          id: { createdAt: stat.get('createdAt') },
          count: parseInt(stat.get('count')),
        })),
        dateRange: dateRange || null,
      };
    } catch (error) {
      this._handleError(error, 'getExceptionStats', options);
    }
  }
}

module.exports = SystemOptionLogMariaRepository;
