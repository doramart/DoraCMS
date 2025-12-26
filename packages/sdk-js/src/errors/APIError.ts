import type { APIErrorResponse } from '../types';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 认证错误 */
  AUTH = 'AUTH',
  /** 客户端错误（4xx） */
  CLIENT = 'CLIENT',
  /** 服务端错误（5xx） */
  SERVER = 'SERVER',
  /** 业务错误 */
  BUSINESS = 'BUSINESS',
  /** 验证错误 */
  VALIDATION = 'VALIDATION',
  /** 速率限制 */
  RATE_LIMIT = 'RATE_LIMIT',
  /** 超时错误 */
  TIMEOUT = 'TIMEOUT',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  /** 低 - 可以忽略或自动恢复 */
  LOW = 'LOW',
  /** 中 - 需要用户注意 */
  MEDIUM = 'MEDIUM',
  /** 高 - 需要立即处理 */
  HIGH = 'HIGH',
  /** 严重 - 系统级错误 */
  CRITICAL = 'CRITICAL',
}

/**
 * API 错误类
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId: string;
  public readonly timestamp: string;
  public readonly details?: any;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly originalError?: any;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    requestId: string,
    timestamp: string,
    details?: any,
    originalError?: any,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.timestamp = timestamp;
    this.details = details;
    this.originalError = originalError;
    this.retryAfter = retryAfter;
    this.type = this.determineErrorType();
    this.severity = this.determineSeverity();

    // 维护正确的原型链
    Object.setPrototypeOf(this, APIError.prototype);
  }

  /**
   * 根据状态码和错误码确定错误类型
   */
  private determineErrorType(): ErrorType {
    // 超时错误
    if (this.code === 'TIMEOUT_ERROR' || this.code === 'ECONNABORTED') {
      return ErrorType.TIMEOUT;
    }

    // 网络错误
    if (this.statusCode === 0 || this.code === 'NO_RESPONSE' || this.code === 'NETWORK_ERROR') {
      return ErrorType.NETWORK;
    }

    // 速率限制
    if (this.statusCode === 429 || this.code === 'RATE_LIMIT_ERROR') {
      return ErrorType.RATE_LIMIT;
    }

    // 认证错误
    if (this.statusCode === 401 || this.statusCode === 403 || this.code.includes('AUTH')) {
      return ErrorType.AUTH;
    }

    // 验证错误
    if (this.statusCode === 400 || this.code.includes('VALIDATION')) {
      return ErrorType.VALIDATION;
    }

    // 客户端错误
    if (this.statusCode >= 400 && this.statusCode < 500) {
      return ErrorType.CLIENT;
    }

    // 服务端错误
    if (this.statusCode >= 500) {
      return ErrorType.SERVER;
    }

    // 业务错误
    if (this.code.includes('BUSINESS')) {
      return ErrorType.BUSINESS;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(): ErrorSeverity {
    switch (this.type) {
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return ErrorSeverity.LOW; // 可自动恢复
      case ErrorType.VALIDATION:
      case ErrorType.RATE_LIMIT:
        return ErrorSeverity.MEDIUM; // 需要用户调整
      case ErrorType.AUTH:
        return ErrorSeverity.HIGH; // 需要重新认证
      case ErrorType.SERVER:
        return ErrorSeverity.CRITICAL; // 系统级问题
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 从 API 错误响应创建 APIError
   */
  static fromResponse(response: APIErrorResponse, statusCode: number): APIError {
    return new APIError(
      response.message,
      response.code,
      statusCode,
      response.requestId,
      response.timestamp,
      response.details
    );
  }

  /**
   * 创建网络错误
   */
  static networkError(message: string = 'Network error'): APIError {
    return new APIError(
      message,
      'NETWORK_ERROR',
      0,
      'unknown',
      new Date().toISOString()
    );
  }

  /**
   * 创建超时错误
   */
  static timeoutError(message: string = 'Request timeout'): APIError {
    return new APIError(
      message,
      'TIMEOUT_ERROR',
      0,
      'unknown',
      new Date().toISOString()
    );
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string, details?: any): APIError {
    return new APIError(
      message,
      'VALIDATION_ERROR',
      400,
      'unknown',
      new Date().toISOString(),
      details
    );
  }

  /**
   * 创建认证错误
   */
  static authError(message: string = 'Authentication failed'): APIError {
    return new APIError(
      message,
      'AUTH_ERROR',
      401,
      'unknown',
      new Date().toISOString()
    );
  }

  /**
   * 创建速率限制错误
   */
  static rateLimitError(message: string = 'Rate limit exceeded', retryAfter?: number): APIError {
    return new APIError(
      message,
      'RATE_LIMIT_ERROR',
      429,
      'unknown',
      new Date().toISOString(),
      undefined,
      undefined,
      retryAfter
    );
  }

  /**
   * 判断是否为网络错误
   */
  isNetworkError(): boolean {
    return this.type === ErrorType.NETWORK;
  }

  /**
   * 判断是否为认证错误
   */
  isAuthError(): boolean {
    return this.type === ErrorType.AUTH;
  }

  /**
   * 判断是否为服务端错误
   */
  isServerError(): boolean {
    return this.type === ErrorType.SERVER;
  }

  /**
   * 判断是否为客户端错误
   */
  isClientError(): boolean {
    return this.type === ErrorType.CLIENT;
  }

  /**
   * 判断是否为超时错误
   */
  isTimeoutError(): boolean {
    return this.type === ErrorType.TIMEOUT;
  }

  /**
   * 判断是否为验证错误
   */
  isValidationError(): boolean {
    return this.type === ErrorType.VALIDATION;
  }

  /**
   * 判断是否为速率限制错误
   */
  isRateLimitError(): boolean {
    return this.type === ErrorType.RATE_LIMIT;
  }

  /**
   * 判断是否为业务错误
   */
  isBusinessError(): boolean {
    return this.type === ErrorType.BUSINESS;
  }

  /**
   * 判断是否可以重试
   */
  isRetryable(): boolean {
    // 网络错误、超时错误、服务端错误（5xx）、速率限制可以重试
    return (
      this.isNetworkError() ||
      this.isTimeoutError() ||
      this.isServerError() ||
      this.isRateLimitError()
    );
  }

  /**
   * 判断是否需要重新认证
   */
  needsReauth(): boolean {
    return this.isAuthError();
  }

  /**
   * 获取建议的重试延迟（毫秒）
   */
  getRetryDelay(): number {
    if (this.retryAfter) {
      return this.retryAfter;
    }

    // 根据错误类型返回建议延迟
    switch (this.type) {
      case ErrorType.RATE_LIMIT:
        return 60000; // 1 分钟
      case ErrorType.SERVER:
        return 5000; // 5 秒
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return 1000; // 1 秒
      default:
        return 0;
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return '网络连接失败，请检查网络设置';
      case ErrorType.TIMEOUT:
        return '请求超时，请稍后重试';
      case ErrorType.AUTH:
        return '认证失败，请重新登录';
      case ErrorType.VALIDATION:
        return '输入数据有误，请检查后重试';
      case ErrorType.RATE_LIMIT:
        return '请求过于频繁，请稍后重试';
      case ErrorType.SERVER:
        return '服务器错误，请稍后重试';
      default:
        return this.message || '未知错误';
    }
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      requestId: this.requestId,
      timestamp: this.timestamp,
      type: this.type,
      severity: this.severity,
      details: this.details,
      retryAfter: this.retryAfter,
    };
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message} (${this.type}, ${this.severity})`;
  }
}
