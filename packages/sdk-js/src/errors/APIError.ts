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
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
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

  constructor(
    message: string,
    code: string,
    statusCode: number,
    requestId: string,
    timestamp: string,
    details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.timestamp = timestamp;
    this.details = details;
    this.type = this.determineErrorType();

    // 维护正确的原型链
    Object.setPrototypeOf(this, APIError.prototype);
  }

  /**
   * 根据状态码和错误码确定错误类型
   */
  private determineErrorType(): ErrorType {
    // 网络错误
    if (this.statusCode === 0 || this.code === 'NO_RESPONSE' || this.code === 'NETWORK_ERROR') {
      return ErrorType.NETWORK;
    }

    // 认证错误
    if (this.statusCode === 401 || this.statusCode === 403 || this.code.includes('AUTH')) {
      return ErrorType.AUTH;
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
    if (this.code.includes('BUSINESS') || this.code.includes('VALIDATION')) {
      return ErrorType.BUSINESS;
    }

    return ErrorType.UNKNOWN;
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
   * 判断是否可以重试
   */
  isRetryable(): boolean {
    // 网络错误、超时错误、服务端错误（5xx）可以重试
    return (
      this.isNetworkError() ||
      this.code === 'TIMEOUT_ERROR' ||
      this.isServerError() ||
      this.statusCode === 429 // 速率限制
    );
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
      details: this.details,
    };
  }
}
