/**
 * SystemOptionLog Service - 使用 Repository 模式
 * 基于重构后的标准化服务层 - 三层架构优化版本 (2024)
 * 🔥 继承基类功能，专注业务逻辑
 * ✅ 统一异常处理，移除重复try-catch
 * 🎯 支持MongoDB/MariaDB双数据库
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');

class SystemOptionLogService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 SystemOptionLog Repository
    this.repository = this.repositoryFactory.createSystemOptionLogRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   * @description
   * 🏗️ 架构优化：Service 层只设置业务默认值，参数标准化由 BaseStandardRepository 统一处理
   * - BaseStandardRepository 已支持: filters||query, fields||files 的兼容性处理
   * - Service 层职责：设置业务相关的默认搜索字段
   * - 与其他 18 个 Service 保持一致的实现模式
   */
  async find(payload = {}, options = {}) {
    // 🎯 只设置业务层面的默认搜索字段
    const defaultOptions = {
      searchKeys: ['logs', 'error_message', 'request_path', 'user_name'],
    };

    return await this.repository.find(payload, { ...defaultOptions, ...options });
  }

  /**
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 统计记录数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 记录数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建记录
   * @param {Object} data 记录数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    return await this.repository.update(id, data);
  }

  /**
   * 删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { is_handled: true }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // ===== 🔥 兼容原有接口的方法 =====

  /**
   * 兼容原有的removes接口
   * @param values
   * @param key
   */
  async removes(values, key = 'id') {
    return await this.remove(values, key);
  }

  /**
   * 兼容原有的item接口
   * @param params
   */
  async item(params = {}) {
    return await this.findOne(params.query || {}, params);
  }

  /**
   * 清空所有记录
   * @return {Promise<Object>} 删除结果
   */
  async removeAll() {
    return await this.repository.removeAll();
  }

  // ========== 以下是扩展的新功能方法 ==========

  /**
   * 根据类型查找日志
   * @param {String} type 日志类型
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async findByType(type, payload = {}, options = {}) {
    return await this.repository.findByType(type, payload, options);
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
    return await this.repository.findByDateRange(startDate, endDate, payload, options);
  }

  /**
   * 根据关键词搜索日志内容
   * @param {String} keyword 搜索关键词
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object|Array>} 查询结果
   */
  async searchByLogs(keyword, payload = {}, options = {}) {
    return await this.repository.searchByLogs(keyword, payload, options);
  }

  /**
   * 根据时间清理日志
   * @param {Date|String} beforeDate 清理此时间之前的日志
   * @return {Promise<Object>} 删除结果
   */
  async removeByDate(beforeDate) {
    return await this.repository.removeByDate(beforeDate);
  }

  /**
   * 根据类型清理日志
   * @param {String} type 日志类型
   * @return {Promise<Object>} 删除结果
   */
  async removeByType(type) {
    return await this.repository.removeByType(type);
  }

  /**
   * 获取日志统计信息
   * @param {Object} options 统计选项
   * @return {Promise<Object>} 统计结果
   */
  async getLogStats(options = {}) {
    return await this.repository.getLogStats(options);
  }

  /**
   * 批量创建日志记录
   * @param {Array} logs 日志记录数组
   * @return {Promise<Object>} 创建结果
   */
  async createBatch(logs) {
    return await this.repository.createBatch(logs);
  }

  /**
   * 获取最近的日志记录
   * @param {Number} limit 限制数量
   * @param {String} type 日志类型（可选）
   * @return {Promise<Array>} 最近的日志记录
   */
  async getRecentLogs(limit = 100, type = null) {
    return await this.repository.getRecentLogs(limit, type);
  }

  /**
   * 获取异常日志统计
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 异常统计结果
   */
  async getExceptionStats(options = {}) {
    return await this.repository.getExceptionStats(options);
  }

  // ========== 业务相关的便捷方法 ==========

  /**
   * 记录用户登录日志
   * @param {Object} userData 用户数据
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logUserLogin(userData, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'login',
        logs: `用户 ${userData.userName || userData.name} 登录成功`,
        severity: 'low',
        business: {
          module: 'auth',
          action: 'login',
        },
        tags: ['authentication', 'success', 'login'],
      })
      .setUser(userData, {
        userType: userData.role === 'admin' ? 'admin' : 'user',
      })
      .setResponse(200)
      .build();

    return await this.create(logData);
  }

  /**
   * 记录用户登出日志
   * @param {Object} userData 用户数据
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logUserLogout(userData, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'logout',
        logs: `用户 ${userData.userName || userData.name} 登出系统`,
        severity: 'low',
        business: {
          module: 'auth',
          action: 'logout',
        },
        tags: ['authentication', 'logout'],
      })
      .setUser(userData, {
        userType: userData.role === 'admin' ? 'admin' : 'user',
      })
      .build();

    return await this.create(logData);
  }

  /**
   * 记录系统异常日志
   * @param {Error} error 错误对象
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logException(error, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'exception',
        logs: `系统异常: ${error.message}`,
        severity: options.severity || 'high',
        error,
        tags: ['system', 'exception', 'error'],
      })
      .setResponse(options.status || 500)
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 记录操作日志
   * @param {String} operation 操作类型
   * @param {String} description 操作描述
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logOperation(operation, description, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'operation',
        logs: `${operation}: ${description}`,
        severity: options.severity || 'medium',
        business: {
          module: options.module,
          action: options.action || operation,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          oldValue: options.oldValue,
          newValue: options.newValue,
        },
        tags: ['operation', operation.toLowerCase(), ...(options.tags || [])],
      })
      .setResponse(options.responseStatus, options.responseTime)
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 记录访问日志
   * @param {Object} request 请求对象
   * @param {Number} responseTime 响应时间
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logAccess(request = {}, responseTime = 0, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const actualRequest = request.path ? request : this.ctx.request;
    const method = actualRequest.method || this.ctx.request.method;
    const path = actualRequest.path || this.ctx.request.path;

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'access',
        logs: `API访问: ${method} ${path}`,
        severity: 'low',
        tags: ['api', 'access', method.toLowerCase()],
      })
      .setResponse(options.status || this.ctx.status, responseTime, options.responseSize)
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 记录业务错误日志
   * @param {String} message 错误消息
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logBusinessError(message, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'error',
        logs: message,
        severity: options.severity || 'high',
        business: {
          module: options.module,
          action: options.action,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
        },
        tags: ['business', 'error', ...(options.tags || [])],
      })
      .setError({
        message,
        code: options.errorCode,
      })
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 记录警告日志
   * @param {String} message 警告消息
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logWarning(message, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'warning',
        logs: message,
        severity: 'medium',
        business: {
          module: options.module,
          action: options.action,
        },
        tags: ['warning', ...(options.tags || [])],
      })
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 记录信息日志
   * @param {String} message 信息内容
   * @param {Object} options 选项
   * @return {Promise<Object>} 创建结果
   */
  async logInfo(message, options = {}) {
    const LogDataBuilder = require('../utils/log/LogDataBuilder');

    const logData = LogDataBuilder.create()
      .fromContext(this.ctx, {
        type: 'info',
        logs: message,
        severity: 'low',
        business: {
          module: options.module,
        },
        tags: ['info', ...(options.tags || [])],
      })
      .setExtraData(options.extraData || {})
      .build();

    return await this.create(logData);
  }

  /**
   * 清理过期日志
   * @param {Number} days 保留天数
   * @param {Array} types 要清理的日志类型（可选）
   * @return {Promise<Object>} 清理结果
   */
  async cleanExpiredLogs(days = 30, types = []) {
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - days);

    let totalDeleted = 0;

    if (types.length === 0) {
      // 清理所有过期日志
      const result = await this.removeByDate(beforeDate);
      totalDeleted = result.deletedCount || 0;
    } else {
      // 按类型清理
      for (const type of types) {
        // 查找指定类型的过期日志
        const logs = await this.findByType(
          type,
          { isPaging: '0' },
          {
            query: { createdAt: { $lt: beforeDate } },
          }
        );

        if (logs.length > 0) {
          const ids = logs.map(log => log.id);
          const result = await this.repository.remove(ids);
          totalDeleted += result.deletedCount || 0;
        }
      }
    }

    return {
      deletedCount: totalDeleted,
      beforeDate,
      types,
    };
  }

  /**
   * 获取日志仪表板数据
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 仪表板数据
   */
  async getDashboardData(options = {}) {
    const { dateRange = null } = options;

    // 基础统计
    const totalCount = await this.count();
    const typeStats = await this.getLogStats({ groupBy: 'type', dateRange });
    const exceptionStats = await this.getExceptionStats({ dateRange });

    // 最近日志
    const recentLogs = await this.getRecentLogs(10);

    // 严重程度统计（如果是 MariaDB）
    let severityStats = null;
    try {
      severityStats = await this.getLogStats({ groupBy: 'severity', dateRange });
    } catch (error) {
      // MongoDB 可能不支持 severity 字段
      this.ctx.logger.warn('Severity stats not available:', error.message);
    }

    return {
      summary: {
        total: totalCount,
        exceptions: exceptionStats.totalExceptions,
        recentCount: recentLogs.length,
      },
      typeStats: typeStats.stats,
      severityStats: severityStats?.stats || [],
      exceptionTrend: exceptionStats.dailyStats,
      recentLogs,
      dateRange,
    };
  }

  /**
   * 获取 Repository 统计信息（调试用）
   * @return {Object} 统计信息
   */
  async getRepositoryStats() {
    return await this.repositoryFactory.getStats();
  }
}

module.exports = SystemOptionLogService;
