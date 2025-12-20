/**
 * 重试辅助工具
 * 提供智能重试机制，处理 AI 服务调用失败的情况
 */
'use strict';

/**
 * 可重试的错误类型
 */
const RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'RATE_LIMIT_ERROR',
  'SERVER_ERROR',
  'TIMEOUT',
  '503',
  '502',
  '429',
];

/**
 * 重试策略类型
 */
const RETRY_STRATEGIES = {
  FIXED: 'fixed', // 固定延迟
  EXPONENTIAL: 'exponential', // 指数退避
  LINEAR: 'linear', // 线性增加
  JITTER: 'jitter', // 随机抖动
};

class RetryHelper {
  /**
   * 执行带重试的异步操作
   * @param {Function} fn - 要执行的异步函数
   * @param {Object} options - 重试选项
   * @return {Promise<any>} 执行结果
   */
  static async execute(fn, options = {}) {
    const {
      maxRetries = 3,
      strategy = RETRY_STRATEGIES.EXPONENTIAL,
      baseDelay = 1000,
      maxDelay = 30000,
      shouldRetry = this._defaultShouldRetry,
      onRetry = null,
      logger = console,
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        // 判断是否应该重试
        if (attempt < maxRetries && shouldRetry(error, attempt)) {
          const delay = this._calculateDelay(attempt, strategy, baseDelay, maxDelay);

          logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

          // 调用重试回调
          if (onRetry) {
            onRetry(error, attempt, delay);
          }

          // 等待后重试
          await this._sleep(delay);
        } else {
          // 不应该重试或已达到最大重试次数
          break;
        }
      }
    }

