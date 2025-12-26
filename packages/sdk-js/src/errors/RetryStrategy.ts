import { APIError } from './APIError';
import type { RetryConfig } from '../types';

/**
 * 重试上下文
 */
export interface RetryContext {
  /** 当前重试次数 */
  attempt: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 错误对象 */
  error: APIError;
  /** 请求配置 */
  requestConfig: any;
}

/**
 * 重试决策结果
 */
export interface RetryDecision {
  /** 是否应该重试 */
  shouldRetry: boolean;
  /** 延迟时间（毫秒） */
  delay: number;
  /** 原因 */
  reason?: string;
}

/**
 * 重试策略类
 * 提供灵活的重试逻辑
 */
export class RetryStrategy {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      retryableStatusCodes: config.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504],
      retryableErrorCodes: config.retryableErrorCodes ?? [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'ECONNABORTED',
        'ECONNREFUSED',
        'ENOTFOUND',
      ],
    };
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(context: RetryContext): RetryDecision {
    const { attempt, maxRetries, error, requestConfig } = context;

    // 如果禁用了重试
    if (!this.config.enabled) {
      return {
        shouldRetry: false,
        delay: 0,
        reason: 'Retry disabled',
      };
    }

    // 如果已达到最大重试次数
    if (attempt >= maxRetries) {
      return {
        shouldRetry: false,
        delay: 0,
        reason: `Max retries (${maxRetries}) reached`,
      };
    }

    // 只重试幂等请求（GET、HEAD、OPTIONS、PUT、DELETE）
    const method = requestConfig?.method?.toUpperCase();
    if (method && !this.isIdempotentMethod(method)) {
      return {
        shouldRetry: false,
        delay: 0,
        reason: `Non-idempotent method: ${method}`,
      };
    }

    // 检查错误是否可重试
    if (!this.isRetryableError(error)) {
      return {
        shouldRetry: false,
        delay: 0,
        reason: `Non-retryable error: ${error.type}`,
      };
    }

    // 计算延迟时间
    const delay = this.calculateDelay(attempt, error);

    return {
      shouldRetry: true,
      delay,
      reason: `Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
    };
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: APIError): boolean {
    // 使用 APIError 的 isRetryable 方法
    if (error.isRetryable()) {
      return true;
    }

    // 检查状态码
    if (this.config.retryableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    // 检查错误码
    if (this.config.retryableErrorCodes?.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * 判断是否为幂等方法
   */
  private isIdempotentMethod(method: string): boolean {
    const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
    return idempotentMethods.includes(method);
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(attempt: number, error: APIError): number {
    // 如果错误对象指定了 retryAfter，优先使用
    if (error.retryAfter) {
      return error.retryAfter;
    }

    // 如果错误对象有建议的延迟，使用它
    const suggestedDelay = error.getRetryDelay();
    if (suggestedDelay > this.config.retryDelay) {
      return suggestedDelay;
    }

    // 使用配置的延迟策略
    if (this.config.exponentialBackoff) {
      // 指数退避：delay * 2^attempt，加上随机抖动
      const exponentialDelay = this.config.retryDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // 0-1000ms 随机抖动
      return Math.min(exponentialDelay + jitter, 60000); // 最大 60 秒
    } else {
      // 固定延迟，加上随机抖动
      const jitter = Math.random() * 500; // 0-500ms 随机抖动
      return this.config.retryDelay + jitter;
    }
  }

  /**
   * 执行延迟
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<RetryConfig> {
    return { ...this.config };
  }
}
