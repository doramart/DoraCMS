/**
 * 通用数据模型定义
 * 用于 Swagger API 文档
 */
'use strict';

module.exports = {
  // 统一成功响应
  successResponse: {
    status: { type: 'integer', example: 200, description: 'HTTP 状态码' },
    data: { type: 'object', description: '响应数据' },
    message: { type: 'string', example: '', description: '响应消息' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z', description: 'ISO 8601 时间戳' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000', description: '请求追踪 ID' },
  },

  // 统一错误响应
  errorResponse: {
    status: { type: 'integer', example: 400, description: 'HTTP 状态码' },
    code: { type: 'string', example: 'BAD_REQUEST', description: '错误码' },
    message: { type: 'string', example: 'Invalid parameters', description: '错误消息' },
    data: { type: 'object', description: '附加数据' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z', description: 'ISO 8601 时间戳' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000', description: '请求追踪 ID' },
  },

  // 分页响应
  paginationResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        docs: { type: 'array', items: { type: 'object' }, description: '数据列表' },
        total: { type: 'integer', example: 100, description: '总记录数' },
        page: { type: 'integer', example: 1, description: '当前页码' },
        pageSize: { type: 'integer', example: 10, description: '每页数量' },
        totalPages: { type: 'integer', example: 10, description: '总页数' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },

  // 健康检查响应
  healthCheckResponse: {
    status: { type: 'string', example: 'healthy', description: '健康状态：healthy/degraded/unhealthy' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    uptime: { type: 'number', example: 12345.67, description: '运行时间（秒）' },
    version: { type: 'string', example: '3.0.0', description: '应用版本' },
    environment: { type: 'string', example: 'production', description: '运行环境' },
    databaseType: { type: 'string', example: 'mongodb', description: '数据库类型' },
    services: {
      type: 'object',
      description: '各服务健康状态',
      properties: {
        mongodb: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            message: { type: 'string', example: 'Connected' },
          },
        },
        redis: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            message: { type: 'string', example: 'Connected' },
          },
        },
      },
    },
    memory: {
      type: 'object',
      description: '内存使用情况',
      properties: {
        rss: { type: 'string', example: '100MB' },
        heapTotal: { type: 'string', example: '50MB' },
        heapUsed: { type: 'string', example: '30MB' },
        external: { type: 'string', example: '5MB' },
      },
    },
  },

  // 存活检查响应
  aliveResponse: {
    status: { type: 'string', example: 'alive' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    uptime: { type: 'number', example: 12345.67 },
  },

  // 就绪检查响应
  readyResponse: {
    status: { type: 'string', example: 'ready', description: '就绪状态：ready/not ready' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    databaseType: { type: 'string', example: 'mongodb' },
    services: {
      type: 'object',
      properties: {
        mongodb: { type: 'string', example: 'ready' },
      },
    },
  },
};
