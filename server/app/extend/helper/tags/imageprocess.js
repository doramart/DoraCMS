'use strict';

const BaseTag = require('./base');

/**
 * 图片处理标签 - 支持多云服务商的图片裁剪和处理
 *
 * 支持的云服务商：
 * - 七牛云 (qiniu) - 使用 imageView2 API
 * - 阿里云 (aliyun) - 使用 OSS 图片处理 API
 *
 * Usage:
 * {% imageprocess url="https://example.com/image.jpg" mode="1" width="300" height="200" %}
 * {% imageprocess url="https://qiniu.example.com/image.jpg" mode="2" width="400" provider="qiniu" %}
 * {% imageprocess url="https://aliyun.example.com/image.jpg" mode="lfit" width="500" height="300" provider="aliyun" %}
 */
class ImageProcess extends BaseTag {
  constructor(ctx) {
    super(ctx, 'imageprocess');
  }

  async _execute(context, args) {
    try {
      // 参数验证
      if (!args || !args.url) {
        throw new Error('图片URL是必需参数');
      }

      const {
        url,
        mode = '1',
        width,
        height,
        quality,
        format,
        provider = 'auto',
        interlace = '0',
        ignoreError = '0',
        alt = '',
        className = '',
        style = '',
      } = args;

      // 自动检测云服务商
      const detectedProvider = provider === 'auto' ? this._detectProvider(url) : provider;

      // 构建处理后的图片URL
      let processedUrl;
      switch (detectedProvider) {
        case 'qiniu':
          processedUrl = this._buildQiniuUrl(url, {
            mode,
            width,
            height,
            quality,
            format,
            interlace,
            ignoreError,
          });
          break;
        case 'aliyun':
          processedUrl = this._buildAliyunUrl(url, { mode, width, height, quality, format });
          break;
        default:
          // 如果不是支持的云服务商，返回原图
          processedUrl = url;
          break;
      }

      // 生成 img 标签
      return this._generateImgTag(processedUrl, { alt, className, style, width, height });
    } catch (error) {
      throw new Error(`图片处理失败: ${error.message}`);
    }
  }

  /**
   * 自动检测云服务商
   * @param {string} url - 图片URL
   * @return {string} - 云服务商标识
   */
  _detectProvider(url) {
    if (!url || typeof url !== 'string') {
      return 'unknown';
    }

    const urlLower = url.toLowerCase();

    // 七牛云域名特征
    const qiniuPatterns = [/\.qiniucdn\.com/, /\.qnssl\.com/, /\.clouddn\.com/, /\.qbox\.me/, /qiniu/i];

    // 阿里云域名特征
    const aliyunPatterns = [/\.aliyuncs\.com/, /\.oss-/, /aliyun/i];

    // 检测七牛云
    if (qiniuPatterns.some(pattern => pattern.test(urlLower))) {
      return 'qiniu';
    }

    // 检测阿里云
    if (aliyunPatterns.some(pattern => pattern.test(urlLower))) {
      return 'aliyun';
    }

    return 'unknown';
  }

