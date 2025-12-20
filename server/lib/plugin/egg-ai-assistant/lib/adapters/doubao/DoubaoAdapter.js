/**
 * Doubao（豆包）文生图适配器
 * 支持豆包 SeeDream 系列图片生成模型
 *
 * 支持的模型：
 * - doubao-seedream-3-0-t2i-250415
 * - doubao-seedream-4-0-250828
 *
 * API文档: https://www.volcengine.com/docs/82379/1541523
 *
 * @author DoraCMS Team
 * @date 2025-01-21
 */
'use strict';

const BaseAIAdapter = require('../base/BaseAIAdapter');

class DoubaoAdapter extends BaseAIAdapter {
  /**
   * 构造函数
   * @param {Object} app - Egg Application 实例
   * @param {Object} config - 配置
   */
  constructor(app, config = {}) {
    super(app, config);

    this.provider = 'doubao';
    this.apiEndpoint = config.apiEndpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    this.defaultModel = config.defaultModel || 'doubao-seedream-4-0-250828';

    // 图片生成特有配置
    this.defaultSize = config.size || '1024x1024';
    this.defaultGuidanceScale = config.guidanceScale || 3;
    this.defaultWatermark = config.watermark !== undefined ? config.watermark : true;

    // 验证必需配置
    this._validateConfig(['apiKey']);
  }

  /**
   * 生成图片（覆盖基类的 generate 方法）
   * 注意：豆包模型是图片生成，不是文本生成
   *
   * @param {String} prompt - 图片描述提示词
   * @param {Object} options - 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now();

    try {
      // 准备请求参数
      const requestBody = this._buildRequestBody(prompt, options);

      // 发送请求
      const response = await this._sendRequest('/images/generations', requestBody);

      // 解析响应
      const result = this._parseResponse(response);

      // 计算成本（图片生成按次计费）
      const cost = this.calculateCost({ imageCount: result.imageCount }, requestBody.model);

      return {
        content: result.imageUrls, // 返回图片URL数组
        imageData: result.imageData, // 如果是 base64 格式
        usage: {
          imageCount: result.imageCount,
          model: requestBody.model,
        },
        cost,
        metadata: {
          model: requestBody.model,
          size: requestBody.size,
          responseFormat: requestBody.response_format,
          responseTime: Date.now() - startTime,
          ...result.metadata,
        },
      };
    } catch (error) {
      this.logger.error('[Doubao] Image generation failed:', error);
      throw this._formatError(error);
    }
  }

  /**
   * 生成图片（带重试机制）
   * @param {String} prompt - 图片描述提示词
   * @param {Object} options - 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generateImage(prompt, options = {}) {
    return await this.generateWithRetry(prompt, options);
  }

  /**
   * 构建请求体
   * @param {String} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Object} 请求体
   * @private
   */
  _buildRequestBody(prompt, options = {}) {
    const model = options.model || this.defaultModel;

    // 基础请求参数
    const requestBody = {
      model,
      prompt,
      response_format: options.responseFormat || 'url', // url 或 b64_json
      watermark: options.watermark !== undefined ? options.watermark : this.defaultWatermark,
    };

    // 根据不同模型添加特定参数
    if (model === 'doubao-seedream-3-0-t2i-250415') {
      // SeeDream 3.0 参数
      requestBody.size = options.size || this.defaultSize;
      requestBody.guidance_scale = options.guidanceScale || this.defaultGuidanceScale;
    } else if (model === 'doubao-seedream-4-0-250828') {
      // SeeDream 4.0 参数
      requestBody.size = options.size || '2K'; // 2K, 4K, 1024x1024 等
      requestBody.sequential_image_generation = options.sequentialImageGeneration || 'disabled';
      requestBody.stream = options.stream || false;
    }

    // 通用可选参数
    if (options.n) {
      requestBody.n = options.n; // 生成图片数量
    }

    return requestBody;
  }

  /**
   * 发送 HTTP 请求
   * @param {String} endpoint - API 端点
   * @param {Object} body - 请求体
   * @return {Promise<Object>} 响应数据
   * @private
   */
  async _sendRequest(endpoint, body) {
    const url = `${this.apiEndpoint}${endpoint}`;

    this.logger.info(`[Doubao] Sending image generation request to: ${url}`);
    this.logger.debug('[Doubao] Request body:', JSON.stringify(body, null, 2));

    const response = await this.app.curl(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      data: body,
      dataType: 'json',
      timeout: this.timeout || 60000, // 图片生成可能需要更长时间
      contentType: 'json',
    });

