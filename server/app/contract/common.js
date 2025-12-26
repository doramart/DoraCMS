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
        docs: { type: 'array', itemType: 'object', description: '数据列表' },
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

  // API Key 列表响应
  apiKeyListResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          itemType: 'object',
          example: [
            {
              id: '507f1f77bcf86cd799439011',
              name: 'Production API Key',
              key: 'ak_1234567890abcdef',
              status: 'active',
              expiresAt: '2025-12-31T23:59:59.000Z',
              lastUsedAt: '2024-12-26T10:00:00.000Z',
              createdAt: '2024-01-01T00:00:00.000Z',
              permissions: ['read', 'write'],
              ipWhitelist: ['192.168.1.1'],
            },
          ],
          description: 'API Key 列表',
        },
        total: { type: 'integer', example: 10, description: '总记录数' },
        page: { type: 'integer', example: 1, description: '当前页码' },
        pageSize: { type: 'integer', example: 10, description: '每页数量' },
        totalPages: { type: 'integer', example: 1, description: '总页数' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },

  // API Key 详情响应
  apiKeyDetailResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011', description: 'API Key ID' },
        name: { type: 'string', example: 'Production API Key', description: 'API Key 名称' },
        key: { type: 'string', example: 'ak_1234567890abcdef', description: 'API Key（公开部分）' },
        secret: { type: 'string', example: 'sk_****masked****', description: 'API Secret（已脱敏）' },
        status: { type: 'string', example: 'active', description: '状态：active/disabled' },
        expiresAt: { type: 'string', example: '2025-12-31T23:59:59.000Z', description: '过期时间' },
        lastUsedAt: { type: 'string', example: '2024-12-26T10:00:00.000Z', description: '最后使用时间' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z', description: '创建时间' },
        permissions: { type: 'array', itemType: 'string', example: ['read', 'write'], description: '权限列表' },
        ipWhitelist: { type: 'array', itemType: 'string', example: ['192.168.1.1'], description: 'IP 白名单' },
        rateLimit: { type: 'integer', example: 1000, description: '速率限制（请求/小时）' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },

  // API Key 创建响应（包含完整 secret）
  apiKeyCreateResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011', description: 'API Key ID' },
        name: { type: 'string', example: 'Production API Key', description: 'API Key 名称' },
        key: { type: 'string', example: 'ak_1234567890abcdef', description: 'API Key（公开部分）' },
        secret: {
          type: 'string',
          example: 'sk_1234567890abcdef1234567890abcdef',
          description: 'API Secret（完整，仅创建时返回）',
        },
        status: { type: 'string', example: 'active', description: '状态' },
        expiresAt: { type: 'string', example: '2025-12-31T23:59:59.000Z', description: '过期时间' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z', description: '创建时间' },
        permissions: { type: 'array', itemType: 'string', example: ['read', 'write'], description: '权限列表' },
        ipWhitelist: { type: 'array', itemType: 'string', example: ['192.168.1.1'], description: 'IP 白名单' },
        rateLimit: { type: 'integer', example: 1000, description: '速率限制（请求/小时）' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },

  // API Key 创建请求
  apiKeyCreateRequest: {
    name: { type: 'string', required: true, example: 'Production API Key', description: 'API Key 名称' },
    permissions: { type: 'array', itemType: 'string', example: ['read', 'write'], description: '权限列表' },
    ipWhitelist: { type: 'array', itemType: 'string', example: ['192.168.1.1'], description: 'IP 白名单' },
    rateLimit: { type: 'integer', example: 1000, description: '速率限制（请求/小时）' },
    expiresAt: { type: 'string', example: '2025-12-31T23:59:59.000Z', description: '过期时间' },
  },

  // API Key 更新请求
  apiKeyUpdateRequest: {
    name: { type: 'string', example: 'Updated API Key', description: 'API Key 名称' },
    permissions: { type: 'array', itemType: 'string', example: ['read'], description: '权限列表' },
    ipWhitelist: {
      type: 'array',
      itemType: 'string',
      example: ['192.168.1.1', '192.168.1.2'],
      description: 'IP 白名单',
    },
    rateLimit: { type: 'integer', example: 2000, description: '速率限制（请求/小时）' },
    expiresAt: { type: 'string', example: '2026-12-31T23:59:59.000Z', description: '过期时间' },
  },

  // API Key 统计响应
  apiKeyStatsResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 10, description: '总数' },
        active: { type: 'integer', example: 8, description: '活跃数量' },
        disabled: { type: 'integer', example: 2, description: '禁用数量' },
        expired: { type: 'integer', example: 1, description: '过期数量' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },

  // API Key 清理响应
  apiKeyCleanupResponse: {
    status: { type: 'integer', example: 200 },
    data: {
      type: 'object',
      properties: {
        deletedCount: { type: 'integer', example: 3, description: '删除的过期 API Key 数量' },
      },
    },
    message: { type: 'string', example: '' },
    timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    requestId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
  },
};
