/**
 * 搜索关键词高亮和上下文提取工具
 */
class SearchHighlighter {
  constructor(options = {}) {
    this.options = {
      // 摘要长度配置
      maxSnippetLength: options.maxSnippetLength || 200,
      contextLength: options.contextLength || 50, // 关键词前后的上下文长度
      maxSnippets: options.maxSnippets || 3, // 最多显示几个摘要片段

      // 高亮标签配置
      highlightTag: options.highlightTag || 'mark',
      highlightClass: options.highlightClass || 'search-highlight',

      // 省略号配置
      ellipsis: options.ellipsis || '...',

      // 分隔符配置
      snippetSeparator: options.snippetSeparator || ' ... ',

      ...options,
    };
  }

  /**
   * 提取包含关键词的上下文片段并高亮
   * @param {string} text 原始文本
   * @param {string|array} keywords 搜索关键词（可以是字符串或数组）
   * @param {object} options 选项
   * @return {object} 处理结果
   */
  extractAndHighlight(text, keywords, options = {}) {
    if (!text || !keywords) {
      return {
        highlighted: text || '',
        snippets: [],
        hasMatches: false,
        matchCount: 0,
      };
    }

    const opts = { ...this.options, ...options };

    // 预处理关键词
    const keywordList = this._preprocessKeywords(keywords);
    if (keywordList.length === 0) {
      return {
        highlighted: text,
        snippets: [],
        hasMatches: false,
        matchCount: 0,
      };
    }

    // 查找所有匹配位置
    const matches = this._findAllMatches(text, keywordList);
    if (matches.length === 0) {
      return {
        highlighted: text,
        snippets: [],
        hasMatches: false,
        matchCount: 0,
      };
    }

    // 生成高亮文本
    const highlighted = this._highlightText(text, matches, opts);

    // 提取关键词周围的上下文片段
    const snippets = this._extractContextSnippets(text, matches, opts);

    return {
      highlighted,
      snippets,
      hasMatches: true,
      matchCount: matches.length,
      keywords: keywordList,
    };
  }

