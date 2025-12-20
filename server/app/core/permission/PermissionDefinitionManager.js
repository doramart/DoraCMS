'use strict';

const RepositoryFactory = require('../../repository/factories/RepositoryFactory');

class PermissionDefinitionManager {
  constructor(app, options = {}) {
    this.app = app;
    this.logger = app.logger;
    this.options = options;
    this.repositoryFactory = new RepositoryFactory(app);
    this.registry = null;
    this.repository = null;
    this.registryFiles = [];
    this.lastRevision = 0;
    this.pollingTimer = null;
    this.instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
    this.hotReloadConfig = Object.assign(
      {
        enabled: true,
        interval: 5000,
      },
      options.hotReload || {}
    );
    this._messengerHandler = payload => this._handleMessengerSignal(payload);
  }

  async initialize(registry, registryFiles = []) {
    this.registry = registry;
    this.registryFiles = registryFiles;

    const ctx = this.app.createAnonymousContext();
    this.repository = this.repositoryFactory.createPermissionDefinitionRepository(ctx);

    await this.syncFromFiles(registryFiles);
    await this.reloadFromDatabase('startup', { broadcast: false });
    this._bindMessenger();

    if (this.hotReloadConfig.enabled !== false) {
      this.startHotReload();
    } else {
      this.logger.info('[PermissionDefinitionManager] 热加载已关闭');
    }
  }

  async syncFromFiles(files = []) {
    if (!Array.isArray(files) || files.length === 0) {
      return;
    }

    const definitions = [];
    files.forEach(filePath => {
      try {
        delete require.cache[require.resolve(filePath)];
        const defs = require(filePath); // eslint-disable-line global-require
        if (Array.isArray(defs)) {
          definitions.push(...defs);
        }
      } catch (error) {
        this.logger.warn('[PermissionDefinitionManager] 无法加载权限定义文件 %s: %s', filePath, error.message);
      }
    });

    if (definitions.length === 0) {
      return;
    }

    try {
      const stats = await this.repository.bulkUpsert(definitions, { name: 'system-bootstrap' });
      this.logger.info(
        '[PermissionDefinitionManager] 权限定义已同步至数据库 (total:%d created:%d updated:%d skipped:%d)',
        definitions.length,
        stats.created,
        stats.updated,
        stats.skipped
      );
    } catch (error) {
      this.logger.error('[PermissionDefinitionManager] 同步权限定义失败: %s', error.message);
    }
  }

  async reloadFromDatabase(reason = 'manual', options = {}) {
    const { broadcast = true } = options;
    try {
      const records = await this.repository.findActiveDefinitions();
      const normalized = this._formatDefinitionsForRegistry(records);
      if (this.registry && typeof this.registry.reset === 'function') {
        this.registry.reset(normalized);
      } else {
        normalized.forEach(def => this.registry.register([def]));
      }
      this.lastRevision = await this.repository.getLatestRevision();
      this.logger.info(
        '[PermissionDefinitionManager] 权限定义已刷新 (%s)，数量: %d，revision: %s',
        reason,
        normalized.length,
        this.lastRevision
      );

      if (broadcast) {
        this._broadcastReload();
      }
    } catch (error) {
      this.logger.error('[PermissionDefinitionManager] 刷新权限定义失败: %s', error.message);
    }
  }

  startHotReload() {
    const interval = Math.max(Number(this.hotReloadConfig.interval) || 5000, 2000);
    this.stopHotReload();
    this.pollingTimer = setInterval(() => {
      this.checkForUpdates().catch(error => {
        this.logger.warn('[PermissionDefinitionManager] 热加载轮询失败: %s', error.message);
      });
    }, interval);
    if (typeof this.pollingTimer.unref === 'function') {
      this.pollingTimer.unref();
    }
    this.logger.info('[PermissionDefinitionManager] 热加载已启动，轮询间隔: %dms', interval);
  }

  stopHotReload() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  async checkForUpdates() {
    const latest = await this.repository.getLatestRevision();
    if (latest > (this.lastRevision || 0)) {
      await this.reloadFromDatabase('watcher', { broadcast: false });
      this._broadcastReload();
    }
  }

  _formatDefinitionsForRegistry(records = []) {
    return records.map(record => {
      const plain = typeof record.toJSON === 'function' ? record.toJSON() : record;
      const normalizedPath = this._normalizePath(plain.path);
      return {
        code: plain.code,
        method: (plain.method || 'GET').toUpperCase(),
        path: normalizedPath,
        desc: plain.desc || '',
        group: plain.group || 'default',
        aliases: Array.isArray(plain.aliases) ? plain.aliases : [],
        meta: plain.meta || {},
      };
    });
  }

  _normalizePath(pathname) {
    if (!pathname) {
      return '/';
    }
    const trimmed = pathname.trim();
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (withSlash.length > 1 && withSlash.endsWith('/')) {
      return withSlash.replace(/\/+$/, '');
    }
    return withSlash;
  }

  _bindMessenger() {
    if (this.app.messenger && typeof this.app.messenger.on === 'function') {
      this.app.messenger.on('permission-definitions:reload', this._messengerHandler);
    }
  }

  _handleMessengerSignal(payload) {
    if (!payload || payload.source === this.instanceId) {
      return;
    }
    if (payload.revision && payload.revision <= (this.lastRevision || 0)) {
      return;
    }
    this.reloadFromDatabase('broadcast', { broadcast: false }).catch(error => {
      this.logger.warn('[PermissionDefinitionManager] 广播刷新失败: %s', error.message);
    });
  }

  _broadcastReload() {
    if (!this.app.messenger || typeof this.app.messenger.sendToApp !== 'function') {
      return;
    }
    this.app.messenger.sendToApp('permission-definitions:reload', {
      revision: this.lastRevision,
      source: this.instanceId,
      timestamp: Date.now(),
    });
  }

  async dispose() {
    this.stopHotReload();
    if (this.app.messenger && typeof this.app.messenger.removeListener === 'function') {
      this.app.messenger.removeListener('permission-definitions:reload', this._messengerHandler);
    }
  }
}

module.exports = PermissionDefinitionManager;
