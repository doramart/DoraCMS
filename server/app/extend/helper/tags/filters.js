'use strict';

const BaseTag = require('./base');
const _ = require('lodash');
const moment = require('moment');

/**
 * Base class for filter tags that output transformed data
 * 统一使用异步模式以保持一致性
 */
class FilterTag extends BaseTag {
  constructor(ctx, tagName) {
    super(ctx, tagName);
  }

  // 统一使用异步模式
  async _execute(context, args) {
    // 将参数解构，第一个参数通常是要处理的值
    const [value, ...options] = args || [];
    const opts = options[0] || {};

    // 调用同步处理方法，保持向后兼容
    return this._process(context, value, opts);
  }

  // Process method to be implemented by subclasses
  _process(context, value, options = {}) {
    throw new Error('_process method must be implemented by subclass');
  }
}

/**
 * Date filter - Format dates
 * Usage: {% date published_at format="YYYY-MM-DD" %}
 * Usage: {% date published_at timeago=true %}
 */
class DateFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'date');
  }

  _process(context, date, options = {}) {
    if (!date) return '';

    // Default format
    const format = options.format || 'YYYY-MM-DD';

    // Handle special "now" case
    let momentDate;
    if (date === 'now') {
      momentDate = moment();
    } else {
      momentDate = moment(date);
    }

    // Handle timeago format
    if (options.timeago) {
      return momentDate.fromNow();
    }

    return momentDate.format(format);
  }
}

/**
 * Excerpt filter - Get a summary of text
 * Usage: {% excerpt content words="30" %}
 */
class ExcerptFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'excerpt');
  }

  _process(context, content, options = {}) {
    if (!content) return '';

    // Strip HTML
    const text = content.replace(/<[^>]+>/g, '');
    const r = /[^\x00-\xff]/g;
    let m;
    // Limit by words
    if (options.words) {
      if (text.replace(r, '**').length > options.words) {
        m = Math.floor(options.words / 2);
        for (let i = m, l = text.length; i < l; i++) {
          if (text.substr(0, i).replace(r, '**').length >= options.words) {
            return text.substr(0, i) + '...';
          }
        }
      }
    }
    return text;
  }
}

/**
 * Image URL filter - Generate image URLs with size options
 * Usage: {% imgurl post.feature_image size="medium" %}
 * Usage: {% imgurl post.feature_image fallback="/default.jpg" %}
 */
class ImgUrlFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'imgurl');
  }

  _process(context, url, options = {}) {
    if (!url && options.fallback) {
      return options.fallback;
    }

    if (!url) return '';

    // Handle size parameter
    if (options.size) {
      // Assuming your image processing system can handle size parameters
      // This might need to be adapted to your actual image handling logic
      return `${url}?size=${options.size}`;
    }

    return url;
  }
}

/**
 * Reading Time filter - Calculate estimated reading time
 * Usage: {% readingtime post.content %}
 */
class ReadingTimeFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'readingtime');
  }

  _process(context, content, options = {}) {
    if (!content) return '0 min read';

    // Strip HTML
    const text = content.replace(/<\/?[^>]+(>|$)/g, '');

    // Average reading speed: 200 words per minute
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);

    if (minutes <= 0) return '1 min read';

    return `${minutes} min read`;
  }
}

/**
 * Encode filter - URL encode a string
 * Usage: {% encode post.title %}
 */
class EncodeFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'encode');
  }

  _process(context, text) {
    if (!text) return '';
    return encodeURIComponent(text);
  }
}

/**
 * StripHtml filter - Remove HTML tags from text
 * Usage: {% striphtml content %}
 */
class StripHtmlFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'striphtml');
  }

  _process(context, content, options = {}) {
    if (!content) return '';

    let text = String(content);

    // Decode HTML entities first (before removing tags)
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`')
      .replace(/&#x3D;/g, '=');

    // Remove all HTML tags (including attributes)
    text = text.replace(/<[^>]*>/g, '');

    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }
}

/**
 * Plural filter - Output different text based on count
 * Usage: {% plural count.posts empty="No posts" singular="% post" plural="% posts" %}
 */
class PluralFilter extends FilterTag {
  constructor(ctx) {
    super(ctx, 'plural');
  }

  // 处理参数：context, count, options, callback
  async run(...allArgs) {
    // 处理参数
    let context, args, callback;

    if (allArgs.length === 3) {
      [context, args, callback] = allArgs;
    } else if (allArgs.length === 4) {
      const [ctx, count, options, cb] = allArgs;
      context = ctx;
      args = { count, options };
      callback = cb;
    } else {
      // this.ctx.logger.error('[plural] Unexpected number of arguments:', allArgs.length);
      // this.ctx.logger.error(
      //   '[plural] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );
      return '';
    }

    // 验证 callback 是否为函数
    if (typeof callback !== 'function') {
      this.ctx.logger.error('[plural] Callback is not a function, got:', typeof callback);
      return '';
    }

    try {
      const result = this._process(context, args);
      return callback(null, result);
    } catch (error) {
      const errorMsg = `<!-- Error in ${this.tagName}: ${error.message} -->`;
      return callback(null, errorMsg);
    }
  }

  _process(context, args) {
    // 解析参数
    let count,
      options = {};

    if (typeof args === 'object' && args.count !== undefined) {
      count = args.count;
      options = args.options || {};
    } else if (Array.isArray(args)) {
      [count, ...optionArgs] = args;
      options = optionArgs[0] || {};
    } else {
      count = args;
    }

    // 确保 count 是数字
    const numCount = typeof count === 'number' ? count : parseInt(count) || 0;

    if (numCount === 0 && options.empty) {
      return options.empty;
    }

    if (numCount === 1 && options.singular) {
      return options.singular.replace('%', numCount);
    }

    if (options.plural) {
      return options.plural.replace('%', numCount);
    }

    return numCount.toString();
  }
}

module.exports = {
  DateFilter,
  ExcerptFilter,
  ImgUrlFilter,
  ReadingTimeFilter,
  EncodeFilter,
  StripHtmlFilter,
  PluralFilter,
};
