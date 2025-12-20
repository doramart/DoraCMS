'use strict';

const BaseTag = require('./base');
const utils = require('./utils');
const _ = require('lodash');
const nunjucks = require('nunjucks');

/**
 * Base class for block helpers
 */
class BlockTag extends BaseTag {
  constructor(ctx, tagName) {
    super(ctx, tagName);
  }

  // Override parse to handle block content
  parse(parser, nodes, lexer) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);

    // Parse the block content
    const body = parser.parseUntilBlocks('end' + this.tagName);
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }
}

/**
 * Foreach helper - Loop through arrays with advanced options
 * Usage:
 * {% foreach posts limit="5" %}
 *   {{this.title}}
 *   {% if @first %}(first){% endif %}
 *   {% if @last %}(last){% endif %}
 * {% endforeach %}
 */
class ForeachTag extends BlockTag {
  constructor(ctx) {
    super(ctx, 'foreach');
  }

  async run(...allArgs) {
    try {
      // this.ctx.logger.info('[foreach] All arguments:', allArgs.length);
      // this.ctx.logger.info(
      //   '[foreach] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );
      // this.ctx.logger.info(
      //   '[foreach] Arguments details:',
      //   allArgs.map((arg, i) => {
      //     if (typeof arg === 'object' && arg !== null) {
      //       return `${i}: ${Array.isArray(arg) ? `array[${arg.length}]` : 'object'}`;
      //     }
      //     return `${i}: ${typeof arg}`;
      //   })
      // );

      // 根据实际参数结构映射
      let context, items, options, body, callback;

      if (allArgs.length === 5) {
        // 5个参数: context, items, options, body, callback
        [context, items, options, body, callback] = allArgs;
      } else if (allArgs.length === 4) {
        // 4个参数: context, args, body, callback
        [context, , body, callback] = allArgs;
        items = allArgs[1][0] || [];
        options = allArgs[1][1] || {};
      } else {
        this.ctx.logger.error('[foreach] Unexpected argument count:', allArgs.length);
        return '';
      }

      this.ctx.logger.info('[foreach] Parsed - items:', Array.isArray(items) ? items.length : typeof items);
      this.ctx.logger.info('[foreach] Parsed - options:', typeof options);

      // 验证 callback 是否为函数
      if (typeof callback !== 'function') {
        this.ctx.logger.error('[foreach] Callback is not a function, got:', typeof callback);
        return '';
      }

      // Skip if items is not an array or is empty
      if (!Array.isArray(items) || items.length === 0) {
        this.ctx.logger.info('[foreach] No items to process');
        return callback(null, '');
      }

      // Limit the number of items to process
      const limit = options.limit ? parseInt(options.limit, 10) : items.length;
      const offset = options.offset ? parseInt(options.offset, 10) : 0;
      const subset = items.slice(offset, offset + limit);

      this.ctx.logger.info('[foreach] Processing', subset.length, 'items');

      let result = '';

      // 保存原始上下文
      const originalLoop = context.ctx.loop;
      const originalKeys = new Set(Object.keys(context.ctx));

      // Process each item
      for (let i = 0; i < subset.length; i++) {
        this.ctx.logger.info('[foreach] Processing item', i);

        // 设置循环变量 - 修复变量名称问题
        context.ctx.loop = {
          index: i,
          first: i === 0,
          last: i === subset.length - 1,
          key: i,
        };

        // 设置当前项的数据直接到 context.ctx
        const currentItem = subset[i];
        const addedKeys = [];

        for (const key in currentItem) {
          if (currentItem.hasOwnProperty(key)) {
            if (!originalKeys.has(key)) {
              addedKeys.push(key);
            }
            context.ctx[key] = currentItem[key];
          }
        }

        try {
          const bodyResult = await body();
          result += bodyResult || '';
          this.ctx.logger.info('[foreach] Item', i, 'processed successfully');
        } catch (bodyError) {
          this.ctx.logger.error('[foreach] Error processing item', i, ':', bodyError);
          // 继续处理下一个项目，不要中断整个循环
        }

        // 清理本轮循环添加的变量
        addedKeys.forEach(key => {
          delete context.ctx[key];
        });
      }

      // 恢复原始上下文
      context.ctx.loop = originalLoop;

      this.ctx.logger.info('[foreach] Completed successfully');
      // 标记 HTML 内容为安全，避免被转义
      return callback(null, new nunjucks.runtime.SafeString(result));
    } catch (error) {
      this.ctx.logger.error('[foreach] Error:', error);
      return callback(null, '');
    }
  }
}

/**
 * Get helper - Fetch dynamic content
 * Usage:
 * {% get "posts" limit="5" include="authors,tags" filter="tag:featured" %}
 *   {{#foreach posts}}
 *     {{title}}
 *   {{/foreach}}
 * {% endget %}
 */
