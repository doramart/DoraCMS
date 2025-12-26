/**
 * 重试配置
 */
export interface RetryConfig {
  /** 是否启用自动重试 */
  enabled?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否使用指数退避 */
  exponentialBackoff?: boolean;
  /** 可重试的 HTTP 状态码 */
  retryableStatusCodes?: number[];
  /** 可重试的错误码 */
  retryableErrorCodes?: string[];
}

/**
 * SDK 配置选项
 */
export interface SDKConfig {
  /** API 基础 URL */
  apiUrl: string;
  /** API 密钥（用于 API Key 认证） */
  apiKey?: string;
  /** API 密钥 Secret（用于签名） */
  apiSecret?: string;
  /** JWT Token（用于 JWT 认证） */
  token?: string;
  /** API 版本 */
  version?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否自动刷新 Token */
  autoRefreshToken?: boolean;
  /** Token 存储方式 */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  /** 重试配置 */
  retry?: RetryConfig;
  /** 是否记录错误日志 */
  logErrors?: boolean;
  /** 认证错误回调 */
  onAuthError?: (error: any) => Promise<boolean>;
  /** 通用错误回调 */
  onError?: (error: any) => void;
}

/**
 * API 响应格式
 */
export interface APIResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: string;
  timestamp: string;
  requestId: string;
}

/**
 * API 错误响应
 */
export interface APIErrorResponse {
  status: 'error';
  code: string;
  message: string;
  timestamp: string;
  requestId: string;
  details?: any;
  retryAfter?: number | string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 请求配置
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  data?: any; // 支持 DELETE 等请求的 body
}

// 导出业务模型类型
export * from './models';

// 导出 API 请求/响应类型
export * from './api';
