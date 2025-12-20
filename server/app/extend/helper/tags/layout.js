'use strict';

const BaseTag = require('./base');
const _ = require('lodash');

/**
 * Base class for layout helpers
 */
class LayoutTag extends BaseTag {
  constructor(ctx, tagName) {
    super(ctx, tagName);
  }

  // Default _execute implementation that calls _process if it exists
  async _execute(context, args) {
    // If this class has a _process method, call it
    if (typeof this._process === 'function') {
      return this._process(context, args);
    }
    return '';
  }

  // Use BaseTag's async parse method, but override run for sync tags that have _process
  run(context, args, callback) {
    // Handle both sync (_process) and async (_execute) methods
    if (typeof this._process === 'function') {
      // Sync method - for simple tags like bodyclass
      try {
        const result = this._process(context, args || {});
        return callback(null, result);
      } catch (error) {
        return callback(null, `<!-- Error in ${this.tagName}: ${error.message} -->`);
      }
    } else {
      // Async method - use the default BaseTag behavior
      return super.run(context, args, callback);
    }
  }

  // _process(context, ...args) {
  //   throw new Error('_process method must be implemented by subclass');
  // }
}

/**
 * Body Class helper - Output body classes based on current page
 * Usage: <body class="{% bodyclass %}">
 */
class BodyClassTag extends LayoutTag {
  constructor(ctx) {
    super(ctx, 'bodyclass');
  }

  // 使用同步parse方法
  parse(parser, nodes) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);
    return new nodes.CallExtension(this, 'syncRun', args);
  }

  // 同步run方法
  syncRun(context, ...args) {
    return this._process(context, args.length > 0 ? args[0] : {});
  }

  _process(context, options = {}) {
    const classes = [];
    const url = context?.ctx?.request?.url || '/';

    // Add page-specific class
    if (url === '/' || url === '/index.html') {
      classes.push('home-template');
    } else if (url.includes('/details/')) {
      classes.push('post-template');
    } else if (url.includes('/tag/')) {
      classes.push('tag-template');
      const tagSlug = this._extractSlug(url, '/tag/');
      if (tagSlug) {
        classes.push(`tag-${tagSlug}`);
      }
    } else if (url.includes('/page/')) {
      classes.push('page-template');
    } else if (url.includes('/author/')) {
      classes.push('author-template');
      const authorSlug = this._extractSlug(url, '/author/');
      if (authorSlug) {
        classes.push(`author-${authorSlug}`);
      }
    }

    // Add custom classes from options
    if (options.class) {
      classes.push(options.class);
    }

    return classes.join(' ');
  }

  _extractSlug(url, prefix) {
    const regex = new RegExp(`${prefix}([^/]+)`);
    const match = url.match(regex);
    return match ? match[1] : '';
  }
}

/**
 * Post Class helper - Output post specific classes
 * Usage: <article class="{% postclass %}">
 */
class PostClassTag extends LayoutTag {
  constructor(ctx) {
    super(ctx, 'postclass');
  }

  // 使用同步parse方法，与 BodyClassTag 保持一致
  parse(parser, nodes) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);
    return new nodes.CallExtension(this, 'syncRun', args);
  }

  // 同步run方法
  syncRun(context, ...args) {
    return this._process(context, args.length > 0 ? args[0] : {});
  }

  _process(context, options = {}) {
    const classes = ['post'];
    const post = context?.ctx?.post;

    if (post) {
      // Add featured class if post is featured
      if (post.featured) {
        classes.push('featured');
      }

      // Add tag-based classes
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag.slug) {
            classes.push(`tag-${tag.slug}`);
          }
        });
      }
    }

    // Add custom classes from options
    if (options.class) {
      classes.push(options.class);
    }

    return classes.join(' ');
  }
}

/**
 * Navigation helper - Generate navigation HTML
 * Usage: {% navigation %}
 */
class NavigationTag extends LayoutTag {
  constructor(ctx) {
    super(ctx, 'navigation');
  }

  async _execute(context, args) {
    try {
      const utils = require('./utils');

      // 🚀 重构：使用统一的 fetchContent 方法，与 navtree 保持一致
      const navigationData = await utils.fetchContent(this.ctx, context, args, 'navtree');

      // 如果需要只获取顶层分类，在这里过滤
      let filteredData = navigationData;
      if (args.topLevel !== false && Array.isArray(navigationData)) {
        filteredData = navigationData.filter(item =>
          this.ctx.service.contentCategory.repository.isTopLevelParentId(item.parentId)
        );
      }

      // 更新context中的数据为过滤后的结果
      const key = args.key || 'navigation';
      if (context?.ctx) {
        context.ctx[key] = filteredData;
      }

      // Generate HTML for navigation if requested
      if (args.output === 'html') {
        const url = context?.ctx?.request?.url || '/';
        const html = this._renderNavigationHtml(filteredData, url, args);
        return html;
      }

      return '';
    } catch (error) {
      this.ctx.logger.error('[navigation] Error:', error);
      return '';
    }
  }

