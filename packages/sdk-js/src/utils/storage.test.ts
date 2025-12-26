import { describe, it, expect, beforeEach } from 'vitest';
import { createTokenStorage } from './storage';

describe('TokenStorage', () => {
  describe('MemoryStorage', () => {
    let storage: ReturnType<typeof createTokenStorage>;

    beforeEach(() => {
      storage = createTokenStorage('memory');
    });

    it('should store and retrieve token', () => {
      storage.setToken('test-token');
      expect(storage.getToken()).toBe('test-token');
    });

    it('should return null when no token is stored', () => {
      expect(storage.getToken()).toBeNull();
    });

    it('should remove token', () => {
      storage.setToken('test-token');
      storage.removeToken();
      expect(storage.getToken()).toBeNull();
    });

    it('should overwrite existing token', () => {
      storage.setToken('token-1');
      storage.setToken('token-2');
      expect(storage.getToken()).toBe('token-2');
    });
  });

  // Note: localStorage and sessionStorage tests would require jsdom environment
  // For now, we just test that they can be created
  describe('LocalStorage', () => {
    it('should create localStorage instance', () => {
      const storage = createTokenStorage('localStorage');
      expect(storage).toBeDefined();
    });
  });

  describe('SessionStorage', () => {
    it('should create sessionStorage instance', () => {
      const storage = createTokenStorage('sessionStorage');
      expect(storage).toBeDefined();
    });
  });
});
