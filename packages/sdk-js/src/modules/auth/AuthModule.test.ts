import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthModule } from './AuthModule';
import type { HTTPClient } from '../../http';
import type { TokenStorage } from '../../utils';
import type { SDKConfig } from '../../types';

describe('AuthModule', () => {
  let authModule: AuthModule;
  let mockHttpClient: HTTPClient;
  let mockTokenStorage: TokenStorage;
  let config: SDKConfig;

  beforeEach(() => {
    // Mock HTTPClient
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    } as any;

    // Mock TokenStorage
    mockTokenStorage = {
      getToken: vi.fn(),
      setToken: vi.fn(),
      removeToken: vi.fn(),
    };

    config = {
      apiUrl: 'http://localhost:8080',
    };

    authModule = new AuthModule(mockHttpClient, mockTokenStorage, config);
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          id: 'user-123',
          userName: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          token: 'test-token-123',
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await authModule.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', {
        userName: 'testuser',
        password: 'password123',
        imageCode: undefined,
        loginType: '3',
      });

      expect(mockTokenStorage.setToken).toHaveBeenCalledWith('test-token-123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should login with image code', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          id: 'user-123',
          userName: 'testuser',
          token: 'test-token-123',
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      await authModule.login({
        username: 'testuser',
        password: 'password123',
        imageCode: '1234',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', {
        userName: 'testuser',
        password: 'password123',
        imageCode: '1234',
        loginType: '3',
      });
    });

    it('should throw error if login fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Invalid credentials',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      await expect(
        authModule.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call server logout and clear token from storage', async () => {
      const mockResponse = {
        status: 'success' as const,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      await authModule.logout();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockTokenStorage.removeToken).toHaveBeenCalled();
    });

    it('should clear token even if server logout fails', async () => {
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error('Server error'));

      await authModule.logout();

      expect(mockTokenStorage.removeToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update storage', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          token: 'new-token-456',
          refreshToken: 'new-refresh-token',
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      const result = await authModule.refreshToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockTokenStorage.setToken).toHaveBeenCalledWith('new-token-456');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error if refresh fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Token expired',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValue(mockResponse);

      await expect(authModule.refreshToken()).rejects.toThrow('Token expired');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user info', async () => {
      const mockResponse = {
        status: 'success' as const,
        data: {
          id: 'user-123',
          userName: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          logo: 'https://example.com/avatar.jpg',
        },
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      const result = await authModule.getCurrentUser();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error if get user fails', async () => {
      const mockResponse = {
        status: 'error' as const,
        message: 'Not authenticated',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'req-123',
      };

      vi.mocked(mockHttpClient.get).mockResolvedValue(mockResponse);

      await expect(authModule.getCurrentUser()).rejects.toThrow('Not authenticated');
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if token exists', () => {
      vi.mocked(mockTokenStorage.getToken).mockReturnValue('test-token');

      expect(authModule.isLoggedIn()).toBe(true);
    });

    it('should return false if token does not exist', () => {
      vi.mocked(mockTokenStorage.getToken).mockReturnValue(null);

      expect(authModule.isLoggedIn()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from storage', () => {
      vi.mocked(mockTokenStorage.getToken).mockReturnValue('test-token');

      expect(authModule.getToken()).toBe('test-token');
    });

    it('should return null if no token', () => {
      vi.mocked(mockTokenStorage.getToken).mockReturnValue(null);

      expect(authModule.getToken()).toBeNull();
    });
  });
});
