'use strict';

const pathToRegexpLib = require('path-to-regexp');
const pathToRegexp =
  typeof pathToRegexpLib === 'function'
    ? pathToRegexpLib
    : typeof pathToRegexpLib.pathToRegexp === 'function'
      ? pathToRegexpLib.pathToRegexp
      : null;

/**
 * PermissionRegistry
 * 统一维护权限定义，兼容 MongoDB / MariaDB 模式
 *
 * 使用方式：
 *  - registry.register([{ code, method, path, desc, group, aliases }])
 *  - registry.match(method, path, allowedCodes)
 *  - registry.getByCode(code)
 */
class PermissionRegistry {
  constructor(logger, options = {}) {
    this.logger = logger || console;
    this.options = Object.assign(
      {
        enableDebugLog: false,
      },
      options
    );
    this.permissions = new Map(); // code -> { ...definition }
    this.aliasMap = new Map(); // alias(api) -> code
    this.pathCache = new Map(); // pathRegex cache

    if (!pathToRegexp) {
      this.logger.warn('[PermissionRegistry] path-to-regexp 未正确初始化，路径匹配功能将不可用');
    }
  }

  /**
   * 注册权限定义
   * @param {Array<Object>} definitions
   */
  register(definitions = []) {
    if (!Array.isArray(definitions)) {
      return;
    }

    definitions.forEach(def => {
      if (!def || !def.code) {
        return;
      }
      const normalized = {
        code: def.code,
        method: (def.method || 'GET').toUpperCase(),
        path: def.path,
        desc: def.desc || '',
        group: def.group || 'default',
        meta: def.meta || {},
      };
      this.permissions.set(def.code, normalized);

      if (Array.isArray(def.aliases)) {
        def.aliases.forEach(alias => {
          if (alias) {
            this.aliasMap.set(alias.toLowerCase(), def.code);
          }
        });
      }

      if (def.path) {
        this._ensurePathRegexCache(def.path);
      }
    });

    if (this.options.enableDebugLog) {
      this.logger.info('[PermissionRegistry] 已注册权限数量: %s', this.permissions.size);
    }
  }

  /**
   * 重置并重新注册权限集合
   * @param {Array<Object>} definitions
   */
  reset(definitions = []) {
    this.permissions.clear();
    this.aliasMap.clear();
    this.pathCache.clear();
    this.register(definitions);
  }

  /**
   * 根据 code 获取定义
   * @param {String} code
   * @return {Object|null}
   */
  getByCode(code) {
    if (!code) return null;
    return this.permissions.get(code) || null;
  }

  /**
   * 根据旧版 api 标识（如 menu/getList）解析权限 code
   * @param {String} legacyApi
   * @return {Object|null}
   */
  getByLegacyApi(legacyApi) {
    if (!legacyApi) return null;
    const code = this.aliasMap.get(legacyApi.toLowerCase());
    if (!code) {
      return null;
    }
    return this.getByCode(code);
  }

  /**
   * 判断请求是否在允许的权限内
   * @param {String} method
   * @param {String} requestPath
   * @param {Array<String>} allowedCodes
   * @return {Boolean}
   */
  match(method, requestPath, allowedCodes = []) {
    if (!allowedCodes || allowedCodes.length === 0) {
      return false;
    }

    const upperMethod = (method || 'GET').toUpperCase();
    const normalizedPath = this._normalizePath(requestPath);

    for (const code of allowedCodes) {
      const definition = this.getByCode(code);
      if (!definition || !definition.path) {
        continue;
      }

      if (definition.method && definition.method !== upperMethod) {
        continue;
      }

      const regex = this._ensurePathRegexCache(definition.path);
      if (regex && regex.test(normalizedPath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取全部权限（调试用）
   */
  getAll() {
    return Array.from(this.permissions.values());
  }

  /**
   * 记录调试日志
   * @param  {...any} args
   */
  debug(...args) {
    if (this.options.enableDebugLog) {
      this.logger.info('[PermissionRegistry]', ...args);
    }
  }

  _normalizePath(pathname) {
    if (!pathname) {
      return '/';
    }
    if (pathname.endsWith('/')) {
      return pathname.slice(0, -1) || '/';
    }
    return pathname;
  }

  _ensurePathRegexCache(pattern) {
    if (!pattern || !pathToRegexp) {
      return null;
    }
    const key = this._normalizePath(pattern);
    if (this.pathCache.has(key)) {
      return this.pathCache.get(key);
    }
    const keys = [];
    const regexp = pathToRegexp(this._normalizePath(pattern), keys, {
      sensitive: false,
      strict: false,
      end: true,
    });
    this.pathCache.set(key, regexp);
    return regexp;
  }
}

module.exports = PermissionRegistry;