  /**
   * 构建七牛云图片处理URL
   * @param {string} url - 原始URL
   * @param {Object} options - 处理参数
   * @return {string} - 处理后的URL
   */
  _buildQiniuUrl(url, options) {
    const { mode, width, height, quality, format, interlace, ignoreError } = options;

    // 构建 imageView2 参数
    const params = [`imageView2/${mode}`];

    if (width) params.push(`w/${width}`);
    if (height) params.push(`h/${height}`);
    if (quality) params.push(`q/${quality}`);
    if (format) params.push(`format/${format}`);
    if (interlace === '1') params.push('interlace/1');
    if (ignoreError === '1') params.push('ignore-error/1');

    const queryString = params.join('/');
    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}${queryString}`;
  }

  /**
   * 构建阿里云图片处理URL
   * @param {string} url - 原始URL
   * @param {Object} options - 处理参数
   * @return {string} - 处理后的URL
   */
  _buildAliyunUrl(url, options) {
    const { mode, width, height, quality, format } = options;

    // 阿里云图片处理参数
    const params = [];

    // 缩放模式映射
    const modeMapping = {
      1: 'lfit', // 等比缩放，限定在指定w与h的矩形内的最大图片
      2: 'mfit', // 等比缩放，延伸出指定w与h的矩形框外的最小图片
      3: 'fill', // 固定宽高，将延伸出指定w与h的矩形框外的最小图片进行居中裁剪
      4: 'pad', // 固定宽高，缩略填充
      5: 'fixed', // 固定宽高，强制缩略
    };

    const aliyunMode = modeMapping[mode] || mode || 'lfit';
    params.push(`resize,m_${aliyunMode}`);

    if (width) params.push(`w_${width}`);
    if (height) params.push(`h_${height}`);
    if (quality) params.push(`quality,q_${quality}`);
    if (format) params.push(`format,${format}`);

    const queryString = `x-oss-process=image/${params.join(',')}`;
    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}${queryString}`;
  }

  /**
   * 生成 img 标签
   * @param {string} src - 图片URL
   * @param {Object} options - 标签属性
   * @return {string} - HTML img 标签
   */
  _generateImgTag(src, options) {
    const { alt = '', className = '', style = '', width, height } = options;

    const attributes = [`src="${this._escapeHtml(src)}"`];

    if (alt) attributes.push(`alt="${this._escapeHtml(alt)}"`);
    if (className) attributes.push(`class="${this._escapeHtml(className)}"`);
    if (style) attributes.push(`style="${this._escapeHtml(style)}"`);
    if (width) attributes.push(`width="${width}"`);
    if (height) attributes.push(`height="${height}"`);

    // 添加 loading="lazy" 以提升性能
    attributes.push('loading="lazy"');

    return `<img ${attributes.join(' ')} />`;
  }

  /**
   * HTML转义
   * @param {string} text - 需要转义的文本
   * @return {string} - 转义后的文本
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
}

/**
 * 图片处理工具函数
 */
const ImageProcessUtils = {
  /**
   * 获取支持的七牛云处理模式
   * @return {Object} - 模式说明
   */
  getQiniuModes() {
    return {
      1: '等比缩放，限定在指定w与h的矩形内的最大图片',
      2: '等比缩放，延伸出指定w与h的矩形框外的最小图片',
      3: '限定在指定w与h的矩形内的最大图片（不缩放）',
      4: '限定在指定w与h的矩形外的最小图片（不缩放）',
      5: '固定宽高，居中裁剪',
    };
  },

  /**
   * 获取支持的阿里云处理模式
   * @return {Object} - 模式说明
   */
  getAliyunModes() {
    return {
      lfit: '等比缩放，限定在指定w与h的矩形内的最大图片',
      mfit: '等比缩放，延伸出指定w与h的矩形框外的最小图片',
      fill: '固定宽高，将延伸出指定w与h的矩形框外的最小图片进行居中裁剪',
      pad: '固定宽高，缩略填充',
      fixed: '固定宽高，强制缩略',
    };
  },

  /**
   * 获取支持的图片格式
   * @return {Array} - 支持的格式列表
   */
  getSupportedFormats() {
    return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heif', 'gif', 'bmp'];
  },

  /**
   * 验证图片处理参数
   * @param {Object} params - 参数对象
   * @return {Object} - 验证结果
   */
  validateParams(params) {
    const errors = [];
    const warnings = [];

    // 验证URL
    if (!params.url) {
      errors.push('图片URL不能为空');
    } else if (typeof params.url !== 'string') {
      errors.push('图片URL必须是字符串');
    }

    // 验证尺寸参数
    if (params.width && (isNaN(params.width) || params.width <= 0)) {
      errors.push('宽度必须是正整数');
    }
    if (params.height && (isNaN(params.height) || params.height <= 0)) {
      errors.push('高度必须是正整数');
    }

    // 验证质量参数
    if (params.quality && (isNaN(params.quality) || params.quality < 1 || params.quality > 100)) {
      errors.push('图片质量必须是1-100之间的整数');
    }

    // 验证格式
    if (params.format && !this.getSupportedFormats().includes(params.format.toLowerCase())) {
      warnings.push(`不支持的图片格式: ${params.format}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

module.exports = {
  ImageProcess,
  ImageProcessUtils,
};
