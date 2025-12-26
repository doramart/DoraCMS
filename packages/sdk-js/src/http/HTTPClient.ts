import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { SDKConfig, APIResponse, APIErrorResponse, RequestConfig, RetryConfig } from '../types';
import { APIError } from '../errors';
import { generateSignature } from '../utils';

/**
 * HTTP 客户端类
 * 封装 axios，提供统一的请求接口和错误处理
 */
export class HTTPClient {
  private axiosInstance: AxiosInstance;
  private config: SDKConfig;
  private tokenGetter?: () => string | null;
  private retryConfig: Required<RetryConfig>;

  constructor(config: SDKConfig) {
    this.config = config;

    // 设置默认重试配置
    this.retryConfig = {
      enabled: config.retry?.enabled ?? true,
      maxRetries: config.retry?.maxRetries ?? 3,
      retryDelay: config.retry?.retryDelay ?? 1000,
      exponentialBackoff: config.retry?.exponentialBackoff ?? true,
      retryableStatusCodes: config.retry?.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504],
      retryableErrorCodes: config.retry?.retryableErrorCodes ?? [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'ECONNABORTED',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
      ],
    };

    // 创建 axios 实例
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 设置请求拦截器
    this.setupRequestInterceptor();

    // 设置响应拦截器
    this.setupResponseInterceptor();
  }

  /**
   * 设置 Token 获取函数
   */
  setTokenGetter(getter: () => string | null) {
    this.tokenGetter = getter;
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptor() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 添加 API 版本
        if (this.config.version) {
          const version = this.config.version;
          // 如果 URL 不包含版本，添加版本前缀
          if (config.url && !config.url.startsWith(`/api/${version}`)) {
            config.url = `/api/${version}${config.url}`;
          }
        }

        // 添加认证信息
        if (this.config.apiKey && this.config.apiSecret) {
          // API Key 认证：生成签名
          const timestamp = Date.now().toString();
          const method = config.method?.toUpperCase() || 'GET';
          const path = config.url || '';
          const body = config.data;

          const signature = generateSignature(
            this.config.apiKey,
            this.config.apiSecret,
            timestamp,
            method,
            path,
            body
          );

          config.headers = config.headers || {};
          config.headers['X-API-Key'] = this.config.apiKey;
          config.headers['X-Timestamp'] = timestamp;
          config.headers['X-Signature'] = signature;
        } else if (this.tokenGetter) {
          // JWT 认证：添加 Bearer Token
          const token = this.tokenGetter();
          if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<APIResponse>) => {
        // 成功响应，直接返回
        return response;
      },
      async (error: AxiosError<APIErrorResponse>) => {
        // 错误响应，转换为 APIError
        const apiError = this.convertToAPIError(error);

        // 检查是否需要重试
        if (this.shouldRetry(error, apiError)) {
          const retryCount = (error.config as any)?.__retryCount || 0;
          
          if (retryCount < this.retryConfig.maxRetries) {
            // 增加重试计数
            (error.config as any).__retryCount = retryCount + 1;

            // 计算延迟时间
            const delay = this.calculateRetryDelay(retryCount);

            // 等待后重试
            await this.sleep(delay);

            // 重新发送请求
            return this.axiosInstance.request(error.config!);
          }
        }

        // 不重试或重试次数已用完，抛出错误
        throw apiError;
      }
    );
  }

  /**
   * 将 Axios 错误转换为 APIError
   */
  private convertToAPIError(error: AxiosError<APIErrorResponse>): APIError {
    if (error.response) {
      // 服务器返回了错误响应
      const { data, status } = error.response;
      if (data && data.status === 'error') {
        return APIError.fromResponse(data, status);
      } else {
        // 非标准错误响应
        return new APIError(
          error.message || 'Unknown error',
          'UNKNOWN_ERROR',
          status,
          'unknown',
          new Date().toISOString()
        );
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      if (error.code === 'ECONNABORTED') {
        return APIError.timeoutError('Request timeout');
      }
      return APIError.networkError('No response from server');
    } else {
      // 请求配置错误
      return new APIError(
        error.message || 'Request configuration error',
        'REQUEST_ERROR',
        0,
        'unknown',
        new Date().toISOString()
      );
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: AxiosError, apiError: APIError): boolean {
    // 如果禁用了重试，直接返回 false
    if (!this.retryConfig.enabled) {
      return false;
    }

    // 只重试 GET 请求（幂等性）
    const method = error.config?.method?.toUpperCase();
    if (method && method !== 'GET') {
      return false;
    }

    // 检查是否为可重试的错误
    if (apiError.isRetryable()) {
      return true;
    }

    // 检查状态码是否在可重试列表中
    if (this.retryConfig.retryableStatusCodes.includes(apiError.statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * 计算重试延迟时间
   */
  private calculateRetryDelay(retryCount: number): number {
    if (this.retryConfig.exponentialBackoff) {
      // 指数退避：delay * 2^retryCount
      return this.retryConfig.retryDelay * Math.pow(2, retryCount);
    } else {
      // 固定延迟
      return this.retryConfig.retryDelay;
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.get<APIResponse<T>>(url, this.buildConfig(config));
    return response.data;
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.post<APIResponse<T>>(
      url,
      data,
      this.buildConfig(config)
    );
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.put<APIResponse<T>>(
      url,
      data,
      this.buildConfig(config)
    );
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.delete<APIResponse<T>>(
      url,
      this.buildConfig(config)
    );
    return response.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.patch<APIResponse<T>>(
      url,
      data,
      this.buildConfig(config)
    );
    return response.data;
  }

  /**
   * 构建请求配置
   */
  private buildConfig(config?: RequestConfig): AxiosRequestConfig {
    if (!config) return {};

    return {
      headers: config.headers,
      params: config.params,
      timeout: config.timeout,
      data: config.data, // 支持 DELETE 请求的 body
    };
  }

  /**
   * 获取 axios 实例（用于高级用法）
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