class GetTag extends BlockTag {
  constructor(ctx) {
    super(ctx, 'get');
  }

  async run(...allArgs) {
    try {
      // this.ctx.logger.info('[get] All arguments:', allArgs.length);
      // this.ctx.logger.info(
      //   '[get] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );

      // 根据参数数量动态处理
      let context, resourceType, options, body, callback;

      if (allArgs.length === 5) {
        // 5个参数: context, resourceType, options, body, callback
        [context, resourceType, options, body, callback] = allArgs;
      } else if (allArgs.length === 4) {
        // 4个参数: context, args, body, callback
        [context, , body, callback] = allArgs;
        resourceType = allArgs[1][0];
        options = allArgs[1][1] || {};
      } else {
        this.ctx.logger.error('[get] Unexpected argument count:', allArgs.length);
        return '';
      }

      // 验证 callback 是否为函数
      if (typeof callback !== 'function') {
        this.ctx.logger.error('[get] Callback is not a function, got:', typeof callback);
        return '';
      }

      // Default options
      const limit = options.limit || 5;
      const api = this._getApiByResourceType(resourceType);

      // Convert options to query
      const query = {
        isPaging: '0',
        pageSize: limit,
      };

      // Add filters if specified
      if (options.filter) {
        // Parse filter string and convert to query params
        const filters = options.filter.split(',');
        filters.forEach(filter => {
          const [key, value] = filter.split(':');
          if (key && value) {
            query[key.trim()] = value.trim();
          }
        });
      }

      if (options.typeId) {
        query.typeId = options.typeId;
      }

      // Fetch data from API
      const data = await this.ctx.helper.reqJsonData(api, query);

      // Add result to context
      context.ctx[resourceType] = data;

      const result = await body();

      // 标记 HTML 内容为安全，避免被转义
      return callback(null, result ? new nunjucks.runtime.SafeString(result) : '');
    } catch (error) {
      this.ctx.logger.error('[get] Error:', error);
      return callback(null, '');
    }
  }

  _getApiByResourceType(type) {
    const apiMap = {
      posts: 'content/getList',
      tags: 'contentTag/getList',
      categories: 'contentCategory/getList',
      hottags: 'contentTag/getHotList',
      featured: 'content/getList', // With model=1
    };

    return apiMap[type] || 'content/getList';
  }
}

/**
 * If helper - Conditional block rendering
 * Usage:
 * {% if post.featured %}
 *   Featured post!
 * {% else %}
 *   Regular post
 * {% endif %}
 */
class IfTag extends BlockTag {
  constructor(ctx) {
    super(ctx, 'if');
  }

  parse(parser, nodes, lexer) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);

    // Parse the main body
    const body = parser.parseUntilBlocks('else', 'endif');

    let bodyElse = null;
    if (parser.skipSymbol('else')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      bodyElse = parser.parseUntilBlocks('endif');
    }

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body, bodyElse]);
  }

  async run(...allArgs) {
    try {
      // this.ctx.logger.info('[if] All arguments:', allArgs.length);
      // this.ctx.logger.info(
      //   '[if] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );

      // 根据参数数量动态处理
      let context, condition, bodies, callback;

      if (allArgs.length === 4) {
        // 4个参数: context, condition, bodies, callback
        [context, condition, bodies, callback] = allArgs;
      } else {
        this.ctx.logger.error('[if] Unexpected argument count:', allArgs.length);
        return '';
      }

      // 验证 callback 是否为函数
      if (typeof callback !== 'function') {
        this.ctx.logger.error('[if] Callback is not a function, got:', typeof callback);
        return '';
      }

      const body = bodies[0];
      const bodyElse = bodies[1];

      if (condition) {
        const result = await body();
        return callback(null, result ? new nunjucks.runtime.SafeString(result) : '');
      } else if (bodyElse) {
        const elseResult = await bodyElse();
        return callback(null, elseResult ? new nunjucks.runtime.SafeString(elseResult) : '');
      }

      return callback(null, '');
    } catch (error) {
      this.ctx.logger.error('[if] Error:', error);
      return callback(null, '');
    }
  }
}

/**
 * Has helper - Check if a property exists and is not empty
 * Usage:
 * {% has tag="featured" %}
 *   This post has the 'featured' tag
 * {% endhas %}
 */
class HasTag extends BlockTag {
  constructor(ctx) {
    super(ctx, 'has');
  }

