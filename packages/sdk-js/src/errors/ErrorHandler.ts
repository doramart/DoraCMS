import { APIError, ErrorType } from './APIError';

/**
 * 错误处理器配置
 */
export interface ErrorHandlerConfig {
  /** 是否在控制台打印错误 */
  logErrors?: boolean;
  /** 自定义错误日志函数 */
  logger?: (error: APIError) => void;
  /** 错误回调函数 */
  onError?: (error: APIError) => void;
  /** 认证错误回调（用于自动刷新 Token） */
  onAuthError?: (error: APIError) => Promise<boolean>;
  /** 速率限制回调 */
  onRateLimitError?: (error: APIError) => void;
}

/**
 * 错误处理器类
 * 提供统一的错误处理和转换逻辑
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      logErrors: config.logErrors ?? true,
      logger: config.logger,
      onError: config.onError,
      onAuthError: config.onAuthError,
      onRateLimitError: config.onRateLimitError,
    };
  }

  /**
   * 处理错误
   */
  async handle(error: APIError): Promise<void> {
    // 记录错误
    if (this.config.logErrors) {
      this.logError(error);
    }

    // 调用自定义日志函数
    if (this.config.logger) {
      this.config.logger(error);
    }

    // 根据错误类型执行特定处理
    switch (error.type) {
      case ErrorType.AUTH:
        await this.handleAuthError(error);
        break;
      case ErrorType.RATE_LIMIT:
        this.handleRateLimitError(error);
        break;
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        this.handleNetworkError(error);
        break;
      case ErrorType.SERVER:
        this.handleServerError(error);
        break;
      default:
        break;
    }

    // 调用通用错误回调
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * 处理认证错误
   */
  private async handleAuthError(error: APIError): Promise<void> {
    if (this.config.onAuthError) {
      try {
        const refreshed = await this.config.onAuthError(error);
        if (refreshed) {
          console.log('[ErrorHandler] Token refreshed successfully');
        }
      } catch (err) {
        console.error('[ErrorHandler] Failed to refresh token:', err);
      }
    }
  }

  /**
   * 处理速率限制错误
   */
  private handleRateLimitError(error: APIError): void {
    if (this.config.onRateLimitError) {
      this.config.onRateLimitError(error);
    }

    const retryAfter = error.retryAfter || error.getRetryDelay();
    console.warn(
      `[ErrorHandler] Rate limit exceeded. Retry after ${retryAfter}ms`
    );
  }

  /**
   * 处理网络错误
   */
  private handleNetworkError(error: APIError): void {
    console.warn('[ErrorHandler] Network error:', error.message);
  }

  /**
   * 处理服务端错误
   */
  private handleServerError(error: APIError): void {
    console.error('[ErrorHandler] Server error:', error.message);
  }

  /**
   * 记录错误到控制台
   */
  private logError(error: APIError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId: error.requestId,
      timestamp: error.timestamp,
      details: error.details,
    };

    switch (error.severity) {
      case 'CRITICAL':
      case 'HIGH':
        console.error('[SDK Error]', logData);
        break;
      case 'MEDIUM':
        console.warn('[SDK Error]', logData);
        break;
      case 'LOW':
        console.info('[SDK Error]', logData);
        break;
      default:
        console.log('[SDK Error]', logData);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
