/**
 * 内容发布相关工具函数
 */

/**
 * 将扁平列表转换为树形结构
 * @param {Array} list 扁平列表
 * @param {String|Number|null} parentId 父节点 ID，默认为 null（自动识别顶级节点）
 * @returns {Array} 树形结构数组
 *
 * 说明：
 * - MongoDB 模式：parentId 为字符串 "0"
 * - MariaDB 模式：parentId 为数字 0
 * - 其他情况：parentId 为 null/undefined
 */
export function convertToTree(list, parentId = null) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .filter(item => {
      const pid = item.parentId || item.parent || item._parentId;

      // 🔥 优化：同时支持 MongoDB(字符串"0")、MariaDB(数字0) 和 null
      if (parentId === null) {
        // 第一次调用，查找顶级节点
        return pid === 0 || pid === '0' || pid === null || pid === undefined;
      }

      // 递归调用，精确匹配
      return pid === parentId;
    })
    .map(item => ({
      ...item,
      children: convertToTree(list, item.id || item._id),
    }));
}

/**
 * 从树形结构中查找节点
 * @param {Array} tree - 树形结构数组
 * @param {String} id - 节点 ID
 * @returns {Object|null} 找到的节点
 */
export function findNodeInTree(tree, id) {
  if (!Array.isArray(tree) || !id) {
    return null;
  }

  for (const node of tree) {
    if (node.id === id || node._id === id) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * 从 HTML 中提取纯文本
 * @param {String} html - HTML 字符串
 * @returns {String} 纯文本
 */
export function extractTextFromHtml(html) {
  if (!html) {
    return '';
  }

  // 移除 HTML 标签
  let text = html.replace(/<[^>]+>/g, '');

  // 解码 HTML 实体
  const entities = {
    '&nbsp;': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
  };

  text = text.replace(/&[^;]+;/g, entity => entities[entity] || entity);

  // 移除多余的空白
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * 格式化文件大小
 * @param {Number} bytes - 字节数
 * @returns {String} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 验证 URL 格式
 * @param {String} url - URL 字符串
 * @returns {Boolean} 是否有效
 */
export function isValidUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 截取文本
 * @param {String} text - 原始文本
 * @param {Number} maxLength - 最大长度
 * @param {String} suffix - 后缀（默认 '...'）
 * @returns {String} 截取后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {Number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * 生成唯一 ID
 * @param {String} prefix - ID 前缀
 * @returns {String} 唯一 ID
 */
export function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
