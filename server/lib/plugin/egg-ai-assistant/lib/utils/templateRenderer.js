/**
 * 模板渲染引擎
 * 支持 Handlebars 风格的变量替换和简单的逻辑处理
 */
'use strict';

class TemplateRenderer {
  /**
   * 渲染模板
   * @param {String} template - 模板字符串
   * @param {Object} variables - 变量对象
   * @param {Object} options - 渲染选项
   * @return {String} 渲染后的字符串
   */
  static render(template, variables = {}, options = {}) {
    const { strict = false, escapeHtml = false } = options;

    if (!template) {
      return '';
    }

    let rendered = template;

    try {
      // 1. 替换简单变量：{{variable}}
      rendered = this._replaceSimpleVariables(rendered, variables, strict);

      // 2. 处理条件语句：{{#if condition}}...{{/if}}
      rendered = this._processConditionals(rendered, variables);

      // 3. 处理循环：{{#each array}}...{{/each}}
      rendered = this._processLoops(rendered, variables);

      // 4. 处理 HTML 转义（如果需要）
      if (escapeHtml) {
        rendered = this._escapeHtml(rendered);
      }

      // 5. 清理未匹配的变量（如果不是严格模式）
      if (!strict) {
        rendered = this._cleanUnmatchedVariables(rendered);
      }

      return rendered;
    } catch (error) {
      if (strict) {
        throw error;
      }
      return template; // 严格模式下出错返回原模板
    }
  }

  /**
   * 替换简单变量
   * @param {String} template - 模板
   * @param {Object} variables - 变量
   * @param {Boolean} strict - 严格模式
   * @return {String} 替换后的字符串
   * @private
   */
  static _replaceSimpleVariables(template, variables, strict) {
    // 匹配 {{variable}} 或 {{object.property}}
    const regex = /\{\{([^{}#/]+?)\}\}/g;

    return template.replace(regex, (match, key) => {
      const trimmedKey = key.trim();
      const value = this._getNestedValue(variables, trimmedKey);

      if (value === undefined || value === null) {
        if (strict) {
          throw new Error(`Variable "${trimmedKey}" is not defined`);
        }
        return match; // 保持原样
      }

      return String(value);
    });
  }

  /**
   * 处理条件语句
   * @param {String} template - 模板
   * @param {Object} variables - 变量
   * @return {String} 处理后的字符串
   * @private
   */
  static _processConditionals(template, variables) {
    // 匹配 {{#if condition}}...{{/if}}
    const regex = /\{\{#if\s+([^}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(regex, (match, condition, content) => {
      const trimmedCondition = condition.trim();
      const value = this._getNestedValue(variables, trimmedCondition);

      // 判断真值
      if (this._isTruthy(value)) {
        return content;
      }

      return '';
    });
  }

  /**
   * 处理循环
   * @param {String} template - 模板
   * @param {Object} variables - 变量
   * @return {String} 处理后的字符串
   * @private
   */
  static _processLoops(template, variables) {
    // 匹配 {{#each array}}...{{/each}}
    const regex = /\{\{#each\s+([^}]+?)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(regex, (match, arrayKey, itemTemplate) => {
      const trimmedKey = arrayKey.trim();
      const array = this._getNestedValue(variables, trimmedKey);

      if (!Array.isArray(array)) {
        return '';
      }

      return array
        .map((item, index) => {
          // 在每个迭代中，可以使用 {{this}} 表示当前项
          const itemVariables = {
            ...variables,
            this: item,
            '@index': index,
            '@first': index === 0,
            '@last': index === array.length - 1,
          };

          return this._replaceSimpleVariables(itemTemplate, itemVariables, false);
        })
        .join('');
    });
  }

  /**
   * 获取嵌套对象的值
   * @param {Object} obj - 对象
   * @param {String} path - 路径（如 'user.name'）
   * @return {*} 值
   * @private
   */
  static _getNestedValue(obj, path) {
    if (!path) return undefined;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * 判断是否为真值
   * @param {*} value - 值
   * @return {Boolean} 是否为真
   * @private
   */
  static _isTruthy(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  /**
   * HTML 转义
   * @param {String} str - 字符串
   * @return {String} 转义后的字符串
   * @private
   */
  static _escapeHtml(str) {
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
  }

  /**
   * 清理未匹配的变量占位符
   * @param {String} str - 字符串
   * @return {String} 清理后的字符串
   * @private
   */
  static _cleanUnmatchedVariables(str) {
    // 移除未被替换的 {{variable}}
    return str.replace(/\{\{[^{}]+?\}\}/g, '');
  }

  /**
   * 批量渲染多个模板
   * @param {Array<Object>} templates - 模板数组 [{template, variables}]
   * @param {Object} options - 渲染选项
   * @return {Array<String>} 渲染结果数组
   */
  static renderBatch(templates, options = {}) {
    return templates.map(({ template, variables }) => this.render(template, variables, options));
  }

  /**
   * 验证模板语法
   * @param {String} template - 模板字符串
   * @return {Object} 验证结果 {valid: Boolean, errors: Array}
   */
  static validate(template) {
    const errors = [];

    if (!template || typeof template !== 'string') {
      errors.push('Template must be a non-empty string');
      return { valid: false, errors };
    }

    // 检查括号匹配
    const openBrackets = (template.match(/\{\{/g) || []).length;
    const closeBrackets = (template.match(/\}\}/g) || []).length;

    if (openBrackets !== closeBrackets) {
      errors.push('Mismatched brackets: {{ and }}');
    }

    // 检查条件语句匹配
    const ifStarts = (template.match(/\{\{#if/g) || []).length;
    const ifEnds = (template.match(/\{\{\/if\}\}/g) || []).length;

    if (ifStarts !== ifEnds) {
      errors.push('Mismatched conditional statements: {{#if}} and {{/if}}');
    }

    // 检查循环语句匹配
    const eachStarts = (template.match(/\{\{#each/g) || []).length;
    const eachEnds = (template.match(/\{\{\/each\}\}/g) || []).length;

    if (eachStarts !== eachEnds) {
      errors.push('Mismatched loop statements: {{#each}} and {{/each}}');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 提取模板中使用的所有变量
   * @param {String} template - 模板字符串
   * @return {Array<String>} 变量名数组
   */
  static extractVariables(template) {
    const variables = new Set();
    const regex = /\{\{([^{}#/]+?)\}\}/g;

    let match;
    while ((match = regex.exec(template)) !== null) {
      const variable = match[1].trim();
      // 跳过特殊变量
      if (!variable.startsWith('@') && variable !== 'this') {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * 检查模板是否包含特定变量
   * @param {String} template - 模板字符串
   * @param {String} variable - 变量名
   * @return {Boolean} 是否包含
   */
  static hasVariable(template, variable) {
    const variables = this.extractVariables(template);
    return variables.includes(variable);
  }

  /**
   * 预编译模板（缓存优化）
   * @param {String} template - 模板字符串
   * @return {Function} 渲染函数
   */
  static compile(template) {
    // 验证模板
    const validation = this.validate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // 返回渲染函数
    return (variables, options = {}) => {
      return this.render(template, variables, options);
    };
  }
}

module.exports = TemplateRenderer;
