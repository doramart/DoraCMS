'use strict';

const BaseTag = require('./base');
const utils = require('./utils');
const { contextManager } = require('./context');
const nunjucks = require('nunjucks');
const path = require('path');
/**
 * Remote tag - Fetch data from any API
 * Usage: {% remote key="customData" api="content/getList" query='{"sortby":"1"}' pageSize="10" %}
 */
class Remote extends BaseTag {
  constructor(ctx) {
    super(ctx, 'remote');
  }

  async _execute(context, args) {
    return utils.fetchCustomData(this.ctx, context, args);
  }
}

/**
 * Ads tag - Get advertising content
 * Usage: {% ads key="bannerAds" name="homepage-banner" %}
 */
class Ads extends BaseTag {
  constructor(ctx) {
    super(ctx, 'ads');
  }

  async _execute(context, args) {
    return utils.fetchContent(this.ctx, context, args, 'ads');
  }
}

/**
 * Asset tag - Generate URL for theme assets
 * Usage: {% assets "css/style.css main.js" %}
 */
class Assets extends BaseTag {
  constructor(ctx) {
    super(ctx, 'assets');
  }

  async _execute(context, args) {
    const assetsSource = args || '';
    const assetsKeyArr = typeof assetsSource === 'string' ? assetsSource.split(' ') : [];

    let assetsStr = '';
    const { staticRootPath, staticThemePath: assetsPath } = contextManager._config || {};
    const version = process.env.NODE_ENV === 'production' ? contextManager._site.version : new Date().getTime();

    for (const item of assetsKeyArr) {
      if (!item || typeof item !== 'string') continue;

      const fileExtension = this._getFileExtension(item);
      if (!this._isValidAssetType(fileExtension)) {
        this.ctx.logger.warn(`[assets] Unsupported file type: ${fileExtension} for ${item}`);
        continue;
      }

      const targetPath = this._buildAssetPath(item, staticRootPath, assetsPath, fileExtension);
      assetsStr += this._generateAssetTag(targetPath, fileExtension, version);
    }

    return assetsStr;
  }

  /**
   * 获取文件扩展名
   * @param filename
   */
  _getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * 验证是否为有效的资源类型
   * @param extension
   */
  _isValidAssetType(extension) {
    return ['js', 'css'].includes(extension);
  }

  /**
   * 构建资源路径 - 使用path模块确保安全
   * @param item
   * @param staticRootPath
   * @param assetsPath
   * @param fileExtension
   */
  _buildAssetPath(item, staticRootPath, assetsPath, fileExtension) {
    try {
      // 验证输入参数
      if (!item || typeof item !== 'string') {
        throw new Error('Invalid asset item');
      }

      // 清理和规范化路径
      const cleanItem = this._sanitizePath(item);

      // 检查是否为绝对路径或包含路径分隔符
      if (path.isAbsolute(cleanItem) || cleanItem.includes('/')) {
        // 使用绝对路径模式
        const basePath = staticRootPath || '/public';
        return this._joinPaths(basePath, cleanItem);
      }
      // 使用主题相对路径模式
      const themePath = assetsPath || '/public/themes/default';
      return this._joinPaths(themePath, fileExtension, cleanItem);
    } catch (error) {
      this.ctx.logger.warn(`[assets] Error building asset path for "${item}":`, error.message);
      return '';
    }
  }