  _renderNavigationHtml(items, currentUrl, args = {}) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      this.ctx.logger.warn('[navigation] No items to render');
      return '';
    }

    // Handle custom classes
    const containerClass = args.containerClass || 'nav';
    const itemClass = args.itemClass || '';
    const linkClass = args.linkClass || '';
    const activeClass = args.activeClass || 'nav-current';

    let html = `<ul class="${containerClass}">`;

    items.forEach(item => {
      // Use defaultUrl or homePage for the link
      const itemUrl = item.defaultUrl || item.homePage;
      const isCurrent = currentUrl === `/${itemUrl}`;
      const itemClasses = itemClass ? `${itemClass} ${isCurrent ? activeClass : ''}` : isCurrent ? activeClass : '';

      html += `<li class="${itemClasses}">`;
      html += `<a class="${linkClass}" href="/${itemUrl}">${item.name}</a>`;
      html += '</li>';
    });

    html += '</ul>';
    return html;
  }
}

/**
 * Pagination helper - Generate pagination HTML
 * Usage: {% pagination %}
 */
class PaginationTag extends LayoutTag {
  constructor(ctx) {
    super(ctx, 'pagination');
  }

  async _execute(context, args) {
    const pageInfo = context?.ctx?.pageInfo;
    const pageType = context?.ctx?.pageType || 'index';
    const cateInfo = context?.ctx?.cateInfo;
    const targetTagName = context?.ctx?.targetTagName;

    if (!pageInfo || pageInfo.totalItems <= 0) {
      return '';
    }

    const html = this._renderPaginationHtml(pageInfo, pageType, cateInfo, targetTagName, args);
    return html;
  }

  _renderPaginationHtml(pageInfo, pageType, cateInfo, targetTagName, args = {}) {
    let localUrl = '';
    let param = '';

    // Handle custom classes
    const containerClass = args.containerClass || 'flex items-center justify-center space-x-2 my-8';
    const linkClass =
      args.linkClass ||
      'flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors';
    const activeClass = args.activeClass || 'px-2 text-white bg-primary rounded-sm';
    const ellipsisClass =
      args.ellipsisClass ||
      'flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors';

    // Determine the base URL based on page type
    switch (pageType) {
      case 'index':
        localUrl = '/page';
        break;
      case 'cate':
        localUrl = cateInfo?.url || '';
        break;
      case 'search':
        param = `?searchKey=${pageInfo.searchkey}`;
        localUrl = `/search/${pageInfo.searchkey}`;
        break;
      case 'tag':
        param = `?tagKey=${targetTagName}`;
        localUrl = `/tag/${targetTagName}`;
        break;
    }

    const { current, totalPage } = pageInfo;

    // Calculate page range
    let pageStart = Math.max(1, current - 2);
    const pageEnd = Math.min(totalPage, pageStart + 4);
    if (pageEnd - pageStart < 4) {
      pageStart = Math.max(1, pageEnd - 4);
    }

    let html = `<div class="${containerClass}">`;

    // First page link
    if (current !== 1) {
      html += `<a class="${linkClass}" href="${localUrl}/1.html${param}">«</a>`;
    }

    // Ellipsis for start
    if (pageStart > 1) {
      html += `<a class="${ellipsisClass}">...</a>`;
    }

    // Page numbers
    for (let i = pageStart; i <= pageEnd; i++) {
      if (i === current) {
        html += `<b class="${activeClass}">${i}</b>`;
      } else {
        html += `<a class="${linkClass}" href="${localUrl}/${i}.html${param}">${i}</a>`;
      }
    }

    // Ellipsis for end
    if (pageEnd < totalPage) {
      html += `<a class="${ellipsisClass}">...</a>`;
    }

    // Last page link
    if (current !== totalPage) {
      html += `<a class="${linkClass}" href="${localUrl}/${totalPage}.html${param}">»</a>`;
    }

    html += '</div>';
    return html;
  }
}

/**
 * Search helper - Generate search form
 * Usage: {% search placeholder="搜索关键词" %} or {% search placeholder="" %} for default
 * Note: At least one parameter is required due to the tag system architecture
 */
class SearchTag extends LayoutTag {
  constructor(ctx) {
    super(ctx, 'search');
  }

  async _execute(context, args) {
    try {
      // Handle arguments
      const placeholderText =
        args && typeof args.placeholder === 'string'
          ? args.placeholder || this.ctx.__('search.inputKeyword')
          : this.ctx.__('search.inputKeyword');
      const formClass = args && typeof args.formClass === 'string' ? args.formClass : 'search-form';
      const inputClass = args && typeof args.inputClass === 'string' ? args.inputClass : 'search-field';
      const buttonClass = args && typeof args.buttonClass === 'string' ? args.buttonClass : 'search-button';

      let html = `<form class="${formClass}" action="/search" method="get" id="searchForm">`;
      html += `<input class="${inputClass}" type="text" name="searchKey" placeholder="${placeholderText}" id="searchInput"/>`;
      html += `<button class="${buttonClass}" type="submit" id="searchButton">${this.ctx.__('search.label')}</button>`;
      html += '</form>';

      return html;
    } catch (error) {
      this.ctx.logger.error('[search] Error:', error);
      return '';
    }
  }
}

module.exports = {
  BodyClassTag,
  PostClassTag,
  NavigationTag,
  PaginationTag,
  SearchTag,
};
