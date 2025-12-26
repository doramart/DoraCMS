/**
 * Webhook 签名工具单元测试
 */
'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const WebhookSignature = require('../../app/utils/webhookSignature');

describe('test/utils/webhookSignature.test.js', () => {
  describe('generate()', () => {
    it('should generate valid signature for object payload', () => {
      const payload = {
        event: 'content.created',
        timestamp: '2024-12-26T10:00:00.000Z',
        data: { id: '123', title: 'Test' },
      };
      const secret = 'test_secret';

      const signature = WebhookSignature.generate(payload, secret);

      assert(signature);
      assert(signature.startsWith('sha256='));
      assert(signature.length === 71); // 'sha256=' + 64 hex chars
    });

    it('should generate valid signature for string payload', () => {
      const payload = '{"event":"test"}';
      const secret = 'test_secret';

      const signature = WebhookSignature.generate(payload, secret);

      assert(signature);
      assert(signature.startsWith('sha256='));
    });

    it('should generate same signature for same payload', () => {
      const payload = { event: 'test', data: { id: '123' } };
      const secret = 'test_secret';

      const signature1 = WebhookSignature.generate(payload, secret);
      const signature2 = WebhookSignature.generate(payload, secret);

      assert.strictEqual(signature1, signature2);
    });

    it('should generate different signatures for different secrets', () => {
      const payload = { event: 'test' };
      const secret1 = 'secret1';
      const secret2 = 'secret2';

      const signature1 = WebhookSignature.generate(payload, secret1);
      const signature2 = WebhookSignature.generate(payload, secret2);

      assert.notStrictEqual(signature1, signature2);
    });

    it('should throw error when payload is missing', () => {
      assert.throws(() => {
        WebhookSignature.generate(null, 'secret');
      }, /Payload is required/);
    });

    it('should throw error when secret is missing', () => {
      assert.throws(() => {
        WebhookSignature.generate({ event: 'test' }, null);
      }, /Secret is required/);
    });
  });

  describe('verify()', () => {
    it('should verify valid signature', () => {
      const payload = { event: 'test', data: { id: '123' } };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload, secret);

      const isValid = WebhookSignature.verify(payload, signature, secret);

      assert.strictEqual(isValid, true);
    });

    it('should reject invalid signature', () => {
      const payload = { event: 'test' };
      const secret = 'test_secret';
      const invalidSignature = 'sha256=invalid';

      const isValid = WebhookSignature.verify(payload, invalidSignature, secret);

      assert.strictEqual(isValid, false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = { event: 'test' };
      const secret1 = 'secret1';
      const secret2 = 'secret2';
      const signature = WebhookSignature.generate(payload, secret1);

      const isValid = WebhookSignature.verify(payload, signature, secret2);

      assert.strictEqual(isValid, false);
    });

    it('should reject signature for modified payload', () => {
      const payload1 = { event: 'test', data: { id: '123' } };
      const payload2 = { event: 'test', data: { id: '456' } };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload1, secret);

      const isValid = WebhookSignature.verify(payload2, signature, secret);

      assert.strictEqual(isValid, false);
    });

    it('should throw error when payload is missing', () => {
      assert.throws(() => {
        WebhookSignature.verify(null, 'sha256=abc', 'secret');
      }, /Payload is required/);
    });

    it('should throw error when signature is missing', () => {
      assert.throws(() => {
        WebhookSignature.verify({ event: 'test' }, null, 'secret');
      }, /Signature is required/);
    });

    it('should throw error when secret is missing', () => {
      assert.throws(() => {
        WebhookSignature.verify({ event: 'test' }, 'sha256=abc', null);
      }, /Secret is required/);
    });
  });

  describe('extractSignature()', () => {
    it('should extract signature from X-Webhook-Signature header', () => {
      const headers = {
        'x-webhook-signature': 'sha256=abc123',
      };

      const signature = WebhookSignature.extractSignature(headers);

      assert.strictEqual(signature, 'sha256=abc123');
    });

    it('should extract signature from X-Signature header', () => {
      const headers = {
        'x-signature': 'sha256=abc123',
      };

      const signature = WebhookSignature.extractSignature(headers);

      assert.strictEqual(signature, 'sha256=abc123');
    });

    it('should handle case-insensitive headers', () => {
      const headers = {
        'X-Webhook-Signature': 'sha256=abc123',
      };

      const signature = WebhookSignature.extractSignature(headers);

      assert.strictEqual(signature, 'sha256=abc123');
    });

    it('should return null when signature header is missing', () => {
      const headers = {
        'content-type': 'application/json',
      };

      const signature = WebhookSignature.extractSignature(headers);

      assert.strictEqual(signature, null);
    });
  });

  describe('verifyRequest()', () => {
    it('should verify valid request', () => {
      const payload = { event: 'test' };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload, secret);
      const headers = {
        'x-webhook-signature': signature,
      };

      const isValid = WebhookSignature.verifyRequest(payload, headers, secret);

      assert.strictEqual(isValid, true);
    });

    it('should reject request without signature header', () => {
      const payload = { event: 'test' };
      const secret = 'test_secret';
      const headers = {};

      const isValid = WebhookSignature.verifyRequest(payload, headers, secret);

      assert.strictEqual(isValid, false);
    });

    it('should reject request with invalid signature', () => {
      const payload = { event: 'test' };
      const secret = 'test_secret';
      const headers = {
        'x-webhook-signature': 'sha256=invalid',
      };

      const isValid = WebhookSignature.verifyRequest(payload, headers, secret);

      assert.strictEqual(isValid, false);
    });
  });

  describe('createPayload()', () => {
    it('should create valid payload', () => {
      const event = 'content.created';
      const data = { id: '123', title: 'Test' };

      const payload = WebhookSignature.createPayload(event, data);

      assert.strictEqual(payload.event, event);
      assert.deepStrictEqual(payload.data, data);
      assert(payload.timestamp);
      assert(new Date(payload.timestamp).getTime() > 0);
    });

    it('should use provided timestamp', () => {
      const event = 'test';
      const data = { id: '123' };
      const timestamp = '2024-12-26T10:00:00.000Z';

      const payload = WebhookSignature.createPayload(event, data, timestamp);

      assert.strictEqual(payload.timestamp, timestamp);
    });
  });

  describe('verifyTimestamp()', () => {
    it('should accept recent timestamp', () => {
      const timestamp = new Date().toISOString();

      const isValid = WebhookSignature.verifyTimestamp(timestamp, 300);

      assert.strictEqual(isValid, true);
    });

    it('should reject old timestamp', () => {
      const timestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

      const isValid = WebhookSignature.verifyTimestamp(timestamp, 300); // 5 minutes tolerance

      assert.strictEqual(isValid, false);
    });

    it('should reject future timestamp beyond tolerance', () => {
      const timestamp = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes future

      const isValid = WebhookSignature.verifyTimestamp(timestamp, 300); // 5 minutes tolerance

      assert.strictEqual(isValid, false);
    });

    it('should accept timestamp within tolerance', () => {
      const timestamp = new Date(Date.now() - 4 * 60 * 1000).toISOString(); // 4 minutes ago

      const isValid = WebhookSignature.verifyTimestamp(timestamp, 300); // 5 minutes tolerance

      assert.strictEqual(isValid, true);
    });

    it('should reject invalid timestamp format', () => {
      const timestamp = 'invalid-timestamp';

      const isValid = WebhookSignature.verifyTimestamp(timestamp, 300);

      assert.strictEqual(isValid, false);
    });
  });

  describe('verifyWebhookRequest()', () => {
    it('should verify valid webhook request', () => {
      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { id: '123' },
      };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload, secret);
      const headers = {
        'x-webhook-signature': signature,
      };

      const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.reason, 'Valid');
    });

    it('should reject request with missing signature', () => {
      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {},
      };
      const secret = 'test_secret';
      const headers = {};

      const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Missing signature');
    });

    it('should reject request with invalid signature', () => {
      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {},
      };
      const secret = 'test_secret';
      const headers = {
        'x-webhook-signature': 'sha256=invalid',
      };

      const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Invalid signature');
    });

    it('should reject request with old timestamp', () => {
      const payload = {
        event: 'test',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        data: {},
      };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload, secret);
      const headers = {
        'x-webhook-signature': signature,
      };

      const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret, {
        verifyTimestamp: true,
        toleranceSeconds: 300, // 5 minutes
      });

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Timestamp out of tolerance');
    });

    it('should skip timestamp verification when disabled', () => {
      const payload = {
        event: 'test',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        data: {},
      };
      const secret = 'test_secret';
      const signature = WebhookSignature.generate(payload, secret);
      const headers = {
        'x-webhook-signature': signature,
      };

      const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret, {
        verifyTimestamp: false,
      });

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.reason, 'Valid');
    });
  });
});
