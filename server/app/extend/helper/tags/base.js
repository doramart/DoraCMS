'use strict';

const nunjucks = require('nunjucks');

/**
 * Base Tag Class for DoraCMS
 * All template tags should extend this class
 */
class BaseTag {
  constructor(ctx, tagName) {
    this.ctx = ctx;
    this.tagName = tagName || this.constructor.name.toLowerCase();
    this.tags = [this.tagName];
  }

  /**
   * Parse the tag
   * Default parsing implementation handles args and returns a CallExtensionAsync node
   * @param parser
   * @param nodes
   */
  parse(parser, nodes) {
    const token = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);
    return new nodes.CallExtensionAsync(this, 'run', args);
  }

  /**
   * Run the tag - to be implemented by subclasses
   * @param {Object} context - The template context
   * @param {Object} args - The arguments passed to the tag
   * @param {Function} callback - The callback to call when the tag is done
   */
  async run(context, args, callback) {
    try {
      const result = await this._execute(context, args);

      // 统一处理返回值
      const outputValue = this._processResult(result);
      return callback(null, outputValue);
    } catch (error) {
      // 统一错误处理
      const errorOutput = this._handleError(error, context, args);
      return callback(null, errorOutput);
    }
  }

  /**
   * Process the execution result
   * @param {*} result - The result from _execute
   * @return {string|nunjucks.runtime.SafeString} - Processed output
   */
  _processResult(result) {
    // Only return string values (HTML), otherwise return empty string
    // This prevents data objects from being rendered directly in the template
    if (typeof result === 'string') {
      // Mark HTML strings as safe so they won't be escaped by Nunjucks
      return new nunjucks.runtime.SafeString(result);
    }
    return '';
  }

  /**
   * Handle errors consistently across all tags
   * @param {Error} error - The error that occurred
   * @param {Object} context - The template context
   * @param {Object} args - The arguments passed to the tag
   * @return {string|nunjucks.runtime.SafeString} - Error output
   */
  _handleError(error, context, args) {
    // 确保错误对象有基本属性
    const safeError = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      name: error?.name || 'Error',
    };

    // 开发环境显示详细错误信息
    if (process.env.NODE_ENV === 'development') {
      const errorMsg = `<div class="template-error" style="color: red; border: 1px solid red; padding: 5px; margin: 5px;">
        [${this.tagName}] Error: ${safeError.message}
        <br><small>Args: ${JSON.stringify(args)}</small>
      </div>`;
      return new nunjucks.runtime.SafeString(errorMsg);
    }

    // 生产环境仅记录错误，返回空字符串
    this.ctx.logger.error(`[${this.tagName}] Error:`, {
      error: safeError.message,
      stack: safeError.stack,
      args,
      tagName: this.tagName,
    });

    return '';
  }

  /**
   * Execute the tag logic - to be implemented by subclasses
   * @param context
   * @param args
   */
  async _execute(context, args) {
    throw new Error('_execute method must be implemented by subclass');
  }
}

module.exports = BaseTag;
