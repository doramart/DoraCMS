'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const OSS = require('ali-oss');
const CryptoUtil = require('../app/utils/CryptoUtil');
const helper = require('../app/extend/helper');
const TemplateResolverService = require('../app/service/templateResolver');
const RegUserController = require('../app/controller/api/regUser');
const UploadFileController = require('../app/controller/api/uploadFile');
const verificationCode = require('../app/utils/verificationCode');

const strongSecrets = {
  APP_KEYS: 'c27006ce548746408307c2e4f93fb852',
  SESSION_SECRET: '85fa34f84df34c7ca43e44c94be14340',
  ENCRYPT_KEY: 'dedec2aba63a408ca50ed3b050ade513',
  JWT_SECRET: '7bf22f41712f47fab1f39eb43408997e',
};

function loadEnv(overrides = {}) {
  const env = { ...process.env, NODE_ENV: 'development', ...strongSecrets, ...overrides };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }
  return spawnSync(process.execPath, ['-e', 'global.__DOTENV_LOADED__ = true; require("./config/env")'], {
    cwd: path.join(__dirname, '..'),
    env,
    encoding: 'utf8',
  });
}

function createCache() {
  const values = new Map();
  return {
    values,
    async get(key) {
      return values.get(key);
    },
    async set(key, value) {
      values.set(key, value);
      return true;
    },
  };
}

describe('First-batch security fixes', () => {
  it('requires strong, separate secrets in development as well as production', () => {
    assert.strictEqual(loadEnv().status, 0);
    assert.strictEqual(
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_TYPE: 'mongodb',
        MONGODB_HOST: '127.0.0.1',
        MONGODB_DATABASE: 'test',
        MONGODB_USERNAME: 'test',
        MONGODB_PASSWORD: 'test',
      }).status,
      0
    );
    assert.notStrictEqual(loadEnv({ JWT_SECRET: undefined }).status, 0);
    assert.notStrictEqual(loadEnv({ APP_KEYS: 'doracms3' }).status, 0);
    assert.notStrictEqual(loadEnv({ SESSION_SECRET: 'your_session_secret_123456' }).status, 0);
    assert.notStrictEqual(loadEnv({ JWT_SECRET: strongSecrets.ENCRYPT_KEY }).status, 0);
  });

  it('reads existing ciphertext after rotating the encryption key', () => {
    const previousKey = process.env.ENCRYPT_KEY;
    const previousLegacyKey = process.env.LEGACY_ENCRYPT_KEY;
    process.env.ENCRYPT_KEY = strongSecrets.ENCRYPT_KEY;
    process.env.LEGACY_ENCRYPT_KEY = 'legacy-test-key';
    try {
      const oldCiphertext = CryptoUtil.encryptPassword('existing-password', process.env.LEGACY_ENCRYPT_KEY);
      assert.strictEqual(
        CryptoUtil.verifyPassword('existing-password', oldCiphertext, strongSecrets.ENCRYPT_KEY),
        true
      );
      assert.strictEqual(helper.decrypt(oldCiphertext, strongSecrets.ENCRYPT_KEY), 'existing-password');
      const newCiphertext = CryptoUtil.encryptPassword('new-password', strongSecrets.ENCRYPT_KEY);
      assert.strictEqual(CryptoUtil.decryptPassword(newCiphertext, strongSecrets.ENCRYPT_KEY), 'new-password');
      assert.strictEqual(CryptoUtil.decryptPassword(newCiphertext, process.env.LEGACY_ENCRYPT_KEY), null);
    } finally {
      if (previousKey === undefined) delete process.env.ENCRYPT_KEY;
      else process.env.ENCRYPT_KEY = previousKey;
      if (previousLegacyKey === undefined) delete process.env.LEGACY_ENCRYPT_KEY;
      else process.env.LEGACY_ENCRYPT_KEY = previousLegacyKey;
    }
  });

  it('rejects a traversal layout before constructing template paths', async () => {
    const service = {
      app: { baseDir: path.join(__dirname, '..') },
      getActiveTheme: async () => ({ slug: 'standard-template', config: { layouts: ['default'] } }),
      _getConfiguredLayout: TemplateResolverService.prototype._getConfiguredLayout,
      _buildEnhancedResolutionRules() {
        assert.fail('Invalid layout must not reach path construction');
      },
    };
    await assert.rejects(
      TemplateResolverService.prototype.resolveTemplate.call(service, null, 'index', 'x/../../secret'),
      /Invalid template layout/
    );
  });

  it('does not return a code and limits sending and checking attempts', async () => {
    const cache = createCache();
    const app = { cache, config: { session_secret: strongSecrets.SESSION_SECRET } };
    const responses = [];
    const ctx = {
      app,
      ip: '127.0.0.1',
      request: { body: { sendType: '1', messageType: '0', countryCode: '86', phoneNum: '13800138000' } },
      helper: {
        renderSuccess: (_ctx, data) => responses.push(data),
        renderFail: (_ctx, data) => responses.push(data),
      },
      __: key => key,
    };
    const controller = { app };

    for (let i = 0; i < 4; i++) await RegUserController.sendVerificationCode.call(controller, ctx);
    assert.strictEqual(responses.length, 4);
    assert.strictEqual(responses[0].data, undefined);
    assert.match(responses[3].message.message, /request limit exceeded/);

    const codeKey = `${strongSecrets.SESSION_SECRET}_sendMessage_reg_8613800138000`;
    const code = await cache.get(codeKey);
    assert.match(code, /^[1-9]{6}$/);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(await verificationCode.checkCode(ctx, codeKey, '000000'), false);
    }
    await assert.rejects(verificationCode.checkCode(ctx, codeKey, code), /attempt limit exceeded/);
  });

  it('keeps the local source file after cloud upload', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cms3-upload-test-'));
    const localImgPath = path.join(directory, 'sample.png');
    fs.writeFileSync(localImgPath, 'test image');
    const originalPut = OSS.prototype.put;
    OSS.prototype.put = async () => ({ url: 'https://example.com/sample.png' });

    try {
      let response;
      const ctx = {
        request: { body: { localImgPath, filename: 'sample.png' } },
        service: {
          uploadFile: {
            find: async () => [
              {
                type: 'oss',
                oss_bucket: 'test-bucket',
                oss_accessKey: 'test-key',
                oss_secretKey: 'test-secret',
                oss_region: 'oss-cn-hangzhou',
              },
            ],
          },
        },
        helper: {
          renderSuccess: (_ctx, data) => {
            response = data;
          },
        },
        __: key => key,
      };
      const controller = { app: { config: { doraUploadFile: { uploadFileFormat: { upload_path: directory } } } } };
      await UploadFileController.createFileByPath.call(controller, ctx);

      assert.strictEqual(response.data.path, 'https://example.com/sample.png');
      assert.strictEqual(fs.readFileSync(localImgPath, 'utf8'), 'test image');
    } finally {
      OSS.prototype.put = originalPut;
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