  async run(...allArgs) {
    try {
      // this.ctx.logger.info('[has] All arguments:', allArgs.length);
      // this.ctx.logger.info(
      //   '[has] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );

      // 根据参数数量动态处理
      let context, options, body, callback;

      if (allArgs.length === 4) {
        // 4个参数: context, options, body, callback
        [context, options, body, callback] = allArgs;
      } else if (allArgs.length === 3) {
        // 3个参数: context, args, callback (无body的情况)
        [context, options, callback] = allArgs;
        body = null;
      } else {
        this.ctx.logger.error('[has] Unexpected argument count:', allArgs.length);
        return '';
      }

      // 验证 callback 是否为函数
      if (typeof callback !== 'function') {
        this.ctx.logger.error('[has] Callback is not a function, got:', typeof callback);
        return '';
      }

      options = options || {};
      let hasCondition = false;

      // Check tag property
      if (options.tag && context.ctx.post) {
        const tagNames = (context.ctx.post.tags || []).map(tag => tag.name);
        hasCondition = tagNames.includes(options.tag);
      }

      // Check author property
      else if (options.author && context.ctx.post) {
        const authorNames = (context.ctx.post.authors || []).map(author => author.name);
        hasCondition = authorNames.includes(options.author);
      }

      // Check if a property exists and is not empty
      else if (options.property) {
        const props = options.property.split('.');
        let value = context.ctx;

        for (const prop of props) {
          if (value === undefined || value === null) {
            value = undefined;
            break;
          }
          value = value[prop];
        }

        hasCondition = value !== undefined && value !== null && value !== '';
      }

      if (hasCondition) {
        const result = await body();
        return callback(null, result ? new nunjucks.runtime.SafeString(result) : '');
      }

      return callback(null, '');
    } catch (error) {
      this.ctx.logger.error('[has] Error:', error);
      return callback(null, '');
    }
  }
}

/**
 * Is helper - Check the current context
 * Usage:
 * {% is "home" %}
 *   This is the home page
 * {% else %}
 *   This is not the home page
 * {% endis %}
 */
class IsTag extends BlockTag {
  constructor(ctx) {
    super(ctx, 'is');
  }

  parse(parser, nodes, lexer) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);

    // Parse the main body
    const body = parser.parseUntilBlocks('else', 'endis');

    let bodyElse = null;
    if (parser.skipSymbol('else')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      bodyElse = parser.parseUntilBlocks('endis');
    }

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body, bodyElse]);
  }

  async run(...allArgs) {
    try {
      // this.ctx.logger.info('[is] All arguments:', allArgs.length);
      // this.ctx.logger.info(
      //   '[is] Arguments types:',
      //   allArgs.map((arg, i) => `${i}: ${typeof arg}`)
      // );
      this.ctx.logger.info('[is] Arg 1 content:', allArgs[1]);

      // 根据参数数量动态处理
      let context, contextType, bodies, callback;

      if (allArgs.length === 5) {
        // 5个参数: context, args, body1, body2, callback
        // args[0] 是 contextType
        context = allArgs[0];
        contextType = allArgs[1]; // 这应该是 args 数组，需要取第一个元素
        bodies = [allArgs[2], allArgs[3]]; // body 和 bodyElse
        callback = allArgs[4];

        // 如果 contextType 是数组，取第一个元素
        if (Array.isArray(contextType)) {
          contextType = contextType[0];
        }
      } else if (allArgs.length === 4) {
        // 4个参数: context, contextType, bodies, callback
        [context, contextType, bodies, callback] = allArgs;
      } else {
        this.ctx.logger.error('[is] Unexpected argument count:', allArgs.length);
        return '';
      }

      // 验证 callback 是否为函数
      if (typeof callback !== 'function') {
        this.ctx.logger.error('[is] Callback is not a function, got:', typeof callback);
        return '';
      }

      const body = bodies[0];
      const bodyElse = bodies[1];

      // Get the current context type from the request URL or other indicators
      const currentContext = this._determineContext(context);

      if (contextType === currentContext) {
        const result = await body();
        return callback(null, result ? new nunjucks.runtime.SafeString(result) : '');
      } else if (bodyElse) {
        const elseResult = await bodyElse();
        return callback(null, elseResult ? new nunjucks.runtime.SafeString(elseResult) : '');
      }

      return callback(null, '');
    } catch (error) {
      this.ctx.logger.error('[is] Error:', error);
      return callback(null, '');
    }
  }

  _determineContext(context) {
    const url = context.ctx.request.url;

    // Determine context based on URL patterns
    if (url === '/' || url === '/index.html') {
      return 'home';
    } else if (url.includes('/details/')) {
      return 'post';
    } else if (url.includes('/tag/')) {
      return 'tag';
    } else if (url.includes('/author/')) {
      return 'author';
    } else if (url.includes('/page/')) {
      return 'page';
    }

    return 'unknown';
  }
}

module.exports = {
  ForeachTag,
  GetTag,
  IfTag,
  HasTag,
  IsTag,
};