    if (response.status !== 200) {
      throw this._parseError(response);
    }

    return response.data;
  }

  /**
   * 解析响应
   * @param {Object} response - API 响应
   * @return {Object} 解析后的结果
   * @private
   */
  _parseResponse(response) {
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response from Doubao API: no data array returned');
    }

    const images = response.data;
    const imageUrls = [];
    const imageData = [];

    images.forEach(img => {
      if (img.url) {
        imageUrls.push(img.url);
      }
      if (img.b64_json) {
        imageData.push(img.b64_json);
      }
    });

    return {
      imageUrls,
      imageData,
      imageCount: images.length,
      metadata: {
        created: response.created,
        revisedPrompt: images[0]?.revised_prompt,
      },
    };
  }

  /**
   * 解析错误响应
   * @param {Object} response - 错误响应
   * @return {Error} 错误对象
   * @private
   */
  _parseError(response) {
    const errorMsg = response.data?.error?.message || response.data?.message || `Doubao API error: ${response.status}`;

    const error = new Error(errorMsg);
    error.code = response.data?.error?.code || response.data?.error_code || 'DOUBAO_API_ERROR';
    error.status = response.status;
    error.type = response.data?.error?.type;

    return error;
  }

  /**
   * 计算成本
   * 豆包文生图按次计费，不同模型价格不同
   *
   * @param {Object} usage - 使用情况
   * @param {String} model - 模型名称
   * @return {Number} 成本（元）
   */
  calculateCost(usage, model) {
    const imageCount = usage.imageCount || 1;

    // 根据模型获取单次成本
    let costPerImage = this.config.costPerRequest || 0;

    // 如果配置中没有指定，使用默认价格（需要根据实际定价调整）
    if (!costPerImage) {
      switch (model) {
        case 'doubao-seedream-3-0-t2i-250415':
          costPerImage = 0.02; // 示例价格，需要根据实际调整
          break;
        case 'doubao-seedream-4-0-250828':
          costPerImage = 0.03; // 示例价格，需要根据实际调整
          break;
        default:
          costPerImage = 0.02;
      }
    }

    return imageCount * costPerImage;
  }

  /**
   * 验证 API Key
   * @return {Promise<Boolean>} 是否有效
   */
  async validateApiKey() {
    try {
      // 使用简单的提示词测试 API Key
      await this.generate('test image', {
        model: this.defaultModel,
        size: '1024x1024',
      });
      return true;
    } catch (error) {
      this.logger.warn('[Doubao] API Key validation failed:', error.message);
      return false;
    }
  }

  /**
   * 健康检查
   * @return {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const startTime = Date.now();

      // 使用最小参数进行健康检查
      await this.generate('health check', {
        model: this.defaultModel,
        size: '1024x1024',
      });

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        provider: this.provider,
        responseTime,
        models: this._getSupportedModels(),
        stats: this.getStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        provider: this.provider,
        error: error.message,
        stats: this.getStats(),
      };
    }
  }

  /**
   * 获取支持的模型列表
   * @return {Array<String>} 模型列表
   * @private
   */
  _getSupportedModels() {
    return ['doubao-seedream-3-0-t2i-250415', 'doubao-seedream-4-0-250828'];
  }

  /**
   * 获取模型支持的图片尺寸
   * @param {String} model - 模型名称
   * @return {Array<String>} 支持的尺寸列表
   */
  getSupportedSizes(model) {
    if (model === 'doubao-seedream-3-0-t2i-250415') {
      return ['1024x1024', '1024x768', '768x1024', '1280x720', '720x1280'];
    } else if (model === 'doubao-seedream-4-0-250828') {
      return ['1024x1024', '2K', '4K', '1280x720', '720x1280'];
    }
    return ['1024x1024'];
  }

  /**
   * 构建请求头
   * @return {Object} 请求头
   * @protected
   */
  _buildHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': 'egg-ai-assistant/1.0.0',
    };
  }
}

module.exports = DoubaoAdapter;