  /**
   * 清理和验证路径
   * @param pathStr
   */
  _sanitizePath(pathStr) {
    if (typeof pathStr !== 'string') {
      throw new Error('Path must be a string');
    }

    // 移除危险字符
    const cleaned = pathStr
      .replace(/\.\./g, '') // 移除 ..
      .replace(/[<>"|?*]/g, '') // 移除危险字符
      .trim();

    if (!cleaned) {
      throw new Error('Path is empty after sanitization');
    }

    return cleaned;
  }

  /**
   * 安全地连接路径
   * @param {...any} segments
   */
  _joinPaths(...segments) {
    // 过滤空值并规范化
    const validSegments = segments
      .filter(segment => segment && typeof segment === 'string')
      .map(segment => segment.replace(/^\/+|\/+$/g, '')); // 移除首尾斜杠

    if (validSegments.length === 0) {
      return '/';
    }

    // 使用 posix 路径以确保 web 兼容性
    const joinedPath = '/' + validSegments.join('/');

    // 规范化路径，移除重复的斜杠
    return joinedPath.replace(/\/+/g, '/');
  }

  /**
   * 生成资源标签
   * @param path
   * @param fileExtension
   * @param version
   */
  _generateAssetTag(path, fileExtension, version) {
    const versionedPath = `${path}?version=${version}`;

    if (fileExtension === 'js') {
      return `<script src="${versionedPath}"></script>\n`;
    } else if (fileExtension === 'css') {
      return `<link href="${versionedPath}" rel="stylesheet">\n`;
    }

    return '';
  }
}

/**
 * Head tag - Generate HTML head content with SEO meta tags
 * Usage: {% head %}...{% endhead %}
 */
class Head extends BaseTag {
  constructor(ctx) {
    super(ctx, 'head');
  }

  parse(parser, nodes) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // Parse the body content
    const body = parser.parseUntilBlocks('endhead');
    parser.advanceAfterBlockEnd();

    // 使用异步模式，注意参数顺序：context, args, callback, bodies
    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  async run(...allArgs) {
    // 动态处理参数，支持不同的调用方式
    let context, args, body, callback;

    if (allArgs.length === 3) {
      // 标准模式: context, args, callback
      [context, args, callback] = allArgs;
      body = null;
    } else if (allArgs.length === 4) {
      // 区块模式: context, args, body, callback
      [context, args, body, callback] = allArgs;
    } else {
      this.ctx.logger.error('[head] Unexpected number of arguments:', allArgs.length);
      return '';
    }

    // 验证 callback 是否为函数
    if (typeof callback !== 'function') {
      this.ctx.logger.error('[head] Callback is not a function, got:', typeof callback);
      return '';
    }

    try {
      // 如果 body 是数组，取第一个元素
      const bodyCallback = Array.isArray(body) ? body[0] : body;
      const result = await this._execute(context, args, bodyCallback);
      return callback(null, result);
    } catch (error) {
      const errorOutput = this._handleError(error, context, args);
      return callback(null, errorOutput);
    }
  }

  async _execute(context, args, bodyCallback) {
    const _ctx = context.ctx;
    const contextSite = _ctx.siteDynamic || {};
    const siteConfig = Object.assign({}, contextManager._site, contextSite) || {};

    const { title = 'DoraCMS', description = '', keywords = '', statisticalCode = '', ogData = {} } = siteConfig;

    // 正确调用 body 函数获取内容
    let rawCode = '';
    if (bodyCallback && typeof bodyCallback === 'function') {
      try {
        rawCode = await bodyCallback();
      } catch (error) {
        this.ctx.logger.warn('[head] Error executing body callback:', error);
        rawCode = '';
      }
    }
    const metaArr = [];

    // 基础meta标签
    metaArr.push('<meta charset="utf-8">');
    metaArr.push(`<title>${this._escapeHtml(title)}</title>`);
    metaArr.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
    metaArr.push(`<meta name="description" content="${this._escapeHtml(description)}">`);
    metaArr.push(`<meta name="keywords" content="${this._escapeHtml(keywords)}">`);

    // Open Graph标签
    metaArr.push('<meta property="og:type" content="website">');
    metaArr.push(`<meta property="og:title" content="${this._escapeHtml(title)}">`);
    metaArr.push(`<meta property="og:description" content="${this._escapeHtml(description)}">`);

    if (ogData.img) {
      metaArr.push(`<meta property="og:image" content="${this._escapeHtml(ogData.img)}">`);
    }
    if (ogData.url) {
      metaArr.push(`<meta property="og:url" content="${this._escapeHtml(ogData.url)}">`);
    }

    // 其他meta标签
    metaArr.push('<meta name="author" content="DoraCMS">');
    metaArr.push(`<input type="hidden" id="logined" value="${_ctx.logined || false}">`);

    // 页面特定的hidden input
    if (_ctx.pageType === 'post' && _ctx.post?.id) {
      metaArr.push(`<input type="hidden" id="post_id" value="${_ctx.post.id}">`);
    } else if (_ctx.pageType === 'cate' && _ctx.cateInfo?.id) {
      metaArr.push(`<input type="hidden" id="cate_id" value="${_ctx.cateInfo.id}">`);
    }

    // 添加自定义内容
    if (rawCode) {
      metaArr.push(rawCode);
    }

    let metaStr = metaArr.join('\n');

    // 添加统计代码
    if (statisticalCode && this._isValidUrl(statisticalCode)) {
      metaStr += this._generateAnalyticsScript(statisticalCode);
    }

    return metaStr;
  }

  /**
   * 转义HTML特殊字符
   * @param text
   */
  _escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 验证URL格式
   * @param url
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成分析脚本
   * @param statisticalCode
   */
  _generateAnalyticsScript(statisticalCode) {
    return `
<script>
  var _hmt = _hmt || [];
  (function () {
    var hm = document.createElement("script");
    hm.src = "${this._escapeHtml(statisticalCode)}";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
  })();
</script>`;
  }
}

module.exports = {
  Remote,
  Ads,
  Assets,
  Head,
};
