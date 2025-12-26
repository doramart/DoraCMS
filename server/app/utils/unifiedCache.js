/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Description: 统一缓存工具 - 支持Redis和内存缓存
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 */

'use strict';

const { EventEmitter } = require('events');

/**
 * 内存缓存实现
 */
class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600; // 默认1小时
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expiredAt && Date.now() > item.expiredAt) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key, value, ttl = null) {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    const finalTtl = ttl || this.defaultTTL;
    const expiredAt = finalTtl > 0 ? Date.now() + finalTtl * 1000 : null;

    this.cache.set(key, {
      value,
      expiredAt,
      createdAt: Date.now(),
    });

    // 设置过期定时器
    if (expiredAt) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, finalTtl * 1000);

      this.timers.set(key, timer);
    }

    return true;
  }

  async delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  async clear(prefix = null) {
    if (!prefix) {
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      this.cache.clear();
      return true;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        await this.delete(key);
      }
    }
    return true;
  }

  async has(key) {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (item.expiredAt && Date.now() > item.expiredAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Redis缓存实现
 */
class RedisCache {
  constructor(redisClient, options = {}) {
    this.redis = redisClient;
    this.defaultTTL = options.defaultTTL || 3600;
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const finalTtl = ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);

      if (finalTtl > 0) {
        await this.redis.setex(key, finalTtl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async clear(prefix = '') {
    try {
      if (!prefix) {
        await this.redis.flushdb();
        return true;
      }

      const pattern = `${prefix}*`;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');

      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }

  async has(key) {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
}

/**
 * 统一缓存管理器
 */
class UnifiedCache {
  constructor(app) {
    this.app = app;
    this.config = app.config.cache || {};
    this.cacheType = process.env.CACHE_TYPE || this.config.type || 'memory';
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL) || this.config.defaultTTL || 3600;
    // 缓存命名空间，保证不同环境/应用之间的 key 不会互相污染
    this.namespace =
      process.env.CACHE_NAMESPACE ||
      this.config.namespace ||
      `${app.name || 'cms3'}:${process.env.NODE_ENV || 'development'}`;
    this.namespacePrefix = `${this.namespace}:`;

    // 跨进程 watch 配置，用于通知其他 worker / 实例同步缓存变化
    this.watchConfig = Object.assign(
      {
        enabled: true,
        channel: 'unified-cache:watch',
        broadcastValue: true,
      },
      this.config.watch || {}
    );
    this.watchEnabled = this.watchConfig.enabled !== false; // 允许通过配置关闭 watch
    this.watchChannel = this.watchConfig.channel || 'unified-cache:watch';
    this.broadcastValue = !!this.watchConfig.broadcastValue;
    this.emitter = new EventEmitter(); // 进程内事件发布器
    this.instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`; // 本实例标识

    this._initCache();
    this._setupWatchListener();
  }

  _initCache() {
    if (this.cacheType === 'redis') {
      try {
        // 尝试使用Redis
        const redisClient = this.app.redis;
        if (redisClient) {
          this.cache = new RedisCache(redisClient, { defaultTTL: this.defaultTTL });
          this.app.logger.info('UnifiedCache: Using Redis cache');
        } else {
          // Redis不可用，降级到内存缓存
          this._fallbackToMemory();
        }
      } catch (error) {
        this.app.logger.warn('UnifiedCache: Redis not available, falling back to memory cache', error);
        this._fallbackToMemory();
      }
    } else {
      this._fallbackToMemory();
    }
  }

  _fallbackToMemory() {
    const maxSize = parseInt(process.env.MEMORY_CACHE_MAX_SIZE) || this.config.maxSize || 1000;
    this.cache = new MemoryCache({
      maxSize,
      defaultTTL: this.defaultTTL,
    });
    this.cacheType = 'memory';
    this.app.logger.info('UnifiedCache: Using memory cache');
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @return {Promise<any>} 缓存值
   */
  async get(key) {
    return await this.cache.get(this._buildKey(key));
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间（秒），null表示使用默认值
   * @param options
   * @return {Promise<boolean>} 是否成功
   */
  async set(key, value, ttl = null, options = {}) {
    const namespacedKey = this._buildKey(key); // 自动拼接命名空间，避免 key 冲突
    const result = await this.cache.set(namespacedKey, value, ttl);

    if (result && !options.silent) {
      const extra = { ttl }; // ttl 透传，便于其他实例复用
      if (this.broadcastValue) {
        extra.value = value;
      }
      this._emitWatchEvent('set', this._normalizeKey(key), extra);
    }

    return result;
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   * @param options
   * @return {Promise<boolean>} 是否成功
   */
  async delete(key, options = {}) {
    const namespacedKey = this._buildKey(key); // 同样需保证删除命中当前命名空间
    const result = await this.cache.delete(namespacedKey);

    if (result && !options.silent) {
      this._emitWatchEvent('delete', this._normalizeKey(key));
    }

    return result;
  }

  /**
   * 清空所有缓存
   * @param options
   * @return {Promise<boolean>} 是否成功
   */
  async clear(options = {}) {
    // clear 默认仅清理本命名空间的数据，避免误删其他业务缓存
    const result = await this.cache.clear(this._getNamespacePrefix());
    if (result && !options.silent) {
      this._emitWatchEvent('clear', null, { prefix: this._getNamespacePrefix() });
    }
    return result;
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   * @return {Promise<boolean>} 是否存在
   */
  async has(key) {
    return await this.cache.has(this._buildKey(key));
  }

  /**
   * 缓存装饰器 - 自动缓存方法结果
   * @param {string} keyPrefix 缓存键前缀
   * @param {number} ttl 过期时间
   * @param {Function} keyGenerator 键生成函数
   */
  cacheDecorator(keyPrefix, ttl = null, keyGenerator = null) {
    return (target, propertyName, descriptor) => {
      const method = descriptor.value;
      descriptor.value = async function (...args) {
        const cacheKey = keyGenerator
          ? `${keyPrefix}:${keyGenerator(...args)}`
          : `${keyPrefix}:${JSON.stringify(args)}`;

        // 尝试从缓存获取
        const cached = await this.app.cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }

        // 执行原方法
        const result = await method.apply(this, args);

        // 缓存结果
        if (result !== null && result !== undefined) {
          await this.app.cache.set(cacheKey, result, ttl);
        }

        return result;
      };
    };
  }

  /**
   * 获取或设置缓存（如果不存在则执行回调函数）
   * @param {string} key 缓存键
   * @param {Function} callback 回调函数
   * @param {number} ttl 过期时间
   * @return {Promise<any>} 缓存值
   */
  async getOrSet(key, callback, ttl = null) {
    let value = await this.get(key);

    if (value === null) {
      value = await callback();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
    }

    return value;
  }

  /**
   * 批量获取缓存
   * @param {string[]} keys 缓存键数组
   * @return {Promise<Object>} 键值对对象
   */
  async mget(keys) {
    const result = {};

    for (const key of keys) {
      result[key] = await this.get(key);
    }

    return result;
  }

  /**
   * 批量设置缓存
   * @param {Object} pairs 键值对对象
   * @param {number} ttl 过期时间
   * @return {Promise<boolean>} 是否全部成功
   */
  async mset(pairs, ttl = null) {
    const promises = Object.entries(pairs).map(([key, value]) => this.set(key, value, ttl));

    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }

  /**
   * 获取缓存信息
   * @return {Object} 缓存信息
   */
  getInfo() {
    return {
      type: this.cacheType,
      defaultTTL: this.defaultTTL,
      namespace: this.namespace,
      watch: {
        enabled: this.watchEnabled,
        channel: this.watchChannel,
        broadcastValue: this.broadcastValue,
      },
      stats: this.cache.getStats ? this.cache.getStats() : null,
    };
  }

  watch(patternOrHandler, maybeHandler) {
    const hasPattern = typeof maybeHandler === 'function';
    const pattern = hasPattern ? patternOrHandler : null;
    const handler = hasPattern ? maybeHandler : patternOrHandler;

    if (typeof handler !== 'function') {
      throw new Error('UnifiedCache.watch requires a handler function');
    }

    const wrapped = payload => {
      if (!pattern || this._matchPattern(pattern, payload)) {
        handler(payload);
      }
    };

    this.emitter.on('change', wrapped); // 进程内监听
    return () => {
      this.emitter.off('change', wrapped);
    };
  }

  _matchPattern(pattern, payload) {
    if (typeof pattern === 'function') {
      return pattern(payload);
    }

    const key = payload.key || '';
    if (pattern instanceof RegExp) {
      return pattern.test(key);
    }

    if (typeof pattern === 'string') {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return key.startsWith(prefix);
      }
      return key === pattern;
    }

    return false;
  }

  _emitWatchEvent(action, key, extra = {}, options = {}) {
    const payload = Object.assign(
      {
        action,
        key,
        namespace: this.namespace,
        namespacedKey: key ? this._buildKey(key) : null,
        timestamp: Date.now(),
        source: this.instanceId,
      },
      extra
    );

    this._notifyWatchers(payload, !!options.isRemote);

    // watch 可由配置关闭，关闭后仍可触发本地事件但不广播
    if (
      this.watchEnabled &&
      !options.skipBroadcast &&
      this.app.messenger &&
      typeof this.app.messenger.sendToApp === 'function'
    ) {
      this.app.messenger.sendToApp(this.watchChannel, payload);
    }
  }

  _notifyWatchers(payload, isRemote) {
    this.emitter.emit('change', Object.assign({}, payload, { isRemote })); // 保留 isRemote 标识，监听方可区分来源
  }

  _setupWatchListener() {
    if (!this.watchEnabled || !this.app.messenger || typeof this.app.messenger.on !== 'function') {
      return;
    }

    this.app.messenger.on(this.watchChannel, payload => {
      if (!payload || payload.namespace !== this.namespace || payload.source === this.instanceId) {
        return;
      }

      // 远端广播过来的事件需要先落地再通知本地监听器
      this._applyRemoteMutation(payload).finally(() => {
        this._notifyWatchers(payload, true);
      });
    });
  }

  async _applyRemoteMutation(payload) {
    try {
      const namespacedKey = payload.namespacedKey || (payload.key ? this._buildKey(payload.key) : null);
      switch (payload.action) {
        case 'set':
          if (namespacedKey) {
            if (Object.prototype.hasOwnProperty.call(payload, 'value')) {
              await this.cache.set(namespacedKey, payload.value, payload.ttl); // 复用远端数据，避免重复计算
            } else {
              await this.cache.delete(namespacedKey);
            }
          }
          break;
        case 'delete':
          if (namespacedKey) {
            await this.cache.delete(namespacedKey);
          }
          break;
        case 'clear':
          await this.cache.clear(this._getNamespacePrefix());
          break;
        default:
          break;
      }
    } catch (error) {
      this.app.logger.warn('UnifiedCache: Failed to apply remote mutation', error);
    }
  }

  _buildKey(key) {
    const normalizedKey = this._normalizeKey(key);
    return `${this.namespace}:${normalizedKey}`;
  }

  _getNamespacePrefix() {
    return this.namespacePrefix;
  }

  _normalizeKey(key) {
    if (key === null || key === undefined) {
      return String(key);
    }
    return typeof key === 'string' ? key : String(key);
  }
}

module.exports = UnifiedCache;
