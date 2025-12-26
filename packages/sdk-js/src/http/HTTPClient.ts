import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { SDKConfig, APIResponse, APIErrorResponse, RequestConfig } from '../types';
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

  constructor(config: SDKConfig) {
    this.config = config;

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
      (error: AxiosError<APIErrorResponse>) => {
        // 错误响应，转换为 APIError
        if (error.response) {
          // 服务器返回了错误响应
          const { data, status } = error.response;
          if (data && data.status === 'error') {
            throw APIError.fromResponse(data, status);
          } else {
            // 非标准错误响应
            throw new APIError(
              error.message || 'Unknown error',
              'UNKNOWN_ERROR',
              status,
              'unknown',
              new Date().toISOString()
            );
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          throw new APIError(
            'No response from server',
            'NO_RESPONSE',
            0,
            'unknown',
            new Date().toISOString()
          );
        } else {
          // 请求配置错误
          throw new APIError(
            error.message || 'Request configuration error',
            'REQUEST_ERROR',
            0,
            'unknown',
            new Date().toISOString()
          );
        }
      }
    );
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
