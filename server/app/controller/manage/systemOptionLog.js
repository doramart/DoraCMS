/**
 * SystemOptionLog Controller
 * 基于三层架构优化版本 (2024)
 * 🔥 移除重复try-catch，交给全局错误中间件处理
 * ✅ 标准化参数格式，使用操作符格式查询
 * 🎯 专注业务逻辑，简化代码结构
 */
'use strict';

const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const SystemOptionLogController = {
  /**
   * 获取系统操作日志列表
   * 🔥 支持前端所有11个搜索条件
   * @param {Context} ctx EggJS 上下文
   */
  async list(ctx) {
    const payload = ctx.query;

    // 🔥 构建标准化查询条件
    const filters = {};

    // 1. 精确匹配：日志类型
    if (payload.type) {
      filters.type = { $eq: payload.type };
    }

    // 2. 精确匹配：所属模块
    if (payload.module) {
      filters.module = { $eq: payload.module };
    }

    // 3. 精确匹配：操作动作
    if (payload.action) {
      filters.action = { $eq: payload.action };
    }

    // 4. 模糊匹配：用户名
    if (payload.user_name) {
      filters.user_name = { $regex: payload.user_name, $options: 'i' };
    }

    // 5. 精确匹配：用户类型
    if (payload.user_type) {
      filters.user_type = { $eq: payload.user_type };
    }

    // 6. 精确匹配：严重程度
    if (payload.severity) {
      filters.severity = { $eq: payload.severity };
    }

    // 7. 精确匹配：运行环境
    if (payload.environment) {
      filters.environment = { $eq: payload.environment };
    }

    // 8. 精确匹配：IP地址
    if (payload.ip_address) {
      filters.ip_address = { $eq: payload.ip_address };
    }

    // 9-10. 时间范围查询（支持前端的 start_date 和 end_date）
    const startDate = payload.start_date || payload.startDate;
    const endDate = payload.end_date || payload.endDate;

    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filters.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.createdAt = { $lte: new Date(endDate) };
    }

    // 设置查询选项
    const options = {
      filters,
      // 返回前端表格需要的所有字段
      fields: [
        'id',
        'type',
        'logs',
        'module',
        'action',
        'user_name',
        'user_type',
        'ip_address',
        'request_path',
        'request_method',
        'response_status',
        'response_time',
        'response_size',
        'severity',
        'environment',
        'resource_type',
        'resource_id',
        'old_value',
        'new_value',
        'error_message',
        'error_code',
        'error_stack',
        'is_handled',
        'tags',
        'trace_id',
        'session_id',
        'user_agent',
        'client_platform',
        'client_version',
        'request_params',
        'request_body',
        'request_query',
        'extra_data',
        'createdAt',
        'updatedAt',
      ],
      // 11. 关键词搜索：在 logs, error_message, request_path 中搜索
      searchKeys: payload.keyword ? ['logs', 'error_message', 'request_path', 'user_name'] : undefined,
    };

    const systemOptionLogList = await ctx.service.systemOptionLog.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: systemOptionLogList,
    });
  },

  /**
   * 批量删除系统操作日志
   * @param {Context} ctx EggJS 上下文
   */
  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('systemLog.fields.id'),
    });

    await ctx.service.systemOptionLog.removes(idsArray);

    ctx.helper.renderSuccess(ctx, {
      message: ctx.__('systemLog.messages.deleteSuccess'),
    });
  },

  /**
   * 清空所有系统操作日志
   * @param {Context} ctx EggJS 上下文
   */
  async removeAll(ctx) {
    await ctx.service.systemOptionLog.removeAll();

    ctx.helper.renderSuccess(ctx, {
      message: '清空成功',
    });
  },

  /**
   * 根据类型查找日志
   * @param {Context} ctx EggJS 上下文
   */
  async findByType(ctx) {
    const { type } = ctx.params;
    const payload = ctx.query;

    // 参数验证
    if (!type) {
      return ctx.helper.renderFail(ctx, {
        message: '日志类型不能为空',
      });
    }

    const options = {
      fields: ['id', 'type', 'logs', 'createdAt', 'typeText'],
    };

    const result = await ctx.service.systemOptionLog.findByType(type, payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 根据时间范围查找日志
   * @param {Context} ctx EggJS 上下文
   */
  async findByDateRange(ctx) {
    const { startDate, endDate } = ctx.query;
    const payload = ctx.query;

    // 参数验证
    if (!startDate || !endDate) {
      return ctx.helper.renderFail(ctx, {
        message: '开始时间和结束时间不能为空',
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return ctx.helper.renderFail(ctx, {
        message: '开始时间不能晚于结束时间',
      });
    }

    const options = {
      fields: ['id', 'type', 'logs', 'createdAt'],
    };

    const result = await ctx.service.systemOptionLog.findByDateRange(startDate, endDate, payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 获取日志统计信息
   * @param {Context} ctx EggJS 上下文
   */
  async getStats(ctx) {
    const { groupBy = 'type', startDate, endDate } = ctx.query;

    const options = {};
    if (startDate && endDate) {
      options.dateRange = {
        start: startDate,
        end: endDate,
      };
    }

    options.groupBy = groupBy;

    const stats = await ctx.service.systemOptionLog.getLogStats(options);

    ctx.helper.renderSuccess(ctx, {
      data: stats,
    });
  },

  /**
   * 获取最近的日志记录
   * @param {Context} ctx EggJS 上下文
   */
  async getRecentLogs(ctx) {
    const { limit = 50, type } = ctx.query;

    const recentLogs = await ctx.service.systemOptionLog.getRecentLogs(parseInt(limit), type || null);

    ctx.helper.renderSuccess(ctx, {
      data: recentLogs,
    });
  },

  /**
   * 获取异常日志统计
   * @param {Context} ctx EggJS 上下文
   */
  async getExceptionStats(ctx) {
    const { startDate, endDate } = ctx.query;

    const options = {};
    if (startDate && endDate) {
      options.dateRange = {
        start: startDate,
        end: endDate,
      };
    }

    const exceptionStats = await ctx.service.systemOptionLog.getExceptionStats(options);

    ctx.helper.renderSuccess(ctx, {
      data: exceptionStats,
    });
  },

  /**
   * 按日志内容搜索
   * @param {Context} ctx EggJS 上下文
   */
  async searchByLogs(ctx) {
    const { keyword } = ctx.query;
    const payload = ctx.query;

    // 参数验证
    if (!keyword || keyword.trim() === '') {
      return ctx.helper.renderFail(ctx, {
        message: '搜索关键词不能为空',
      });
    }

    const options = {
      fields: ['id', 'type', 'logs', 'createdAt', 'typeText'],
    };

    const result = await ctx.service.systemOptionLog.searchByLogs(keyword.trim(), payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 根据时间清理日志
   * @param {Context} ctx EggJS 上下文
   */
  async removeByDate(ctx) {
    const { beforeDate } = ctx.request.body;

    // 参数验证
    if (!beforeDate) {
      return ctx.helper.renderFail(ctx, {
        message: '清理时间不能为空',
      });
    }

    const beforeDateTime = new Date(beforeDate);
    if (isNaN(beforeDateTime.getTime())) {
      return ctx.helper.renderFail(ctx, {
        message: '时间格式不正确',
      });
    }

    // 防止误删近期日志（保护机制）
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    if (beforeDateTime > threeDaysAgo) {
      return ctx.helper.renderFail(ctx, {
        message: ctx.__('systemLog.messages.preventRecentDelete'),
      });
    }

    const result = await ctx.service.systemOptionLog.removeByDate(beforeDate);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: ctx.__('systemLog.messages.cleanupComplete', [result.deletedCount]),
    });
  },

  /**
   * 根据类型清理日志
   * @param {Context} ctx EggJS 上下文
   */
  async removeByType(ctx) {
    const { type } = ctx.request.body;

    // 参数验证
    if (!type) {
      return ctx.helper.renderFail(ctx, {
        message: '日志类型不能为空',
      });
    }

    const result = await ctx.service.systemOptionLog.removeByType(type);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: ctx.__('systemLog.messages.cleanupTypeComplete', [result.deletedCount, type]),
    });
  },
};

module.exports = SystemOptionLogController;
