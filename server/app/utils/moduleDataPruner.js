'use strict';

/**
 * 根据 modules.config.js 中的启用状态裁剪初始化数据。
 * 目标：在用户选择精简模块时，自动隐藏/禁用无关的菜单（以及后续可扩展的权限）。
 */

const fs = require('fs');
const path = require('path');
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const MODULE_DATA_MAP = require('../../config/module-data-map');

/**
 * 主入口
 * @param {Application} app
 * @return {Promise<Object>} 结果统计
 */
async function pruneModuleData(app) {
  const modulesConfig = loadModulesConfig(app);
  if (!modulesConfig) {
    app.logger.warn('[ModuleDataPruner] 未找到模块配置，跳过裁剪');
    return { skipped: true, reason: 'modules.config.js not found' };
  }

  const disabledModules = getDisabledModules(modulesConfig);
  if (disabledModules.length === 0) {
    app.logger.info('[ModuleDataPruner] 所有业务模块均启用，无需裁剪');
    return { skipped: true, reason: 'no disabled modules' };
  }

  const targets = collectTargets(disabledModules);
  if (targets.menuRouteNames.size === 0 && targets.permissionPrefixes.size === 0) {
    app.logger.info('[ModuleDataPruner] 禁用模块未定义裁剪映射，跳过');
    return { skipped: true, reason: 'no mapping' };
  }

  const ctx = app.createAnonymousContext();
  const repositoryFactory = app.repositoryFactory || new RepositoryFactory(app);

  const result = {
    skipped: false,
    disabledModules,
    menuUpdated: 0,
  };

  // 裁剪菜单：隐藏并禁用
  if (targets.menuRouteNames.size > 0) {
    const menuRepo = repositoryFactory.createMenuRepository(ctx);
    result.menuUpdated = await disableMenusByRouteNames(menuRepo, targets.menuRouteNames, app);
  }

  // 预留权限裁剪（暂不删除，未来可以扩展）
  // if (targets.permissionPrefixes.size > 0) { ... }

  return result;
}

/**
 * 加载 modules.config.js
 * @param {Application} app
 * @return {Object|null}
 */
function loadModulesConfig(app) {
  const configPath = path.join(app.baseDir, 'config/modules.config.js');
  if (!fs.existsSync(configPath)) return null;
  // 避免 require 缓存导致的热重载问题
  delete require.cache[require.resolve(configPath)];
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(configPath);
}

/**
 * 获取被禁用的业务模块列表
 * @param {Object} modulesConfig
 * @return {Array<string>}
 */
function getDisabledModules(modulesConfig) {
  const business = modulesConfig.business || {};
  return Object.entries(business)
    .filter(([, cfg]) => cfg && cfg.enabled === false)
    .map(([name]) => name);
}

/**
 * 收集需要裁剪的菜单、权限
 * @param {Array<string>} disabledModules
 * @return {{menuRouteNames: Set<string>, permissionPrefixes: Set<string>}}
 */
function collectTargets(disabledModules = []) {
  const menuRouteNames = new Set();
  const permissionPrefixes = new Set();

  disabledModules.forEach(moduleName => {
    const mapping = MODULE_DATA_MAP[moduleName];
    if (!mapping) return;
    (mapping.menus || []).forEach(route => menuRouteNames.add(route));
    (mapping.permissionPrefixes || []).forEach(prefix => permissionPrefixes.add(prefix));
  });

  return { menuRouteNames, permissionPrefixes };
}

/**
 * 将指定路由名称的菜单标记为禁用/隐藏
 * @param {*} menuRepo
 * @param {Set<string>} routeNames
 * @param {Application} app
 * @return {Promise<number>} 更新数量
 */
async function disableMenusByRouteNames(menuRepo, routeNames, app) {
  let updated = 0;

  for (const routeName of routeNames) {
    try {
      const menu = await menuRepo.findOne({ routeName });
      if (!menu) continue;

      const id = menu.id || menu._id;
      const payload = {
        hideInMenu: true,
        status: '0', // 0=禁用, 1=启用
        updatedAt: new Date(),
        updateBy: 'module-data-pruner',
      };

      // 避免重复写入
      if (menu.status === '0' && menu.hideInMenu === true) continue;

      // 传递 validate: false 选项以跳过 Sequelize 验证
      await menuRepo.update(id, payload, { validate: false });
      updated += 1;
      app.logger.info('[ModuleDataPruner] 已隐藏菜单 %s', routeName);
    } catch (error) {
      app.logger.warn('[ModuleDataPruner] 隐藏菜单 %s 失败：%s', routeName, error.message);
    }
  }

  return updated;
}

module.exports = {
  pruneModuleData,
};
