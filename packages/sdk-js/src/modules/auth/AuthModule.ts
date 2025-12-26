import type { HTTPClient } from '../../http';
import type { TokenStorage } from '../../utils';
import type { SDKConfig } from '../../types';
import type { LoginCredentials, LoginResponse, RefreshTokenResponse, CurrentUser } from './types';

/**
 * 认证模块
 * 提供登录、登出、Token 管理等功能
 */
export class AuthModule {
  private httpClient: HTTPClient;
  private tokenStorage: TokenStorage;

  constructor(httpClient: HTTPClient, tokenStorage: TokenStorage, _config: SDKConfig) {
    this.httpClient = httpClient;
    this.tokenStorage = tokenStorage;
    // config 参数保留用于未来扩展，使用 _ 前缀表示有意未使用
  }

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 登录响应（包含用户信息和 Token）
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.httpClient.post<LoginResponse>('/auth/login', {
      userName: credentials.username,
      password: credentials.password,
      imageCode: credentials.imageCode,
      loginType: '3', // 3: 邮箱/用户名密码登录
    });

    if (response.status === 'success' && response.data) {
      const { token } = response.data;
      
      // 保存 Token 到存储
      if (token) {
        this.tokenStorage.setToken(token);
      }

      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 调用服务端登出接口
      await this.httpClient.post('/auth/logout');
    } catch (error) {
      // 即使服务端登出失败，也清除本地 Token
      console.warn('Server logout failed:', error);
    } finally {
      // 清除本地 Token
      this.tokenStorage.removeToken();
    }
  }

  /**
   * 刷新 Token
   * @returns 新的 Token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await this.httpClient.post<RefreshTokenResponse>('/auth/refresh');

    if (response.status === 'success' && response.data) {
      const { token } = response.data;
      
      // 更新存储中的 Token
      if (token) {
        this.tokenStorage.setToken(token);
      }

      return response.data;
    }

    throw new Error(response.message || 'Token refresh failed');
  }

  /**
   * 获取当前登录用户信息
   * @returns 当前用户信息
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await this.httpClient.get<CurrentUser>('/users/me');

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get current user');
  }

  /**
   * 检查是否已登录
   * @returns 是否已登录
   */
  isLoggedIn(): boolean {
    return !!this.tokenStorage.getToken();
  }

  /**
   * 获取当前 Token
   * @returns Token 或 null
   */
  getToken(): string | null {
    return this.tokenStorage.getToken();
  }
}
