const fallbackRateLimitCache = new Map();

const getCacheClient = app => app.cache;

const getFromCache = async (ctx, key) => {
  const cache = getCacheClient(ctx.app);
  if (cache?.get) {
    return await cache.get(key);
  }
  const record = fallbackRateLimitCache.get(key);
  if (!record) {
    return null;
  }
  if (record.expiresAt && record.expiresAt < Date.now()) {
    fallbackRateLimitCache.delete(key);
    return null;
  }
  return record.value;
};

const setCacheValue = async (ctx, key, value, ttlSeconds) => {
  const cache = getCacheClient(ctx.app);
  if (cache?.set) {
    await cache.set(key, value, ttlSeconds);
    return;
  }
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  fallbackRateLimitCache.set(key, { value, expiresAt });
};

module.exports = () => {
  return async function rateLimit(ctx, next) {
    if (!ctx.apiKey) {
      await next();
      return;
    }

    const { rateLimit } = ctx.apiKey;
    const key = `rate_limit:${ctx.apiKey.key}`;
    const now = Date.now();
    const window = rateLimit.period * 1000; // Convert to milliseconds

    // 获取当前计数
    let currentCount = 0;
    const cacheData = await getFromCache(ctx, key);

    if (cacheData) {
      // 检查是否过期
      if (now - cacheData.timestamp > window) {
        // 已过期，重置计数
        currentCount = 0;
      } else {
        currentCount = cacheData.count;
      }
    }

    if (currentCount >= rateLimit.requests) {
      ctx.status = 429;
      ctx.body = {
        success: false,
        message: 'Rate limit exceeded',
      };
      return;
    }

    // 更新计数
    await setCacheValue(
      ctx,
      key,
      {
        count: currentCount + 1,
        timestamp: now,
      },
      Math.ceil(window / 1000)
    );

    await next();
  };
};
