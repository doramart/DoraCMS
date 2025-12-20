/**
 * Sitemap Updater Middleware - 增量更新中间件
 * 🔥 监听内容变更，自动触发 sitemap 更新
 */
'use strict';

module.exports = (options = {}) => {
  return async function sitemapUpdater(ctx, next) {
    // 记录请求开始时间
    const startTime = Date.now();

    try {
      // 执行下一个中间件
      await next();

      // 检查是否需要更新 sitemap
      await checkAndUpdateSitemap(ctx, startTime);
    } catch (error) {
      // 即使出错也要检查 sitemap 更新
      try {
        await checkAndUpdateSitemap(ctx, startTime);
      } catch (updateError) {
        ctx.logger.warn('Sitemap update check failed:', updateError);
      }

      throw error; // 重新抛出原始错误
    }
  };
};

/**
 * 检查并更新 sitemap
 * @param {Object} ctx EggJS 上下文
 * @param {Number} startTime 开始时间
 */
async function checkAndUpdateSitemap(ctx, startTime) {
  // 只处理成功的请求
  if (ctx.status < 200 || ctx.status >= 400) {
    return;
  }

  // 只处理相关的 API 路径
  const relevantPaths = ['/api/content', '/api/contentCategory', '/manage/content', '/manage/contentCategory'];

  const isRelevantPath = relevantPaths.some(path => ctx.path.startsWith(path));
  if (!isRelevantPath) {
    return;
  }

  // 只处理会影响 sitemap 的方法
  const relevantMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!relevantMethods.includes(ctx.method)) {
    return;
  }

  try {
    // 解析更新类型和操作
    const updateInfo = parseUpdateInfo(ctx);
    if (!updateInfo) {
      return;
    }

    // 异步更新 sitemap (不阻塞响应)
    setImmediate(async () => {
      try {
        await ctx.service.sitemap.incrementalUpdate(updateInfo.type, updateInfo.action, updateInfo.data);

        const duration = Date.now() - startTime;
        ctx.logger.info('Sitemap updated successfully', {
          type: updateInfo.type,
          action: updateInfo.action,
          duration: `${duration}ms`,
          path: ctx.path,
          method: ctx.method,
        });
      } catch (error) {
        ctx.logger.error('Sitemap update failed:', error, {
          type: updateInfo.type,
          action: updateInfo.action,
          path: ctx.path,
          method: ctx.method,
        });
      }
    });
  } catch (error) {
    ctx.logger.warn('Sitemap update check failed:', error);
  }
}

/**
 * 解析更新信息
 * @param {Object} ctx EggJS 上下文
 * @return {Object|null} 更新信息
 */
function parseUpdateInfo(ctx) {
  const path = ctx.path;
  const method = ctx.method;

  // 解析资源类型
  let type = null;
  if (path.includes('/content') && !path.includes('/contentCategory')) {
    type = 'content';
  } else if (path.includes('/contentCategory')) {
    type = 'category';
  }

  if (!type) {
    return null;
  }

  // 解析操作类型
  let action = null;
  switch (method) {
    case 'POST':
      action = 'create';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'update';
      break;
    case 'DELETE':
      action = 'delete';
      break;
    default:
      return null;
  }

  // 提取相关数据
  const data = {
    id: extractIdFromPath(path) || extractIdFromBody(ctx),
    path,
    method,
    timestamp: new Date().toISOString(),
  };

  // 添加请求体数据 (用于判断是否影响 URL)
  if (ctx.request.body) {
    const body = ctx.request.body;
    data.changes = {
      title: body.title,
      name: body.name,
      stitle: body.stitle,
      defaultUrl: body.defaultUrl,
      status: body.status,
      enable: body.enable,
    };
  }

  return { type, action, data };
}

/**
 * 从路径中提取 ID
 * @param {String} path 请求路径
 * @return {String|null} ID
 */
function extractIdFromPath(path) {
  // 匹配路径中的 ID 模式
  const patterns = [
    /\/([a-f0-9]{24})$/i, // MongoDB ObjectId
    /\/(\d+)$/, // 数字 ID
    /\/([a-zA-Z0-9_-]+)$/, // 通用 ID
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * 从请求体中提取 ID
 * @param {Object} ctx EggJS 上下文
 * @return {String|null} ID
 */
function extractIdFromBody(ctx) {
  const body = ctx.request.body;
  if (!body) return null;

  return body.id || body._id || body.ids || null;
}

/**
 * 判断变更是否影响 sitemap
 * @param {Object} changes 变更数据
 * @param {String} type 资源类型
 * @return {Boolean} 是否影响
 */
function isAffectingSitemap(changes, type) {
  if (!changes) return true; // 保守策略：没有变更信息时认为影响

  // 影响 sitemap 的字段
  const affectingFields = {
    content: ['title', 'stitle', 'state', 'draft', 'categories'],
    category: ['name', 'defaultUrl', 'enable', 'parentId'],
  };

  const fields = affectingFields[type] || [];

  return fields.some(field => changes.hasOwnProperty(field));
}
