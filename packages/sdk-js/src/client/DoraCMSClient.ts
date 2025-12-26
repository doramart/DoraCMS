import type { SDKConfig } from '../types';
import { HTTPClient } from '../http';
import { createTokenStorage, type TokenStorage } from '../utils';
import { AuthModule } from '../modules/auth';
import { ContentModule } from '../modules/content';

/**
 * DoraCMS 客户端主类
 */
export class DoraCMSClient {
  private config: SDKConfig;
  private httpClient: HTTPClient;
  private tokenStorage: TokenStorage;

  // 功能模块
  public auth: AuthModule;
  public content: ContentModule;

  constructor(config: SDKConfig) {
    // 验证必需配置
    if (!config.apiUrl) {
      throw new Error('apiUrl is required');
    }

    // 保存配置
    this.config = {
      version: 'v1',
      timeout: 30000,
      autoRefreshToken: true,
      tokenStorage: 'memory',
      ...config,
    };

    // 创建 Token 存储
    this.tokenStorage = createTokenStorage(this.config.tokenStorage);

    // 如果配置中提供了 token，保存到存储中
    if (this.config.token) {
      this.tokenStorage.setToken(this.config.token);
    }

    // 创建 HTTP 客户端
    this.httpClient = new HTTPClient(this.config);

    // 设置 Token 获取函数
    this.httpClient.setTokenGetter(() => this.getToken());

    // 初始化认证模块
    this.auth = new AuthModule(this.httpClient, this.tokenStorage, this.config);
    
    // 初始化内容管理模块
    this.content = new ContentModule(this.httpClient);
  }

  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  /**
   * 设置 Token
   */
  setToken(token: string): void {
    this.tokenStorage.setToken(token);
  }

  /**
   * 移除 Token
   */
  removeToken(): void {
    this.tokenStorage.removeToken();
  }

  /**
   * 获取 HTTP 客户端（用于高级用法）
   */
  getHTTPClient(): HTTPClient {
    return this.httpClient;
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<SDKConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SDKConfig>): void {
    // 如果更新了 token，同步到存储
    if ('token' in config) {
      if (config.token) {
        this.tokenStorage.setToken(config.token);
      } else {
        this.tokenStorage.removeToken();
      }
    }

    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    // API Key 认证
    if (this.config.apiKey && this.config.apiSecret) {
      return true;
    }

    // JWT 认证
    const token = this.getToken();
    return !!token;
  }

  /**
   * 获取认证类型
   */
  getAuthType(): 'apiKey' | 'jwt' | 'none' {
    if (this.config.apiKey && this.config.apiSecret) {
      return 'apiKey';
    }
    if (this.getToken()) {
      return 'jwt';
    }
    return 'none';
  }
}