  /**
   * 预处理关键词
   * @param {string|array} keywords 关键词
   * @return {array} 处理后的关键词数组
   * @private
   */
  _preprocessKeywords(keywords) {
    if (!keywords) return [];

    const keywordList = Array.isArray(keywords) ? keywords : [keywords];

    return keywordList
      .filter(keyword => keyword && typeof keyword === 'string')
      .map(keyword => String(keyword).trim().toLowerCase())
      .filter(keyword => keyword.length > 0)
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index) // 去重
      .sort((a, b) => b.length - a.length); // 按长度排序，优先匹配长词
  }

  /**
   * 查找所有关键词匹配位置
   * @param {string} text 文本
   * @param {array} keywords 关键词列表
   * @return {array} 匹配位置数组
   * @private
   */
  _findAllMatches(text, keywords) {
    if (!text || typeof text !== 'string' || !keywords || keywords.length === 0) {
      return [];
    }

    const matches = [];
    const lowerText = String(text).toLowerCase();

    keywords.forEach(keyword => {
      let startIndex = 0;
      while (true) {
        const index = lowerText.indexOf(keyword, startIndex);
        if (index === -1) break;

        matches.push({
          keyword,
          start: index,
          end: index + keyword.length,
          text: text.substring(index, index + keyword.length),
        });

        startIndex = index + 1;
      }
    });

    // 按位置排序并去除重叠
    return this._mergeOverlappingMatches(matches.sort((a, b) => a.start - b.start));
  }

  /**
   * 合并重叠的匹配项
   * @param {array} matches 匹配数组
   * @return {array} 合并后的匹配数组
   * @private
   */
  _mergeOverlappingMatches(matches) {
    if (matches.length <= 1) return matches;

    const merged = [matches[0]];

    for (let i = 1; i < matches.length; i++) {
      const current = matches[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        // 重叠或相邻，合并
        last.end = Math.max(last.end, current.end);
        last.keyword = last.keyword.length >= current.keyword.length ? last.keyword : current.keyword;
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * 高亮文本中的关键词
   * @param {string} text 原文本
   * @param {array} matches 匹配位置
   * @param {object} opts 选项
   * @return {string} 高亮后的文本
   * @private
   */
  _highlightText(text, matches, opts) {
    if (matches.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    matches.forEach(match => {
      // 添加匹配前的文本
      result += this._escapeHtml(text.substring(lastIndex, match.start));

      // 添加高亮的匹配文本
      const highlightedText = this._escapeHtml(text.substring(match.start, match.end));
      result += `<${opts.highlightTag} class="${opts.highlightClass}">${highlightedText}</${opts.highlightTag}>`;

      lastIndex = match.end;
    });

    // 添加最后的文本
    result += this._escapeHtml(text.substring(lastIndex));

    return result;
  }

  /**
   * 提取包含关键词的上下文片段
   * @param {string} text 原文本
   * @param {array} matches 匹配位置
   * @param {object} opts 选项
   * @return {array} 上下文片段数组
   * @private
   */
  _extractContextSnippets(text, matches, opts) {
    if (matches.length === 0) return [];

    const snippets = [];
    const usedRanges = []; // 记录已使用的文本范围，避免重复

    // 按匹配位置分组，相近的匹配合并为一个片段
    const groups = this._groupNearbyMatches(matches, opts.contextLength);

    groups.slice(0, opts.maxSnippets).forEach(group => {
      const snippet = this._extractSingleSnippet(text, group, opts, usedRanges);
      if (snippet) {
        snippets.push(snippet);
      }
    });

    return snippets;
  }

  /**
   * 将相近的匹配分组
   * @param {array} matches 匹配数组
   * @param {number} contextLength 上下文长度
   * @return {array} 分组后的匹配数组
   * @private
   */
  _groupNearbyMatches(matches, contextLength) {
    if (matches.length === 0) return [];

    const groups = [[matches[0]]];

    for (let i = 1; i < matches.length; i++) {
      const current = matches[i];
      const lastGroup = groups[groups.length - 1];
      const lastMatch = lastGroup[lastGroup.length - 1];

      // 如果当前匹配与上一个匹配的距离小于2倍上下文长度，则归为一组
      if (current.start - lastMatch.end <= contextLength * 2) {
        lastGroup.push(current);
      } else {
        groups.push([current]);
      }
    }

    return groups;
  }

  /**
   * 提取单个上下文片段
   * @param {string} text 原文本
   * @param {array} matchGroup 匹配组
   * @param {object} opts 选项
   * @param {array} usedRanges 已使用的范围
   * @return {object|null} 片段对象
   * @private
   */
  _extractSingleSnippet(text, matchGroup, opts, usedRanges) {
    const firstMatch = matchGroup[0];
    const lastMatch = matchGroup[matchGroup.length - 1];

    // 计算上下文范围
    const start = Math.max(0, firstMatch.start - opts.contextLength);
    const end = Math.min(text.length, lastMatch.end + opts.contextLength);

    // 检查是否与已有片段重叠
    const overlaps = usedRanges.some(range => !(end <= range.start || start >= range.end));

    if (overlaps) return null;

    // 记录使用的范围
    usedRanges.push({ start, end });

    // 提取文本片段
    let snippet = text.substring(start, end);

    // 在词边界处截断
    snippet = this._trimToWordBoundary(snippet, start > 0, end < text.length);

    // 生成高亮版本
    const highlightedSnippet = this._highlightTextInRange(text, matchGroup, start, end, opts);

    return {
      text: snippet,
      highlighted: highlightedSnippet,
      plainText: this._stripHtml(highlightedSnippet), // 纯文本版本，去除HTML标签
      start,
      end,
      matchCount: matchGroup.length,
    };
  }

  /**
   * 在指定范围内高亮文本
   * @param {string} text 原文本
   * @param {array} matches 匹配数组
   * @param {number} rangeStart 范围开始
   * @param {number} rangeEnd 范围结束
   * @param {object} opts 选项
   * @return {string} 高亮后的文本
   * @private
   */
  _highlightTextInRange(text, matches, rangeStart, rangeEnd, opts) {
    // 过滤范围内的匹配
    const rangeMatches = matches.filter(match => match.start >= rangeStart && match.end <= rangeEnd);

    if (rangeMatches.length === 0) {
      return this._escapeHtml(text.substring(rangeStart, rangeEnd));
    }

    let result = '';
    let lastIndex = rangeStart;

    rangeMatches.forEach(match => {
      // 添加匹配前的文本
      result += this._escapeHtml(text.substring(lastIndex, match.start));

      // 添加高亮的匹配文本
      const highlightedText = this._escapeHtml(text.substring(match.start, match.end));
      result += `<${opts.highlightTag} class="${opts.highlightClass}">${highlightedText}</${opts.highlightTag}>`;

      lastIndex = match.end;
    });

    // 添加最后的文本
    result += this._escapeHtml(text.substring(lastIndex, rangeEnd));

    return result;
  }

  /**
   * 在词边界处修剪文本
   * @param {string} text 文本
   * @param {boolean} hasPrefix 是否有前缀
   * @param {boolean} hasSuffix 是否有后缀
   * @return {string} 修剪后的文本
   * @private
   */
  _trimToWordBoundary(text, hasPrefix, hasSuffix) {
    let result = text;

    // 前面修剪
    if (hasPrefix && result.length > 0) {
      const spaceIndex = result.indexOf(' ');
      if (spaceIndex > 0 && spaceIndex < 10) {
        // 只在前10个字符内查找空格
        result = result.substring(spaceIndex + 1);
        hasPrefix = true;
      }
    }

    // 后面修剪
    if (hasSuffix && result.length > 0) {
      const lastSpaceIndex = result.lastIndexOf(' ');
      if (lastSpaceIndex > result.length - 10 && lastSpaceIndex > 0) {
        // 只在后10个字符内查找空格
        result = result.substring(0, lastSpaceIndex);
        hasSuffix = true;
      }
    }

    // 添加省略号
    if (hasPrefix) result = this.options.ellipsis + result;
    if (hasSuffix) result = result + this.options.ellipsis;

    return result;
  }

  /**
   * HTML转义
   * @param {string} text 文本
   * @return {string} 转义后的文本
   * @private
   */
  _escapeHtml(text) {
    if (!text) return '';

    // 检查是否在浏览器环境
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      } catch (error) {
        // 浏览器环境出错时回退到手动转义
      }
    }

    // 服务器端或浏览器环境出错时的手动转义
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 去除HTML标签，返回纯文本
   * @param {string} html HTML文本
   * @return {string} 纯文本
   * @private
   */
  _stripHtml(html) {
    if (!html) return '';

    let text = String(html);

    // 先解码HTML实体（在去除标签之前）
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

    // 去除所有HTML标签（包括属性）
    text = text.replace(/<[^>]*>/g, '');

    // 清理多余的空白字符
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }
}

module.exports = SearchHighlighter;
