'use strict';
const Controller = require('egg').Controller;
// const _ = require('lodash');
const shortid = require('shortid');
const pkg = require('../../../package.json');
const validator = require('validator');
const captcha = require('trek-captcha');
const path = require('path');
const fs = require('fs');
const qr = require('qr-image');
const moment = require('moment');

class HomeController extends Controller {
  // 🗑️ 已移除 getSiteInfo 方法 - 现在直接使用 templateResolver 中的 site 变量

  async getImgCode(ctx) {
    const { token, buffer } = await captcha();
    ctx.session.imageCode = token;
    ctx.set('Content-Type', 'image/png');
    ctx.status = 200;
    ctx.body = buffer;
  }

  async createQRCode(ctx) {
    const text = ctx.request.query.text || '';
    if (text) {
      const img = qr.image(text, {
        size: 10,
      });
      ctx.set('Content-Type', 'image/png');
      ctx.status = 200;
      ctx.body = img;
    } else {
      throw new Error(ctx.__('validation.errorParams'));
    }
  }

  async getRobotsPage(ctx) {
    const stream = fs.readFileSync(path.join(__dirname, '../../../robots.txt'), 'utf-8');
    ctx.body = stream;
  }

  async getDataForNunjucksTestPage() {
    const ctx = this.ctx;
    const dbType = ctx.params.db || ctx.query.db || 'mariadb'; // 支持URL参数和查询参数
    const templateName = dbType === 'mongo' ? 'index-mongo' : 'index';
    // 直接渲染指定模板
    const templatePath = path.join(
      this.app.baseDir,
      'app',
      'view',
      'nunjucks-template-test',
      'templates',
      `${templateName}.html`
    );
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    // 可根据需要传递数据，这里传递空对象
    const html = await this.ctx.renderString(
      templateContent,
      { member: this.ctx.session.user, logined: !!this.ctx.session.user },
      {
        path: templatePath,
      }
    );
    ctx.body = html;
  }

  async getSiteMapPage() {
    try {
      // 🚀 使用新的 Sitemap 服务，支持缓存和性能优化
      const xml = await this.ctx.service.sitemap.generateXMLSitemap({
        useCache: true,
        forceRefresh: this.ctx.query.refresh === 'true', // 支持强制刷新
      });

      // 设置响应头
      this.ctx.set('Content-Type', 'application/xml; charset=utf-8');
      this.ctx.set('Cache-Control', 'public, max-age=3600'); // 客户端缓存1小时
      this.ctx.set('Last-Modified', new Date().toUTCString());

      // 添加性能监控
      const startTime = this.ctx.startTime || Date.now();
      const duration = Date.now() - startTime;
      this.ctx.set('X-Response-Time', `${duration}ms`);

      this.ctx.body = xml;

      // 记录访问日志
      this.ctx.logger.info('Sitemap XML served', {
        userAgent: this.ctx.get('User-Agent'),
        ip: this.ctx.ip,
        duration: `${duration}ms`,
        cached: !this.ctx.query.refresh,
      });
    } catch (error) {
      this.ctx.logger.error('Sitemap generation failed:', error);

      // 错误处理 - 返回基础的 sitemap
      this.ctx.status = 500;
      this.ctx.set('Content-Type', 'application/xml; charset=utf-8');
      this.ctx.body = this._generateFallbackSitemap();
    }
  }

  /**
   * 生成备用的基础 sitemap (错误时使用)
   * @private
   */
  _generateFallbackSitemap() {
    const moment = require('moment');
    const lastMod = moment().format('YYYY-MM-DD');

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    xml += '<url>';
    xml += '<loc>https://localhost:8080</loc>'; // 默认首页
    xml += '<changefreq>daily</changefreq>';
    xml += `<lastmod>${lastMod}</lastmod>`;
    xml += '<priority>1.0</priority>';
    xml += '</url>';
    xml += '</urlset>';

    return xml;
  }