    // 所有重试都失败，抛出最后一个错误
    throw lastError;
  }

  /**
   * 默认的重试判断逻辑
   * @param {Error} error - 错误对象
   * @param {Number} attempt - 当前重试次数
   * @return {Boolean} 是否应该重试
   * @private
   */
  static _defaultShouldRetry(error, attempt) {
    // 检查错误类型是否在可重试列表中
    const errorCode = error.code || error.status || error.statusCode || '';
    const errorMessage = error.message || '';

    return RETRYABLE_ERRORS.some(
      retryableError => errorCode.toString().includes(retryableError) || errorMessage.includes(retryableError)
    );
  }

  /**
   * 计算延迟时间
   * @param {Number} attempt - 当前重试次数
   * @param {String} strategy - 重试策略
   * @param {Number} baseDelay - 基础延迟
   * @param {Number} maxDelay - 最大延迟
   * @return {Number} 延迟时间（毫秒）
   * @private
   */
  static _calculateDelay(attempt, strategy, baseDelay, maxDelay) {
    let delay;

    switch (strategy) {
      case RETRY_STRATEGIES.FIXED:
        // 固定延迟
        delay = baseDelay;
        break;

      case RETRY_STRATEGIES.LINEAR:
        // 线性增加：baseDelay * (attempt + 1)
        delay = baseDelay * (attempt + 1);
        break;

      case RETRY_STRATEGIES.EXPONENTIAL:
        // 指数退避：baseDelay * 2^attempt
        delay = baseDelay * Math.pow(2, attempt);
        break;

      case RETRY_STRATEGIES.JITTER:
        // 指数退避 + 随机抖动
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * baseDelay;
        delay = exponentialDelay + jitter;
        break;

      default:
        delay = baseDelay;
    }

    // 限制最大延迟
    return Math.min(delay, maxDelay);
  }

  /**
   * 睡眠指定毫秒数
   * @param {Number} ms - 毫秒数
   * @return {Promise<void>}
   * @private
   */
  static _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建速率限制重试策略
   * @param {Number} requestsPerMinute - 每分钟请求数限制
   * @return {Object} 重试配置
   */
  static createRateLimitStrategy(requestsPerMinute) {
    const delayBetweenRequests = Math.ceil(60000 / requestsPerMinute);

    return {
      maxRetries: 5,
      strategy: RETRY_STRATEGIES.EXPONENTIAL,
      baseDelay: delayBetweenRequests,
      maxDelay: 60000,
      shouldRetry: error => {
        const errorCode = error.code || error.status || error.statusCode || '';
        return errorCode.toString().includes('429') || error.message.includes('rate limit');
      },
    };
  }

  /**
   * 创建网络错误重试策略
   * @return {Object} 重试配置
   */
  static createNetworkErrorStrategy() {
    return {
      maxRetries: 3,
      strategy: RETRY_STRATEGIES.EXPONENTIAL,
      baseDelay: 1000,
      maxDelay: 10000,
      shouldRetry: error => {
        const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH'];
        const errorCode = error.code || '';
        return networkErrors.some(code => errorCode.includes(code));
      },
    };
  }

  /**
   * 创建服务器错误重试策略
   * @return {Object} 重试配置
   */
  static createServerErrorStrategy() {
    return {
      maxRetries: 3,
      strategy: RETRY_STRATEGIES.JITTER,
      baseDelay: 2000,
      maxDelay: 30000,
      shouldRetry: error => {
        const status = error.status || error.statusCode || 0;
        return status >= 500 && status < 600;
      },
    };
  }

  /**
   * 组合多个重试策略
   * @param {Array<Object>} strategies - 策略数组
   * @return {Object} 组合后的重试配置
   */
  static combineStrategies(strategies) {
    return {
      maxRetries: Math.max(...strategies.map(s => s.maxRetries || 0)),
      strategy: RETRY_STRATEGIES.JITTER, // 默认使用抖动策略
      baseDelay: Math.min(...strategies.map(s => s.baseDelay || Infinity)),
      maxDelay: Math.max(...strategies.map(s => s.maxDelay || 0)),
      shouldRetry: (error, attempt) => {
        // 任何一个策略认为应该重试就重试
        return strategies.some(s => (s.shouldRetry ? s.shouldRetry(error, attempt) : false));
      },
    };
  }

  /**
   * 带断路器的重试（Circuit Breaker Pattern）
   * @param {Function} fn - 要执行的异步函数
   * @param {Object} options - 选项
   * @return {Promise<any>} 执行结果
   */
  static async executeWithCircuitBreaker(fn, options = {}) {
    const {
      maxRetries = 3,
      failureThreshold = 5, // 失败阈值
      resetTimeout = 60000, // 重置超时（毫秒）
      logger = console,
    } = options;

    // 断路器状态
    if (!this._circuitBreakerState) {
      this._circuitBreakerState = {
        failures: 0,
        lastFailureTime: null,
        isOpen: false,
      };
    }

    const state = this._circuitBreakerState;

    // 检查断路器是否打开
    if (state.isOpen) {
      const timeSinceLastFailure = Date.now() - state.lastFailureTime;

      if (timeSinceLastFailure < resetTimeout) {
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      }

      // 尝试半开状态
      state.isOpen = false;
      logger.info('Circuit breaker entering half-open state');
    }

    try {
      const result = await this.execute(fn, { ...options, maxRetries });

      // 成功，重置失败计数
      state.failures = 0;
      return result;
    } catch (error) {
      // 失败，增加计数
      state.failures++;
      state.lastFailureTime = Date.now();

      // 检查是否达到阈值
      if (state.failures >= failureThreshold) {
        state.isOpen = true;
        logger.warn(`Circuit breaker opened after ${state.failures} failures`);
      }

      throw error;
    }
  }

  /**
   * 重置断路器状态
   */
  static resetCircuitBreaker() {
    this._circuitBreakerState = {
      failures: 0,
      lastFailureTime: null,
      isOpen: false,
    };
  }
}

// 导出重试策略常量
RetryHelper.STRATEGIES = RETRY_STRATEGIES;
RetryHelper.RETRYABLE_ERRORS = RETRYABLE_ERRORS;

module.exports = RetryHelper;
