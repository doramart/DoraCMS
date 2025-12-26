import type { APIErrorResponse } from '../types';

/**
 * API 错误类
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly requestId: string;
  public readonly timestamp: string;
  public readonly details?: any;

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

    // 维护正确的原型链
    Object.setPrototypeOf(this, APIError.prototype);
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
      details: this.details,
    };
  }
}
