/**
 * Sitemap Service - 站点地图服务
 * 基于当前系统架构的优化实现
 * 🔥 专注于 SEO 优化和性能提升
 */
'use strict';

const Service = require('egg').Service;
const moment = require('moment');

class SitemapService extends Service {
  constructor(ctx) {
    super(ctx);

    // 缓存配置
    this.cacheConfig = {
      xmlKey: 'sitemap:xml:main',
      dataKeys: {
        categories: 'sitemap:data:categories',
        contents: 'sitemap:data:contents',
        static: 'sitemap:data:static',
      },
      expire: 3600, // 1小时缓存
      shortExpire: 300, // 5分钟短缓存
    };
  }

  /**
   * 生成 XML Sitemap
   * @param {Object} options 生成选项
   * @return {String} XML 内容
   */
  async generateXMLSitemap(options = {}) {
    const { useCache = true, forceRefresh = false } = options;

    try {
      // 缓存检查
      if (useCache && !forceRefresh) {
        const cached = await this._getCachedXML();
        if (cached) {
          this.ctx.logger.info('Sitemap served from cache');
          return cached;
        }
      }

      // 生成新的 sitemap
      const xml = await this._buildXMLSitemap();

      // 缓存结果
      if (useCache) {
        await this._cacheXML(xml);
      }

      this.ctx.logger.info('Sitemap generated successfully');
      return xml;
    } catch (error) {
      this.ctx.logger.error('Sitemap generation failed:', error);
      throw error;
    }
  }