  async getDataForIndexPage() {
    const ctx = this.ctx;
    ctx.query.current = ctx.params.current;
    ctx.pageType = 'index';

    try {
      // 获取首页内容数据
      const pageData = await this._getIndexPageData(ctx);

      // 使用增强的模板系统渲染首页（支持动态布局）
      const html = await ctx.service.templateResolver.render(
        null, // 首页没有特定分类
        'index',
        null,
        pageData,
        {
          layoutOverride: ctx.query.layout, // 支持URL参数动态切换布局
        }
      );

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Index page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForCatePage() {
    const ctx = this.ctx;
    ctx.pageType = 'cate';
    const typeId = ctx.params.typeId;
    const current = ctx.params.current;

    if (!typeId || !ctx.validateId(typeId)) {
      ctx.redirect('/');
      return;
    }

    if (current && !validator.isNumeric(current)) {
      ctx.redirect('/');
      return;
    }

    try {
      // 获取分类信息
      const category = await ctx.service.contentCategory.findById(typeId);
      if (!category) {
        ctx.redirect('/');
        return;
      }

      // 获取分类页面数据
      const pageData = await this._getCategoryPageData(ctx, category);

      // 使用增强的模板系统渲染分类页面（支持动态布局）
      const html = await ctx.service.templateResolver.render(category, 'list', null, pageData, {
        layoutOverride: ctx.query.layout, // 支持URL参数动态切换布局
      });

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Category page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForSearchPage() {
    const ctx = this.ctx;
    ctx.pageType = 'search';
    const searchkey = ctx.params.searchkey;
    const current = ctx.params.current;

    if (!searchkey) {
      ctx.redirect('/');
      return;
    }

    if (current && !validator.isNumeric(current)) {
      ctx.redirect('/');
      return;
    }

    try {
      // 获取搜索页面数据
      const pageData = await this._getSearchPageData(ctx, searchkey);

      // 使用增强的模板系统渲染搜索页面（支持动态布局）
      const html = await ctx.service.templateResolver.render(
        null, // 搜索页面没有特定分类
        'search',
        null,
        pageData,
        {
          layoutOverride: ctx.query.layout, // 支持URL参数动态切换布局
        }
      );

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Search page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForTagPage() {
    const ctx = this.ctx;
    ctx.pageType = 'tag';
    const tagName = ctx.params.tagName;
    const current = ctx.params.current;

    if (!tagName) {
      ctx.redirect('/');
      return;
    }

    if (current && !validator.isNumeric(current)) {
      ctx.redirect('/');
      return;
    }

    try {
      // 获取标签页面数据
      const pageData = await this._getTagPageData(ctx, tagName);

      // 使用新模板系统渲染标签页面
      const html = await ctx.service.templateResolver.render(
        null, // 标签页面没有特定分类
        'tag',
        null,
        pageData
      );

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Tag page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForAuthorPage() {
    const ctx = this.ctx;
    ctx.pageType = 'author';
    const userId = ctx.params.userId;
    const current = ctx.params.current;

    if (!userId || !ctx.validateId(userId)) {
      ctx.redirect('/');
      return;
    }

    if (current && !validator.isNumeric(current)) {
      ctx.redirect('/');
      return;
    }

    try {
      // 获取作者页面数据
      const pageData = await this._getAuthorPageData(ctx, userId);

      // 使用新模板系统渲染作者页面
      const html = await ctx.service.templateResolver.render(
        null, // 作者页面没有特定分类
        'author',
        null,
        pageData
      );

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Author page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForContentDetails() {
    const ctx = this.ctx;
    const contentId = ctx.params.id;

    if (!contentId || !ctx.validateId(contentId)) {
      ctx.redirect('/');
      return;
    }

    try {
      // 获取内容详情
      const content = await ctx.service.content.findById(contentId);
      if (!content) {
        ctx.redirect('/');
        return;
      }

      // 🔥 增加点击量（访问文章详情时）
      // 使用异步方式，不阻塞页面渲染
      ctx.service.content.inc(contentId, { clickNum: 1 }).catch(err => {
        ctx.logger.warn('增加点击量失败:', err.message);
      });

      // 获取内容所属分类
      let category = null;
      if (content.categories && content.categories.length > 0) {
        category = await ctx.service.contentCategory.findById(content.categories[0]?.id);
      }

      // 获取详情页面数据
      const pageData = await this._getContentDetailPageData(ctx, content, category);

      // 使用增强的模板系统渲染详情页面（支持动态布局）
      const html = await ctx.service.templateResolver.render(category, 'post', null, pageData, {
        layoutOverride: ctx.query.layout, // 支持URL参数动态切换布局
      });

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Content detail page render error:', error);
      await this._handlePageError(ctx, error);
    }
  }

  async getDataForErr() {
    const ctx = this.ctx;
    ctx.pageType = 'error';

    try {
      // 获取错误页面数据
      const pageData = await this._getErrorPageData(ctx);

      // 使用新模板系统渲染错误页面
      const html = await ctx.service.templateResolver.render(
        null, // 错误页面没有特定分类
        'error',
        null,
        pageData
      );

      ctx.body = html;
    } catch (error) {
      ctx.logger.error('Error page render error:', error);
      // 错误页面出错时使用最简单的回退方案
      ctx.body = '<html><body><h1>500 Internal Server Error</h1></body></html>';
      ctx.status = 500;
    }
  }

  // ===== 私有方法 - 页面数据获取 =====

  /**
   * 获取首页数据
   * @param {Object} ctx 上下文对象
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getIndexPageData(ctx) {
    const payload = { ...ctx.params, ...ctx.query };
    payload.current = ctx.params.current;

    // 🔥 优化：直接调用服务层，避免HTTP自调用造成的性能问题
    // const { docs, pageInfo } = await ctx.service.content.find(payload, {
    //   populate: [
    //     { path: 'adminAuthor', select: ['userName', 'logo'] },
    //     { path: 'userAuthor', select: ['userName', 'logo'] },
    //     { path: 'categories', select: ['name', 'defaultUrl'] },
    //   ],
    // });

    return {
      pageType: 'index',
      // posts: docs,
      // pageInfo,
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
    };
  }

  /**
   * 获取分类页面数据
   * @param {Object} ctx 上下文对象
   * @param {Object} category 分类对象
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getCategoryPageData(ctx, category) {
    const payload = { ...ctx.params, ...ctx.query };

    // 🔥 构建标准化查询条件
    const filters = { draft: { $eq: '0' }, state: { $eq: '2' } };
    const sort = [{ field: 'createdAt', order: 'desc' }];

    // 分类筛选
    if (category.id) {
      filters.categories = { $eq: category.id };
    }

    // 🔥 优化：直接调用服务层，避免HTTP自调用造成的性能问题
    const { docs, pageInfo } = await ctx.service.content.find(payload, {
      filters,
      sort,
      searchKeys: ['title', 'stitle', 'discription', 'comments'],
      fields: getContentListFields().split(' ').filter(Boolean),
    });

    // 🔥 优化：直接调用服务层获取分类层级
    const currentCateList = await ctx.service.contentCategory.getCurrentCategoriesById(category.id, null);

    return {
      pageType: 'cate',
      posts: docs,
      pageInfo,
      cateInfo: category,
      currentCateList,
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
      list_title: category.name,
      // SEO 信息现在通过模板中的 site 变量和 cateInfo 来构建
      seoOverride: {
        title: category.name, // 模板中可以用 {{ seoOverride.title }} | {{ site.name }}
        keywords: category.keywords,
        description: category.comments,
      },
    };
  }

  /**
   * 获取搜索页面数据
   * @param {Object} ctx 上下文对象
   * @param {String} searchkey 搜索关键词
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getSearchPageData(ctx, searchkey) {
    const payload = { ...ctx.params, ...ctx.query };

    // 🔥 关键：设置搜索关键词，触发 BaseMariaRepository 的搜索逻辑
    payload.searchkey = searchkey;

    // 🔥 优化：直接调用服务层，避免HTTP自调用造成的性能问题
    const { docs, pageInfo } = await ctx.service.content.find(payload, {
      filters: {
        state: { $eq: '2' }, // 只查询已发布的内容
        draft: { $eq: '0' }, // 排除草稿
      },
      sort: [
        { field: 'createdAt', order: 'desc' }, // 按创建时间倒序
      ],
      // 🔥 关键：指定搜索字段，支持在 title, stitle, discription, comments 中搜索
      searchKeys: ['title', 'stitle', 'discription', 'comments'],
      fields: getContentListFields().split(' ').filter(Boolean),
      // 🔥 新增：启用搜索调试（通过URL参数 ?debug=1 启用）
      debug: ctx.query.debug === '1' || process.env.NODE_ENV === 'development',
    });

    // 🔥 优化：如果没有搜索结果，尝试模糊匹配或相关推荐
    let relatedPosts = [];
    if (docs.length === 0 && searchkey.length > 1) {
      // 尝试获取相关内容推荐
      relatedPosts = await this._getRelatedContentForSearch(ctx, searchkey);
    }

    return {
      pageType: 'search',
      posts: docs,
      pageInfo,
      searchKey: searchkey,
      relatedPosts, // 🔥 新增：相关推荐内容
      searchStats: {
        // 🔥 新增：搜索统计信息
        totalResults: pageInfo.totalDocs || 0,
        searchTime: Date.now(), // 可以用于计算搜索耗时
        hasResults: docs.length > 0,
      },
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
      list_title: ctx.__('search.label') + '：' + searchkey,
    };
  }

  /**
   * 获取标签页面数据
   * @param {Object} ctx 上下文对象
   * @param {String} tagName 标签名称
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getTagPageData(ctx, tagName) {
    const payload = { ...ctx.params, ...ctx.query };

    // 🔥 优化1：通过标签名称获取标签ID，使用ID查询更高效（带缓存）
    const targetTag = await this._getTagByNameWithCache(ctx, tagName);

    if (!targetTag) {
      // 如果标签不存在，返回空结果
      return {
        pageType: 'tag',
        posts: [],
        pageInfo: { totalDocs: 0, page: 1, totalPages: 0, pageSize: 20 },
        targetTagName: tagName,
        targetTag: null,
        // member: ctx.session.user,
        // logined: !!ctx.session.user,
        list_title: ctx.__('content.fields.tag') + '：' + tagName,
      };
    }

    // 🔥 优化2：使用标签ID进行查询，并设置正确的过滤条件
    const { docs, pageInfo } = await ctx.service.content.find(payload, {
      filters: {
        state: { $eq: '2' }, // 只查询已发布的内容
        draft: { $eq: '0' }, // 排除草稿
        tags: { $eq: targetTag.id }, // 🔥 关键：使用标签ID查询关联内容
      },
      sort: [
        { field: 'createdAt', order: 'desc' }, // 按创建时间倒序
      ],
      searchKeys: ['title', 'stitle', 'discription', 'comments'],
      fields: getContentListFields().split(' ').filter(Boolean),
    });

    return {
      pageType: 'tag',
      posts: docs,
      pageInfo,
      targetTagName: tagName,
      targetTag, // 🔥 优化4：返回完整的标签信息
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
      list_title: ctx.__('content.fields.tag') + '：' + tagName,
    };
  }

  /**
   * 获取作者页面数据
   * @param {Object} ctx 上下文对象
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getAuthorPageData(ctx, userId) {
    const payload = { ...ctx.params, ...ctx.query };
    payload.userId = userId;

    // 🔥 优化：直接调用服务层，避免HTTP自调用造成的性能问题
    const result = await ctx.service.content.find(payload, {
      populate: [
        { path: 'adminAuthor', select: ['userName', 'logo'] },
        { path: 'userAuthor', select: ['userName', 'logo'] },
        { path: 'categories', select: ['name', 'defaultUrl'] },
      ],
    });

    const { docs, pageInfo } = result;
    let author = null;

    // 如果是查询特定作者的内容，需要获取作者信息
    if (userId) {
      try {
        author = await ctx.service.user.findById(userId, {
          fields: ['userName', 'logo', 'email'],
        });
      } catch (error) {
        ctx.logger.warn('获取作者信息失败:', error.message);
      }
    }

    return {
      pageType: 'author',
      posts: docs,
      pageInfo,
      author,
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
    };
  }

  /**
   * 获取内容详情页面数据
   * @param {Object} ctx 上下文对象
   * @param {Object} content 内容对象
   * @param {Object} category 分类对象
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getContentDetailPageData(ctx, content, category) {
    // 获取当前分类层级
    let currentCateList = [];
    if (content.id) {
      // 🔥 优化：直接调用服务层获取分类层级
      currentCateList = await ctx.service.contentCategory.getCurrentCategoriesById(null, content.id);
    }

    // 处理作者信息
    if (content.uAuthor) {
      content.author = content.uAuthor;
      content.author.isAdmin = false;
    } else if (content.author) {
      // content.author = content.author;
      content.author.isAdmin = true;
    }

    // 🔥 获取配置用于 Open Graph 数据（这个还需要，因为涉及到外部API）
    const configs = await ctx.service.systemConfig.getConfigsAsObject();
    const siteDomain = configs?.siteDomain || '';
    let ogImg = `${siteDomain}${this.app.config.static.prefix}/themes/default/images/mobile_logo2.jpeg`;

    if (content.sImg && !content.sImg.includes('defaultImg.jpg')) {
      ogImg = siteDomain + content.sImg;
    }

    return {
      pageType: 'post',
      post: content,
      cateInfo: category,
      currentCateList,
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
      // SEO 信息现在通过模板中的 site 变量和 post 来构建
      seoOverride: {
        title: content.title, // 模板中可以用 {{ seoOverride.title }} | {{ site.name }}
        description: content.discription,
        keywords: content.keywords ? content.keywords.join(',') : null,
      },
      ogData: {
        url: siteDomain + content.url,
        img: ogImg,
      },
    };
  }

  /**
   * 获取搜索相关推荐内容
   * @param {Object} ctx 上下文对象
   * @param {String} searchkey 搜索关键词
   * @return {Promise<Array>} 相关推荐内容
   * @private
   */
  async _getRelatedContentForSearch(ctx, searchkey) {
    try {
      // 🔥 策略1：尝试分词搜索（如果搜索词包含空格）
      if (searchkey.includes(' ')) {
        const keywords = searchkey.split(' ').filter(word => word.length > 1);
        for (const keyword of keywords) {
          const result = await ctx.service.content.find(
            { pageSize: 5, searchkey: keyword }, // 🔥 修复：正确传递搜索关键词
            {
              filters: {
                state: { $eq: '2' },
                draft: { $eq: '0' },
              },
              searchKeys: ['title', 'stitle', 'discription'],
              fields: ['id', 'title', 'stitle', 'sImg', 'createdAt', 'clickNum'],
            }
          );

          if (result.docs && result.docs.length > 0) {
            return result.docs;
          }
        }
      }

      // 🔥 策略2：获取热门内容作为推荐
      const hotContents = await ctx.service.content.find(
        { pageSize: 5 },
        {
          filters: {
            state: { $eq: '2' },
            draft: { $eq: '0' },
            isTop: { $eq: 1 }, // 推荐内容
          },
          sort: [
            { field: 'clickNum', order: 'desc' }, // 按点击量排序
            { field: 'createdAt', order: 'desc' },
          ],
          fields: ['id', 'title', 'stitle', 'sImg', 'createdAt', 'clickNum'],
        }
      );

      return hotContents.docs || [];
    } catch (error) {
      ctx.logger.warn('获取搜索相关推荐失败:', error.message);
      return [];
    }
  }

  /**
   * 缓存获取标签信息
   * @param {Object} ctx 上下文对象
   * @param {String} tagName 标签名称
   * @return {Promise<Object|null>} 标签信息
   * @private
   */
  async _getTagByNameWithCache(ctx, tagName) {
    const cacheKey = `tag:${tagName}`;

    return await ctx.app.cache.getOrSet(
      cacheKey,
      async () => {
        return await ctx.service.contentTag.findOne({
          name: { $eq: tagName },
        });
      },
      3600 // 1小时缓存
    );
  }

  /**
   * 获取错误页面数据
   * @param {Object} ctx 上下文对象
   * @return {Promise<Object>} 页面数据
   * @private
   */
  async _getErrorPageData(ctx) {
    return {
      pageType: 'error',
      // member: ctx.session.user,
      // logined: !!ctx.session.user,
      errorCode: ctx.status || 404,
      errorMessage: ctx.message || 'Page Not Found',
    };
  }

  /**
   * 处理页面渲染错误
   * @param {Object} ctx 上下文对象
   * @param {Error} error 错误对象
   * @return {Promise<void>}
   * @private
   */
  async _handlePageError(ctx, error) {
    try {
      // 使用增强的模板系统渲染错误页面（支持动态布局）
      const html = await ctx.service.templateResolver.render(null, 'error', null, {
        pageType: 'error',
        // member: ctx.session.user,
        // logined: !!ctx.session.user,
        errorCode: 500,
        errorMessage: 'Internal Server Error',
      });

      ctx.status = 500;
      ctx.body = html;
    } catch (fallbackError) {
      ctx.logger.error('Fallback error page render failed:', fallbackError);
      // 最终回退方案
      ctx.status = 500;
      ctx.body = '<html><body><h1>500 Internal Server Error</h1></body></html>';
    }
  }
}

module.exports = HomeController;
