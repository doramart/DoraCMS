'use strict';

const assert = require('assert');
const ApiKeyService = require('../../app/service/apiKey');

describe('API Key updates', () => {
  it('does not change ownership or credentials while updating allowed settings', async () => {
    const existing = { id: 'key-id', userId: 'owner', key: 'original-key', secret: 'original-secret' };
    let saved;
    const service = {
      detail: async (userId, id) => {
        assert.strictEqual(userId, 'owner');
        assert.strictEqual(id, 'key-id');
        return existing;
      },
      repository: {
        checkNameUnique: async () => {},
        update: async (id, data) => {
          saved = { id, data };
          return { ...existing, ...data };
        },
      },
    };

    const result = await ApiKeyService.prototype.updateApiKey.call(service, 'owner', 'key-id', {
      userId: 'other-user',
      key: 'replacement-key',
      secret: 'replacement-secret',
      status: 'disabled',
      name: 'Updated name',
      expiresAt: null,
    });

    assert.strictEqual(saved.id, 'key-id');
    assert.deepStrictEqual(Object.keys(saved.data).sort(), ['expiresAt', 'name', 'updatedAt']);
    assert.strictEqual(saved.data.name, 'Updated name');
    assert.strictEqual(saved.data.expiresAt, null);
    assert(saved.data.updatedAt instanceof Date);
    assert.strictEqual(result.userId, 'owner');
    assert.strictEqual(result.key, 'original-key');
    assert.strictEqual(result.secret, 'original-secret');
  });

  it('does not write when only protected fields are submitted', async () => {
    const existing = { id: 'key-id', userId: 'owner' };
    const service = {
      detail: async () => existing,
      repository: {
        update: async () => {
          assert.fail('Protected fields must not reach the repository');
        },
      },
    };

    const result = await ApiKeyService.prototype.updateApiKey.call(service, 'owner', 'key-id', {
      userId: 'other-user',
    });
    assert.strictEqual(result, existing);
  });
});
