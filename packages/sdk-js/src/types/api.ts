/**
 * API 请求和响应类型定义
 */

import type {
  ContentCategory,
  ContentTag,
  User,
  APIKey,
  APIKeyStats,
  Webhook,
  WebhookLog,
  HealthCheckResponse,
  AliveResponse,
  ReadyResponse,
} from './models';

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名或邮箱 */
  userName: string;
  /** 密码 */
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  /** 用户名 */
  userName: string;
  /** 密码 */
  password: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phoneNum?: string;
}

/**
 * 内容列表请求参数
 */
export interface ContentListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 状态过滤 */
  state?: string;
  /** 分类过滤 */
  category?: string;
  /** 标签过滤 */
  tag?: string;
  /** 关键词搜索 */
  keyword?: string;
  /** 是否置顶 */
  isTop?: boolean;
  /** 是否推荐 */
  isRecommend?: boolean;
}

/**
 * 内容创建请求
 */
export interface ContentCreateRequest {
  /** 标题 */
  title: string;
  /** 简介 */
  stitle?: string;
  /** 关键词 */
  keywords?: string[];
  /** 作者 */
  author?: string;
  /** 来源 */
  from?: string;
  /** 封面图 */
  coverImage?: string;
  /** 内容 */
  content?: string;
  /** 摘要 */
  discription?: string;
  /** 状态 */
  state?: string;
  /** 模板类型 */
  type?: string;
  /** 分类 ID 列表 */
  categories?: string[];
  /** 标签 ID 列表 */
  tags?: string[];
  /** 是否置顶 */
  isTop?: boolean;
  /** 是否推荐 */
  isRecommend?: boolean;
}

/**
 * 内容更新请求
 */
export interface ContentUpdateRequest extends Partial<ContentCreateRequest> {
  /** ID */
  id: string;
}

/**
 * 批量删除请求
 */
export interface BatchDeleteRequest {
  /** ID 列表 */
  ids: string[];
}

/**
 * 批量删除响应
 */
export interface BatchDeleteResponse {
  /** 删除数量 */
  deletedCount: number;
}

/**
 * API Key 创建请求
 */
export interface APIKeyCreateRequest {
  /** 名称 */
  name: string;
  /** 权限列表 */
  permissions?: string[];
  /** IP 白名单 */
  ipWhitelist?: string[];
  /** 速率限制（请求/小时） */
  rateLimit?: number;
  /** 过期时间 */
  expiresAt?: string;
}

/**
 * API Key 更新请求
 */
export interface APIKeyUpdateRequest {
  /** 名称 */
  name?: string;
  /** 权限列表 */
  permissions?: string[];
  /** IP 白名单 */
  ipWhitelist?: string[];
  /** 速率限制（请求/小时） */
  rateLimit?: number;
  /** 过期时间 */
  expiresAt?: string;
  /** 状态 */
  status?: string;
}

/**
 * API Key 清理响应
 */
export interface APIKeyCleanupResponse {
  /** 删除数量 */
  deletedCount: number;
}

/**
 * Webhook 创建请求
 */
export interface WebhookCreateRequest {
  /** 名称 */
  name: string;
  /** 回调 URL */
  url: string;
  /** 事件类型列表 */
  events: string[];
  /** 密钥（可选，不提供则自动生成） */
  secret?: string;
}

/**
 * Webhook 更新请求
 */
export interface WebhookUpdateRequest {
  /** 名称 */
  name?: string;
  /** 回调 URL */
  url?: string;
  /** 事件类型列表 */
  events?: string[];
  /** 状态 */
  status?: string;
}

/**
 * Webhook 日志查询参数
 */
export interface WebhookLogParams {
  /** Webhook ID */
  webhookId?: string;
  /** 事件类型 */
  event?: string;
  /** 是否成功 */
  success?: boolean;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * Webhook 重试请求
 */
export interface WebhookRetryRequest {
  /** 日志 ID */
  logId: string;
}

/**
 * 用户列表请求参数
 */
export interface UserListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 角色过滤 */
  role?: string;
  /** 关键词搜索 */
  keyword?: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 用户创建请求
 */
export interface UserCreateRequest {
  /** 用户名 */
  userName: string;
  /** 密码 */
  password: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phoneNum?: string;
  /** 昵称 */
  name?: string;
  /** 头像 */
  logo?: string;
  /** 角色 */
  group?: string;
}

/**
 * 用户更新请求
 */
export interface UserUpdateRequest {
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phoneNum?: string;
  /** 昵称 */
  name?: string;
  /** 头像 */
  logo?: string;
  /** 角色 */
  group?: string;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 分类列表请求参数
 */
export interface CategoryListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 是否启用 */
  enable?: boolean;
}

/**
 * 分类创建请求
 */
export interface CategoryCreateRequest {
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
}

/**
 * 分类更新请求
 */
export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {}

/**
 * 标签列表请求参数
 */
export interface TagListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 关键词搜索 */
  keyword?: string;
}

/**
 * 标签创建请求
 */
export interface TagCreateRequest {
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
}

/**
 * 标签更新请求
 */
export interface TagUpdateRequest extends Partial<TagCreateRequest> {}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  /** 文件 URL */
  url: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;
}

// 重新导出模型类型（避免重复导出）
export type {
  ContentCategory,
  ContentTag,
  User,
  APIKey,
  APIKeyStats,
  Webhook,
  WebhookLog,
  HealthCheckResponse,
  AliveResponse,
  ReadyResponse,
};
