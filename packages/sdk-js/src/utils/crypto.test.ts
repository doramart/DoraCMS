import { describe, it, expect } from 'vitest';
import { generateSignature, generateNonce } from './crypto';

describe('crypto utils', () => {
  describe('generateSignature', () => {
    it('should generate consistent signature for same input', () => {
      const apiKey = 'test-key';
      const apiSecret = 'test-secret';
      const timestamp = '1234567890';
      const method = 'GET';
      const path = '/api/v1/content';

      const sig1 = generateSignature(apiKey, apiSecret, timestamp, method, path);
      const sig2 = generateSignature(apiKey, apiSecret, timestamp, method, path);

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // SHA256 hex string length
    });

    it('should generate different signatures for different inputs', () => {
      const apiKey = 'test-key';
      const apiSecret = 'test-secret';
      const timestamp = '1234567890';

      const sig1 = generateSignature(apiKey, apiSecret, timestamp, 'GET', '/api/v1/content');
      const sig2 = generateSignature(apiKey, apiSecret, timestamp, 'POST', '/api/v1/content');

      expect(sig1).not.toBe(sig2);
    });

    it('should include body in signature when provided', () => {
      const apiKey = 'test-key';
      const apiSecret = 'test-secret';
      const timestamp = '1234567890';
      const method = 'POST';
      const path = '/api/v1/content';
      const body = { title: 'Test' };

      const sig1 = generateSignature(apiKey, apiSecret, timestamp, method, path);
      const sig2 = generateSignature(apiKey, apiSecret, timestamp, method, path, body);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('generateNonce', () => {
    it('should generate random nonce', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce1).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate nonce with custom length', () => {
      const nonce = generateNonce(8);
      expect(nonce).toHaveLength(16); // 8 bytes = 16 hex chars
    });
  });
});
