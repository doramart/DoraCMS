'use strict';

const assert = require('assert');
const dns = require('dns');
const fs = require('fs');
const os = require('os');
const path = require('path');
const RegUserController = require('../app/controller/api/regUser');
const PluginController = require('../app/controller/manage/plugin');
const appExtension = require('../app/extend/application');
const outbound = require('../app/utils/outboundRequest');

describe('Second-batch security fixes', () => {
  it('rejects MongoDB operators in the login country code', async () => {
    const ctx = {
      request: {
        body: {
          loginType: '2',
          countryCode: { $ne: '999' },
          phoneNum: '13800138000',
          password: 'abc123',
        },
      },
      __: (key, args = []) => `${key}:${args.join(',')}`,
      service: { user: { count: () => assert.fail('Invalid country code reached the database') } },
    };
    await assert.rejects(RegUserController.loginAction.call({ app: {} }, ctx), /countryCode/);
  });

  it('does not include stored password ciphertext in a successful login', async () => {
    const previousFields = global.getAuthUserFields;
    global.getAuthUserFields = () => 'id userName password enable loginActive';
    let response;
    const ctx = {
      request: {
        body: {
          loginType: '2',
          countryCode: '86',
          phoneNum: '13800138000',
          password: 'abc123',
        },
      },
      service: {
        user: {
          count: async () => 1,
          findOne: async () => ({
            id: 'user-1',
            userName: 'tester',
            password: 'ciphertext',
            enable: true,
            loginActive: true,
          }),
        },
        systemOptionLog: { logUserLogin: async () => {} },
        webhook: { triggerEvent: async () => {} },
      },
      helper: {
        decrypt: () => 'abc123',
        clearRedisByType: () => {},
        sendMessageToClient: () => {},
        renderSuccess: (_ctx, result) => {
          response = result;
        },
      },
      cookies: { set: () => {} },
      __: key => key,
      protocol: 'http',
    };
    const controller = {
      app: {
        config: {
          jwtSecret: 'test-only-jwt-secret-123456',
          jwtExpiresIn: '1h',
          auth_cookie_name: 'test',
          userMaxAge: 1000,
        },
      },
    };
    try {
      await RegUserController.loginAction.call(controller, ctx);
      assert.strictEqual(response.data.password, undefined);
      assert(response.data.token);
    } finally {
      global.getAuthUserFields = previousFields;
    }
  });

  it('rejects private outbound targets at URL and connection time', async () => {
    for (const url of ['http://127.0.0.1/', 'http://169.254.169.254/', 'http://[::1]/', 'file:///etc/passwd']) {
      assert.throws(() => outbound.assertPublicUrl(url));
    }
    const options = outbound.publicCurlOptions('https://example.com/api');
    assert.strictEqual(options.followRedirect, false);
    assert.strictEqual(options.checkAddress('10.0.0.1'), false);
    assert.strictEqual(options.checkAddress('8.8.8.8'), true);

    const originalLookup = dns.lookup;
    dns.lookup = (_host, _options, callback) => callback(null, '127.0.0.1', 4);
    try {
      const axiosOptions = outbound.publicAxiosOptions('http://example.com/webhook');
      assert.strictEqual(axiosOptions.maxRedirects, 0);
      assert.strictEqual(axiosOptions.proxy, false);
      await new Promise(resolve => {
        axiosOptions.httpAgent.options.lookup('example.com', {}, error => {
          assert.match(error.message, /Private outbound address/);
          resolve();
        });
      });
    } finally {
      dns.lookup = originalLookup;
    }
  });

  it('generates plugin config from data and never overwrites an existing file', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cms3-plugin-test-'));
    fs.mkdirSync(path.join(directory, 'config/ext/config'), { recursive: true });
    fs.mkdirSync(path.join(directory, 'config/ext/plugin'), { recursive: true });
    const app = {
      config: { baseDir: directory },
      validatePluginConfig: appExtension.validatePluginConfig,
      validatePluginInstallConfig: appExtension.validatePluginInstallConfig,
    };
    const pluginInfos = {
      alias: 'safe',
      pkgName: 'approved-package',
      pluginsConfig: "module.exports = require('child_process').execSync('id')",
      defaultConfig: JSON.stringify({ setting: true }),
    };
    try {
      await appExtension.initPluginConfig.call(app, pluginInfos);
      const pluginPath = path.join(directory, 'config/ext/plugin/safe.js');
      assert.deepStrictEqual(require(pluginPath), { enable: true, package: 'approved-package' });
      assert.deepStrictEqual(require(path.join(directory, 'config/ext/config/safe.js')), { setting: true });
      assert.throws(() => appExtension.validatePluginInstallConfig.call(app, pluginInfos), /already exists/);
      await assert.rejects(appExtension.initPluginConfig.call(app, pluginInfos), /already exists/);
      assert.throws(() => app.validatePluginConfig({ alias: '../escape' }), /Invalid plugin alias/);
      assert.throws(() => app.validatePluginConfig({ alias: 'index' }), /Invalid plugin alias/);
      assert.throws(() => app.validatePluginConfig({ alias: 'safe', initData: 'x;id.json' }), /Invalid plugin data/);
      assert.throws(() => app.validatePluginConfig({ alias: 'safe', defaultConfig: 'module.exports = {}' }));
      await assert.rejects(
        appExtension.initExtendData.call(app, {}, { alias: 'safe', initData: 'x;id.json' }),
        /Invalid plugin data/
      );
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('requires operator approval before installing a marketplace package', async () => {
    const previous = process.env.APPROVED_PLUGIN_PACKAGES;
    delete process.env.APPROVED_PLUGIN_PACKAGES;
    const controller = {
      ctx: {
        query: { pluginId: 'plugin-1' },
        service: { plugin: { checkPluginInstalled: async () => false } },
        helper: {
          reqJsonData: async (_url, _params, _method, options) => {
            assert.strictEqual(options.maxRedirects, 0);
            assert.strictEqual(options.proxy, false);
            return { id: 'plugin-1', alias: 'demo', pkgName: 'demo-package', version: '1.0.0' };
          },
        },
      },
      app: { config: { doracms_api: 'https://market.example.com' } },
    };
    try {
      await assert.rejects(PluginController.prototype.installPlugin.call(controller), /not approved/);
    } finally {
      if (previous === undefined) delete process.env.APPROVED_PLUGIN_PACKAGES;
      else process.env.APPROVED_PLUGIN_PACKAGES = previous;
    }
  });
});
