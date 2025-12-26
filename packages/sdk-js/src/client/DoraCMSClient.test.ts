import { describe, it, expect, beforeEach } from 'vitest';
import { DoraCMSClient } from './DoraCMSClient';
import type { SDKConfig } from '../types';

describe('DoraCMSClient', () => {
  let config: SDKConfig;

  beforeEach(() => {
    config = {
      apiUrl: 'http://localhost:8080',
    };
  });

  describe('constructor', () => {
    it('should create DoraCMSClient instance', () => {
      const client = new DoraCMSClient(config);
      expect(client).toBeInstanceOf(DoraCMSClient);
    });

    it('should throw error if apiUrl is missing', () => {
      expect(() => new DoraCMSClient({} as SDKConfig)).toThrow('apiUrl is required');
    });

    it('should use default config values', () => {
      const client = new DoraCMSClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.version).toBe('v1');
      expect(clientConfig.timeout).toBe(30000);
      expect(clientConfig.autoRefreshToken).toBe(true);
      expect(clientConfig.tokenStorage).toBe('memory');
    });

    it('should override default config values', () => {
      const customConfig: SDKConfig = {
        ...config,
        version: 'v2',
        timeout: 60000,
        autoRefreshToken: false,
        tokenStorage: 'localStorage',
      };
      const client = new DoraCMSClient(customConfig);
      const clientConfig = client.getConfig();

      expect(clientConfig.version).toBe('v2');
      expect(clientConfig.timeout).toBe(60000);
      expect(clientConfig.autoRefreshToken).toBe(false);
      expect(clientConfig.tokenStorage).toBe('localStorage');
    });

    it('should store token if provided in config', () => {
      const configWithToken: SDKConfig = {
        ...config,
        token: 'test-token',
      };
      const client = new DoraCMSClient(configWithToken);

      expect(client.getToken()).toBe('test-token');
    });
  });

  describe('token management', () => {
    let client: DoraCMSClient;

    beforeEach(() => {
      client = new DoraCMSClient(config);
    });

    it('should get token', () => {
      expect(client.getToken()).toBeNull();
    });

    it('should set token', () => {
      client.setToken('new-token');
      expect(client.getToken()).toBe('new-token');
    });

    it('should remove token', () => {
      client.setToken('test-token');
      client.removeToken();
      expect(client.getToken()).toBeNull();
    });
  });

  describe('config management', () => {
    let client: DoraCMSClient;

    beforeEach(() => {
      client = new DoraCMSClient(config);
    });

    it('should get config', () => {
      const clientConfig = client.getConfig();
      expect(clientConfig.apiUrl).toBe('http://localhost:8080');
    });

    it('should update config', () => {
      client.updateConfig({ version: 'v2' });
      const clientConfig = client.getConfig();
      expect(clientConfig.version).toBe('v2');
    });

    it('should sync token when updating config', () => {
      client.updateConfig({ token: 'updated-token' });
      expect(client.getToken()).toBe('updated-token');
    });

    it('should remove token when updating config with empty token', () => {
      client.setToken('test-token');
      client.updateConfig({ token: undefined });
      expect(client.getToken()).toBeNull();
    });
  });

  describe('authentication', () => {
    it('should return false if not authenticated', () => {
      const client = new DoraCMSClient(config);
      expect(client.isAuthenticated()).toBe(false);
    });

    it('should return true if JWT token exists', () => {
      const client = new DoraCMSClient(config);
      client.setToken('test-token');
      expect(client.isAuthenticated()).toBe(true);
    });

    it('should return true if API Key exists', () => {
      const configWithApiKey: SDKConfig = {
        ...config,
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      };
      const client = new DoraCMSClient(configWithApiKey);
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe('getAuthType', () => {
    it('should return "none" if not authenticated', () => {
      const client = new DoraCMSClient(config);
      expect(client.getAuthType()).toBe('none');
    });

    it('should return "jwt" if JWT token exists', () => {
      const client = new DoraCMSClient(config);
      client.setToken('test-token');
      expect(client.getAuthType()).toBe('jwt');
    });

    it('should return "apiKey" if API Key exists', () => {
      const configWithApiKey: SDKConfig = {
        ...config,
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      };
      const client = new DoraCMSClient(configWithApiKey);
      expect(client.getAuthType()).toBe('apiKey');
    });

    it('should prefer apiKey over jwt', () => {
      const configWithBoth: SDKConfig = {
        ...config,
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        token: 'test-token',
      };
      const client = new DoraCMSClient(configWithBoth);
      expect(client.getAuthType()).toBe('apiKey');
    });
  });

  describe('getHTTPClient', () => {
    it('should return HTTP client', () => {
      const client = new DoraCMSClient(config);
      const httpClient = client.getHTTPClient();
      expect(httpClient).toBeDefined();
    });
  });
});
