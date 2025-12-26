/**
 * 业务模型类型定义
 * 基于 DoraCMS 数据模型
 */

/**
 * 内容状态
 */
export enum ContentState {
  /** 草稿 */
  DRAFT = '0',
  /** 已发布 */
  PUBLISHED = '1',
  /** 已删除 */
  DELETED = '2',
}

/**
 * 内容模板类型
 */
export enum ContentTemplate {
  /** 标准模板 */
  STANDARD = '0',
  /** 图文模板 */
  IMAGE_TEXT = '1',
  /** 视频模板 */
  VIDEO = '2',
}

/**
 * 内容类别
 */
export interface ContentCategory {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 默认 URL */
  defaultUrl?: string;
  /** 排序 */
  sortId?: number;
  /** 是否启用 */
  enable?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** URL */
  url?: string;
}

/**
 * 内容标签
 */
export interface ContentTag {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** URL */
  url?: string;
}

/**
 * 用户角色
 */
export enum UserRole {
  /** 超级管理员 */
  SUPER_ADMIN = '0',
  /** 管理员 */
  ADMIN = '1',
  /** 普通用户 */
  USER = '2',
}

/**
 * 用户
 */
export interface User {
  /** ID */
  id: string;
  /** 用户名 */
  userName: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phoneNum?: string;
  /** 昵称 */
  name?: string;
  /** 头像 */
  logo?: string;
  /** 角色 */
  group?: UserRole;
  /** 是否启用 */
  enable?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * API Key 状态
 */
export enum APIKeyStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 禁用 */
  DISABLED = 'disabled',
}

/**
 * API Key
 */
export interface APIKey {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** API Key（公开部分） */
  key: string;
  /** API Secret（已脱敏，仅创建时返回完整） */
  secret?: string;
  /** 状态 */
  status: APIKeyStatus;
  /** 权限列表 */
  permissions?: string[];
  /** IP 白名单 */
  ipWhitelist?: string[];
  /** 速率限制（请求/小时） */
  rateLimit?: number;
  /** 过期时间 */
  expiresAt?: string;
  /** 最后使用时间 */
  lastUsedAt?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * API Key 统计
 */
export interface APIKeyStats {
  /** 总数 */
  total: number;
  /** 活跃数量 */
  active: number;
  /** 禁用数量 */
  disabled: number;
  /** 过期数量 */
  expired: number;
}

/**
 * Webhook 事件类型
 */
export enum WebhookEventType {
  /** 内容创建 */
  CONTENT_CREATED = 'content.created',
  /** 内容更新 */
  CONTENT_UPDATED = 'content.updated',
  /** 内容删除 */
  CONTENT_DELETED = 'content.deleted',
  /** 用户注册 */
  USER_REGISTERED = 'user.registered',
  /** 用户更新 */
  USER_UPDATED = 'user.updated',
  /** 用户删除 */
  USER_DELETED = 'user.deleted',
}

/**
 * Webhook 状态
 */
export enum WebhookStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 禁用 */
  DISABLED = 'disabled',
}

/**
 * Webhook
 */
export interface Webhook {
  /** ID */
  id: string;
  /** 名称 */
  name: string;
  /** 回调 URL */
  url: string;
  /** 事件类型 */
  events: WebhookEventType[];
  /** 状态 */
  status: WebhookStatus;
  /** 密钥（用于签名验证） */
  secret?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * Webhook 日志
 */
export interface WebhookLog {
  /** ID */
  id: string;
  /** Webhook ID */
  webhookId: string;
  /** 事件类型 */
  event: WebhookEventType;
  /** 请求 URL */
  url: string;
  /** 请求体 */
  payload?: any;
  /** 响应状态码 */
  statusCode?: number;
  /** 响应体 */
  response?: any;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 重试次数 */
  retryCount?: number;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 健康检查状态
 */
export enum HealthStatus {
  /** 健康 */
  HEALTHY = 'healthy',
  /** 降级 */
  DEGRADED = 'degraded',
  /** 不健康 */
  UNHEALTHY = 'unhealthy',
}

/**
 * 服务健康状态
 */
export interface ServiceHealth {
  /** 状态 */
  status: HealthStatus | 'ready' | 'not ready';
  /** 消息 */
  message?: string;
}

/**
 * 内存使用情况
 */
export interface MemoryUsage {
  /** RSS */
  rss: string;
  /** 堆总量 */
  heapTotal: string;
  /** 堆使用量 */
  heapUsed: string;
  /** 外部内存 */
  external: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  /** 状态 */
  status: HealthStatus;
  /** 时间戳 */
  timestamp: string;
  /** 运行时间（秒） */
  uptime: number;
  /** 版本 */
  version: string;
  /** 环境 */
  environment: string;
  /** 数据库类型 */
  databaseType: string;
  /** 服务状态 */
  services: {
    mongodb?: ServiceHealth;
    mariadb?: ServiceHealth;
    redis?: ServiceHealth;
  };
  /** 内存使用 */
  memory: MemoryUsage;
}

/**
 * 存活检查响应
 */
export interface AliveResponse {
  /** 状态 */
  status: 'alive';
  /** 时间戳 */
  timestamp: string;
  /** 运行时间（秒） */
  uptime: number;
}

/**
 * 就绪检查响应
 */
export interface ReadyResponse {
  /** 状态 */
  status: 'ready' | 'not ready';
  /** 时间戳 */
  timestamp: string;
  /** 数据库类型 */
  databaseType: string;
  /** 服务状态 */
  services: {
    mongodb?: 'ready' | 'not ready';
    mariadb?: 'ready' | 'not ready';
  };
}
