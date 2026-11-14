/*
 * @Author: doramart
 * @Date: 2019-09-23 09:25:24
 * @Last Modified by: doramart
 * @Last Modified time: 2025-10-07 11:09:23
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const muri = require('muri');
// const restore = require('@cdxoo/mongodb-restore');
const { execFileSync } = require('child_process');

require('module-alias/register');

const normalizeWhiteListRoute = route => {
  if (!route || typeof route !== 'string') {
    return null;
  }
  let normalized = route.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('/')) {
    normalized = normalized.replace(/^\//, '');
  }
  if (normalized.startsWith('manage/')) {
    normalized = normalized.replace(/^manage\//, '');
  }
  return normalized;
};

module.exports = {
  validatePluginConfig(pluginInfos) {
    if (!/^[A-Za-z0-9_-]+$/.test(pluginInfos.alias || '') || pluginInfos.alias === 'index') {
      throw new Error('Invalid plugin alias');
    }
    if (pluginInfos.initData && !/^[A-Za-z0-9_-]+\.json$/.test(pluginInfos.initData)) {
      throw new Error('Invalid plugin data filename');
    }
    if (pluginInfos.defaultConfig) {
      const value =
        typeof pluginInfos.defaultConfig === 'string'
          ? JSON.parse(pluginInfos.defaultConfig)
          : pluginInfos.defaultConfig;
      if (!value || Array.isArray(value) || typeof value !== 'object') {
        throw new Error('Plugin default configuration must be a JSON object');
      }
      const unsafeKeys = ['__proto__', 'constructor', 'prototype'];
      const checkKeys = item => {
        if (item && typeof item === 'object') {
          for (const [key, childValue] of Object.entries(item)) {
            if (unsafeKeys.includes(key)) throw new Error('Invalid plugin configuration key');
            checkKeys(childValue);
          }
        }
      };
      checkKeys(value);
      return value;
    }
    return null;
  },

  validatePluginInstallConfig(pluginInfos) {
    this.validatePluginConfig(pluginInfos);
    const baseDir = this.config.baseDir;
    const configPath = path.join(baseDir, `config/ext/config/${pluginInfos.alias}.js`);
    const pluginPath = path.join(baseDir, `config/ext/plugin/${pluginInfos.alias}.js`);
    if (fs.existsSync(configPath) || fs.existsSync(pluginPath)) {
      throw new Error('Plugin configuration file already exists');
    }
  },

  // 应用初始化
  async init() {
    console.log('app init');
    // try {
    //   const checkSystemInfo = await ctx.service.systemConfig.count();
    //   if (checkSystemInfo === 0) {
    //     const uri = app.config.mongoose.client.url;
    //     const datafile = path.join(__dirname, '../../databak/doracms3');
    //     await restore.database({
    //       uri,
    //       database: 'doracms3',
    //       from: datafile,
    //     });
    //   }
    // } catch (error) {
    //   if (error && error.message === 'Invalid Operation, no operations specified') {
    //     console.log('init data success');
    //   } else {
    //     console.log('init data error:', error.message);
    //   }
    // }
  },
  // 获取权限白名单（主应用 + 插件）
  getPermissionWhiteList() {
    const app = this;
    const permissionConfig = app.config.permission || {};
    const whiteListConfig = permissionConfig.whiteList || {};
    const whiteListSet = new Set();

    const addRoute = route => {
      const normalized = normalizeWhiteListRoute(route);
      if (normalized) {
        whiteListSet.add(normalized);
      }
    };

    const baseRoutes = Array.isArray(whiteListConfig.routes) ? whiteListConfig.routes : [];
    baseRoutes.forEach(addRoute);

    const pluginWhiteListMap = whiteListConfig.plugins || {};
    const pluginFile = path.join(app.config.baseDir, 'config/plugin.js');
    const pluginInfo = fs.existsSync(pluginFile) ? require(pluginFile) : {};

    Object.keys(pluginInfo || {}).forEach(pluginItem => {
      const pluginMeta = pluginInfo[pluginItem];
      if (!pluginMeta || pluginMeta.enable !== true) {
        return;
      }
      const pluginConfig = app.config[pluginItem] || {};
      const pluginRoutes = [];

      if (Array.isArray(pluginWhiteListMap[pluginItem])) {
        pluginRoutes.push(...pluginWhiteListMap[pluginItem]);
      }
      if (Array.isArray(pluginConfig.permissionWhiteList)) {
        pluginRoutes.push(...pluginConfig.permissionWhiteList);
      }
      if (pluginConfig.permission && Array.isArray(pluginConfig.permission.whiteList)) {
        pluginRoutes.push(...pluginConfig.permission.whiteList);
      }
      if (Array.isArray(pluginConfig.adminApi)) {
        pluginConfig.adminApi.forEach(item => {
          if (item && item.noPower && item.url) {
            pluginRoutes.push(item.url);
          }
        });
      }

      pluginRoutes.forEach(addRoute);
    });

    return Array.from(whiteListSet);
  },

  // 插件初始数据导入
  async initExtendData(_ctx, pluginInfos = {}, type = 'install') {
    if (!_.isEmpty(pluginInfos)) {
      if (type === 'install') {
        const app = this;
        this.validatePluginConfig(pluginInfos);
        const targetPluginFolder = path.join(app.config.baseDir, `lib/plugin/${pluginInfos.pkgName}`);
        const tabname = path.basename(pluginInfos.initData, '.json');
        const dataPath = path.join(targetPluginFolder, `./app/db/${pluginInfos.initData}`);

        if (pluginInfos.initData && fs.existsSync(dataPath)) {
          const parsedUri = muri(app.config.mongoose.client.url);
          const parameters = [];
          if (parsedUri.auth) {
            parameters.push('-u', parsedUri.auth.user, '-p', parsedUri.auth.pass);
          }
          if (parsedUri.db) {
            parameters.push('-d', parsedUri.db);
          }
          parameters.push('-c', tabname, '--upsert', '--drop', dataPath);
          execFileSync(path.join(app.config.mongodb.binPath || '', 'mongoimport'), parameters);
        }
      } else {
        // TODO 插件卸载暂不清除数据
        // await ctx.service[pluginInfos.alias].removeAll();
      }
    }
  },

  // 初始化资源管理数据
  async initResourceData() {
    // Resource initialization is not implemented yet.
  },

  // 添加插件配置
  async initPluginConfig(pluginInfos = {}, type = 'install') {
    if (!_.isEmpty(pluginInfos)) {
      const app = this;
      if (!/^[A-Za-z0-9_-]+$/.test(pluginInfos.alias || '') || pluginInfos.alias === 'index') {
        throw new Error('Invalid plugin alias');
      }
      const defaultConfig = type === 'install' ? this.validatePluginConfig(pluginInfos) : null;
      const configPluginPath = path.join(app.config.baseDir, `config/ext/config/${pluginInfos.alias}.js`);
      const extConfigPath = path.join(app.config.baseDir, `config/ext/plugin/${pluginInfos.alias}.js`);
      if (type === 'install') {
        if (fs.existsSync(extConfigPath) || fs.existsSync(configPluginPath)) {
          throw new Error('Plugin configuration file already exists');
        }
        if (defaultConfig) {
          fs.writeFileSync(configPluginPath, `module.exports = ${JSON.stringify(defaultConfig)};\n`, { flag: 'wx' });
        }
        fs.writeFileSync(
          extConfigPath,
          `module.exports = ${JSON.stringify({ enable: true, package: pluginInfos.pkgName })};\n`,
          { flag: 'wx' }
        );
      } else {
        if (fs.existsSync(extConfigPath)) {
          fs.unlinkSync(extConfigPath);
        }

        if (fs.existsSync(configPluginPath)) {
          fs.unlinkSync(configPluginPath);
        }
      }
    }
  },

  // 初始化数据模型
  initExtendModel(modelsPath) {
    const app = this;
    fs.readdirSync(modelsPath).forEach(function (extendName) {
      if (extendName) {
        const filePath = `${modelsPath}/${extendName}`;
        if (fs.existsSync(filePath)) {
          const modelKey = path.basename(extendName.charAt(0).toUpperCase() + extendName.slice(1), '.js');
          if (_.isEmpty(app.model[modelKey])) {
            const targetModel = app.loader.loadFile(filePath);
            app.model[modelKey] = targetModel;
          }
        }
      }
    });
  },

  // 初始化插件路由
  async initPluginRouter(ctx, pluginConfig = {}, pluginManageController = {}, pluginApiController = {}, next = {}) {
    const app = this;
    let isFontApi = false;
    let isAdminApi = false;
    let targetControllerName = '';
    let targetApiItem = {};
    if (!_.isEmpty(pluginConfig)) {
      if (!_.isEmpty(pluginConfig)) {
        const { adminApi, fontApi } = pluginConfig;

        const targetRequestUrl = ctx.request.url;

        if (targetRequestUrl.indexOf('/api/') >= 0) {
          for (const fontApiItem of fontApi) {
            const { url, method, controllerName } = fontApiItem;

            const targetApi = targetRequestUrl.replace('/api/', '').split('?')[0];
            if (ctx.request.method === method.toUpperCase() && targetApi === url && controllerName) {
              isFontApi = true;
              targetControllerName = controllerName;
              targetApiItem = fontApiItem;
              break;
            }
          }
        } else if (targetRequestUrl.indexOf('/manage/') >= 0) {
          for (const adminApiItem of adminApi) {
            const { url, method, controllerName } = adminApiItem;

            const targetApi = targetRequestUrl.replace('/manage/', '').split('?')[0];
            if (ctx.request.method === method.toUpperCase() && targetApi === url && controllerName) {
              isAdminApi = true;
              targetControllerName = controllerName;
              targetApiItem = adminApiItem;
              break;
            }
          }
        }
      }
    }

    if (isAdminApi && !_.isEmpty(pluginManageController) && targetControllerName) {
      await pluginManageController[targetControllerName](ctx, app);
    } else if (isFontApi && !_.isEmpty(pluginApiController) && targetControllerName) {
      if (targetApiItem.authToken) {
        if (ctx.session.logined) {
          await pluginApiController[targetControllerName](ctx, app, next);
        } else {
          ctx.helper.renderFail(ctx, {
            message: ctx.__('system.notice.noPower'),
          });
        }
      } else {
        await pluginApiController[targetControllerName](ctx, app, next);
      }
    }
  },
};