  /**
   * 构建 XML Sitemap 内容
   * @private
   */
  async _buildXMLSitemap() {
    // 获取系统配置
    const configs = await this.service.systemConfig.getConfigsAsObject();
    const siteDomain = configs.siteDomain || 'https://localhost:8080';
    const lastMod = moment().format('YYYY-MM-DD');

    const urlEntries = [];

    // 1. 首页 (最高优先级)
    urlEntries.push(this._createUrlEntry(siteDomain, 'daily', 1.0, lastMod));

    // 2. 分类页面 (并行获取以提升性能，添加错误处理)
    const [categories, contents, staticPages] = await Promise.allSettled([
      this._getCategoryUrls(siteDomain),
      this._getContentUrls(siteDomain),
      this._getStaticPageUrls(siteDomain),
    ]).then(results => {
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        const types = ['categories', 'contents', 'static pages'];
        this.ctx.logger.warn(`Failed to get ${types[index]} for sitemap:`, result.reason);
        return []; // 返回空数组作为降级处理
      });
    });

    urlEntries.push(...categories, ...contents, ...staticPages);

    // 3. 生成 XML
    return this._wrapXMLSitemap(urlEntries);
  }

  /**
   * 获取分类页面 URLs
   * @param {String} siteDomain 站点域名
   * @private
   */
  async _getCategoryUrls(siteDomain) {
    try {
      // 使用缓存优化
      const cacheKey = this.cacheConfig.dataKeys.categories;
      let categories = await this._getFromCache(cacheKey);

      if (!categories) {
        try {
          categories = await this.service.contentCategory.find(
            { flat: true }, // 🔥 关键：使用平铺格式避免递归树形构建
            {
              fields: ['name', 'defaultUrl', 'updatedAt', 'enable'],
              filters: { enable: { $eq: true } },
              pagination: { isPaging: false },
            }
          );

          // 缓存分类数据
          await this._setCache(cacheKey, categories, this.cacheConfig.shortExpire);
        } catch (queryError) {
          this.ctx.logger.warn('Category query failed, trying fallback:', queryError.message);

          // 🔥 降级处理：尝试更简单的查询
          try {
            categories = await this.service.contentCategory.find(
              { flat: true },
              {
                fields: ['name', 'defaultUrl'],
                filters: { enable: { $eq: true } },
                pagination: { isPaging: false },
              }
            );
          } catch (fallbackError) {
            this.ctx.logger.error('Category fallback query also failed:', fallbackError.message);
            return []; // 完全失败时返回空数组
          }
        }
      }

      const categoryList = Array.isArray(categories) ? categories : categories.docs || [];

      return categoryList.map(category => {
        const url = this._generateCategoryUrl(siteDomain, category);
        const lastMod = category.updatedAt
          ? moment(category.updatedAt).format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD');
        return this._createUrlEntry(url, 'weekly', 0.8, lastMod);
      });
    } catch (error) {
      this.ctx.logger.error('Failed to get category URLs:', error);
      return [];
    }
  }

  /**
   * 获取内容页面 URLs
   * @param {String} siteDomain 站点域名
   * @private
   */
  async _getContentUrls(siteDomain) {
    try {
      // 使用缓存优化
      const cacheKey = this.cacheConfig.dataKeys.contents;
      let contents = await this._getFromCache(cacheKey);

      if (!contents) {
        try {
          contents = await this.service.content.find(
            { isPaging: '0', pageSize: 10000 }, // 🔥 修复：设置足够大的pageSize以获取所有数据
            {
              fields: [
                'title',
                'stitle',
                'categories',
                'state',
                'draft',
                'roofPlacement',
                'id',
                'createdAt',
                'updatedAt',
              ],
              filters: {
                state: { $eq: '2' }, // 已发布状态 (审核通过)
                draft: { $eq: '0' }, // 不在回收站
              },
              populate: [{ path: 'categories', select: ['defaultUrl', 'name'] }],
            }
          );

          // 缓存内容数据
          await this._setCache(cacheKey, contents, this.cacheConfig.shortExpire);
        } catch (queryError) {
          this.ctx.logger.warn('Content query failed, trying fallback:', queryError.message);

          // 🔥 降级处理：尝试更简单的查询，不包含可能有问题的字段
          try {
            contents = await this.service.content.find(
              { isPaging: '0', pageSize: 10000 }, // 🔥 修复：设置足够大的pageSize以获取所有数据
              {
                fields: ['title', 'stitle', 'state', 'draft', 'roofPlacement', 'id', 'createdAt', 'updatedAt'],
                filters: {
                  state: { $eq: '2' },
                  draft: { $eq: '0' },
                },
              }
            );
          } catch (fallbackError) {
            this.ctx.logger.error('Content fallback query also failed:', fallbackError.message);
            return []; // 完全失败时返回空数组
          }
        }
      }

      const contentList = Array.isArray(contents) ? contents : contents.docs || [];

      return contentList.map(content => {
        const url = this._generateContentUrl(siteDomain, content);
        const lastMod = content.updatedAt
          ? moment(content.updatedAt).format('YYYY-MM-DD')
          : moment().format('YYYY-MM-DD');
        // 根据内容质量调整优先级
        const priority = this._calculateContentPriority(content);
        return this._createUrlEntry(url, 'weekly', priority, lastMod);
      });
    } catch (error) {
      this.ctx.logger.error('Failed to get content URLs:', error);
      return [];
    }
  }

  /**
   * 获取静态页面 URLs
   * @param {String} siteDomain 站点域名
   * @private
   */
  async _getStaticPageUrls(siteDomain) {
    const staticPages = [
      { path: '/about', priority: 0.6, changefreq: 'monthly' },
      { path: '/contact', priority: 0.5, changefreq: 'monthly' },
    ];

    const lastMod = moment().format('YYYY-MM-DD');

    return staticPages.map(page =>
      this._createUrlEntry(`${siteDomain}${page.path}`, page.changefreq, page.priority, lastMod)
    );
  }

  /**
   * 生成分类 URL
   * @param {String} siteDomain 站点域名
   * @param {Object} category 分类对象
   * @private
   */
  _generateCategoryUrl(siteDomain, category) {
    // 🔥 修复：获取分类 ID，支持 MariaDB 和 MongoDB
    const categoryId = category.id || category._id || category.dataValues?.id || category.get?.('id');

    if (category.defaultUrl) {
      if (categoryId) {
        return `${siteDomain}/${category.defaultUrl}___${categoryId}`;
      }
      return `${siteDomain}/${category.defaultUrl}`;
    }

    if (categoryId) {
      return `${siteDomain}/category/${categoryId}`;
    }

    // 最后备用方案：使用分类名称
    if (category.name) {
      const slug = category.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-');
      return `${siteDomain}/category/${slug}`;
    }

    return `${siteDomain}/category/unknown`;
  }

  /**
   * 生成内容 URL
   * @param {String} siteDomain 站点域名
   * @param {Object} content 内容对象
   * @private
   */
  _generateContentUrl(siteDomain, content) {
    // 🔥 修复：生成安全的 slug
    const generateSlug = text => {
      if (!text) return '';
      return (
        text
          .toString()
          .trim()
          // 移除 HTML 标签
          .replace(/<[^>]*>/g, '')
          // 替换空格为连字符
          .replace(/\s+/g, '-')
          // 移除特殊字符，但保留中文、英文、数字和连字符
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\-]/g, '')
          // 清理多余的连字符
          .replace(/^-+|-+$/g, '')
          .replace(/-{2,}/g, '-')
          .substring(0, 100)
      );
    };

    // 获取内容 ID
    const contentId = content.id || content._id || content.dataValues?.id || content.get?.('id');

    // 生成 slug：优先使用 stitle，然后是处理过的 title，最后是 ID
    let slug = content.stitle;
    if (!slug && content.title) {
      slug = generateSlug(content.title);
    }
    if (!slug && contentId) {
      slug = contentId.toString();
    }
    if (!slug) {
      slug = 'untitled';
    }

    // 如果有分类，使用分类路径
    if (content.categories && content.categories.length > 0) {
      const category = content.categories[0];
      if (category.defaultUrl) {
        return `${siteDomain}/${category.defaultUrl}/${slug}`;
      }
    }

    // 默认内容路径
    return `${siteDomain}/content/${slug}`;
  }

  /**
   * 计算内容优先级
   * @param {Object} content 内容对象
   * @private
   */
  _calculateContentPriority(content) {
    let priority = 0.5; // 基础优先级

    // 根据更新时间调整 (最近更新的内容优先级更高)
    const daysSinceUpdate = moment().diff(moment(content.updatedAt), 'days');
    if (daysSinceUpdate < 7) {
      priority += 0.1; // 一周内更新 +0.1
    } else if (daysSinceUpdate < 30) {
      priority += 0.05; // 一月内更新 +0.05
    }

    // 确保优先级在合理范围内
    return Math.min(Math.max(priority, 0.1), 0.9);
  }

  /**
   * 创建 URL 条目
   * @param {String} loc 位置
   * @param {String} changefreq 更新频率
   * @param {Number} priority 优先级
   * @param {String} lastmod 最后修改时间
   * @private
   */
  _createUrlEntry(loc, changefreq, priority, lastmod) {
    return { loc, changefreq, priority, lastmod };
  }

  /**
   * 包装 XML 格式
   * @param {Array} urlEntries URL 条目数组
   * @private
   */
  _wrapXMLSitemap(urlEntries) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    urlEntries.forEach(entry => {
      xml += '<url>';
      xml += `<loc>${this._escapeXml(entry.loc)}</loc>`;
      xml += `<changefreq>${entry.changefreq}</changefreq>`;
      xml += `<lastmod>${entry.lastmod}</lastmod>`;
      xml += `<priority>${entry.priority}</priority>`;
      xml += '</url>';
    });

    xml += '</urlset>';
    return xml;
  }

  /**
   * XML 转义
   * @param {String} str 字符串
   * @private
   */
  _escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 增量更新 Sitemap
   * @param {String} type 更新类型：content, category
   * @param {String} action 操作：create, update, delete
   * @param {Object} data 相关数据
   */
  async incrementalUpdate(type, action, data) {
    try {
      // 清除相关缓存
      await this._clearRelatedCache(type);

      // 记录更新日志
      this.ctx.logger.info(`Sitemap incremental update: ${type}:${action}`, {
        id: data.id,
        action,
      });

      return true;
    } catch (error) {
      this.ctx.logger.error('Sitemap incremental update failed:', error);
      return false;
    }
  }

  // ===== 缓存管理方法 =====

  /**
   * 获取缓存的 XML
   * @private
   */
  async _getCachedXML() {
    try {
      return await this.app.cache.get(this.cacheConfig.xmlKey);
    } catch (error) {
      this.ctx.logger.warn('Failed to get cached XML:', error);
      return null;
    }
  }

  /**
   * 缓存 XML
   * @param {String} xml XML 内容
   * @private
   */
  async _cacheXML(xml) {
    try {
      await this.app.cache.set(this.cacheConfig.xmlKey, xml, this.cacheConfig.expire);
    } catch (error) {
      this.ctx.logger.warn('Failed to cache XML:', error);
    }
  }

  /**
   * 从缓存获取数据
   * @param {String} key 缓存键
   * @private
   */
  async _getFromCache(key) {
    try {
      return await this.app.cache.get(key);
    } catch (error) {
      this.ctx.logger.warn(`Failed to get cache for key: ${key}`, error);
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {String} key 缓存键
   * @param {*} data 数据
   * @param {Number} expire 过期时间
   * @private
   */
  async _setCache(key, data, expire) {
    try {
      await this.app.cache.set(key, data, expire);
    } catch (error) {
      this.ctx.logger.warn(`Failed to set cache for key: ${key}`, error);
    }
  }

  /**
   * 清除相关缓存
   * @param {String} type 类型
   * @private
   */
  async _clearRelatedCache(type) {
    const keysToInvalidate = [this.cacheConfig.xmlKey];

    // 根据类型清除对应的数据缓存
    if (type === 'content') {
      keysToInvalidate.push(this.cacheConfig.dataKeys.contents);
    } else if (type === 'category') {
      keysToInvalidate.push(this.cacheConfig.dataKeys.categories);
    }

    for (const key of keysToInvalidate) {
      try {
        await this.app.cache.del(key);
      } catch (error) {
        this.ctx.logger.warn(`Failed to clear cache for key: ${key}`, error);
      }
    }
  }

  /**
   * 清除所有 Sitemap 相关缓存
   */
  async clearAllCache() {
    const allKeys = [this.cacheConfig.xmlKey, ...Object.values(this.cacheConfig.dataKeys)];

    for (const key of allKeys) {
      try {
        await this.app.cache.del(key);
      } catch (error) {
        this.ctx.logger.warn(`Failed to clear cache for key: ${key}`, error);
      }
    }

    this.ctx.logger.info('All sitemap cache cleared');
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    const stats = {
      xmlCached: false,
      categoriesCached: false,
      contentsCached: false,
      staticCached: false,
    };

    try {
      stats.xmlCached = !!(await this.app.cache.get(this.cacheConfig.xmlKey));
      stats.categoriesCached = !!(await this.app.cache.get(this.cacheConfig.dataKeys.categories));
      stats.contentsCached = !!(await this.app.cache.get(this.cacheConfig.dataKeys.contents));
      stats.staticCached = !!(await this.app.cache.get(this.cacheConfig.dataKeys.static));
    } catch (error) {
      this.ctx.logger.warn('Failed to get cache stats:', error);
    }

    return stats;
  }
}

module.exports = SitemapService;
