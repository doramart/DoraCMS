import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { HTTPClient } from './HTTPClient';
import type { SDKConfig } from '../types';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('HTTPClient', () => {
  let client: HTTPClient;
  let config: SDKConfig;

  beforeEach(() => {
    // 重置 mocks
    vi.clearAllMocks();

    // 创建 mock axios 实例
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    config = {
      apiUrl: 'http://localhost:8080',
      version: 'v1',
    };

    client = new HTTPClient(config);
  });

  describe('constructor', () => {
    it('should create HTTPClient instance', () => {
      expect(client).toBeInstanceOf(HTTPClient);
    });

    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use custom timeout if provided', () => {
      const customConfig = {
        ...config,
        timeout: 60000,
      };
      new HTTPClient(customConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('setTokenGetter', () => {
    it('should set token getter function', () => {
      const tokenGetter = () => 'test-token';
      client.setTokenGetter(tokenGetter);
      // Token getter is private, we can't test it directly
      // But we can verify it doesn't throw
      expect(() => client.setTokenGetter(tokenGetter)).not.toThrow();
    });
  });

  describe('HTTP methods', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = mockedAxios.create();
    });

    it('should make GET request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { id: 1 },
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {});
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { id: 1 },
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };
      const postData = { title: 'Test' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.post('/test', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, {});
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { id: 1 },
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };
      const putData = { title: 'Updated' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await client.put('/test/1', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, {});
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', {});
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PATCH request', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { id: 1 },
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123',
        },
      };
      const patchData = { title: 'Patched' };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await client.patch('/test/1', patchData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, {});
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAxiosInstance', () => {
    it('should return axios instance', () => {
      const instance = client.getAxiosInstance();
      expect(instance).toBeDefined();
    });
  });
});
