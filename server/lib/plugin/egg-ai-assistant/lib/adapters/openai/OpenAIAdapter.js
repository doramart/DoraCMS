/**
 * OpenAI 适配器
 * 支持 GPT-3.5/GPT-4 系列模型
 */
'use strict';

const BaseAIAdapter = require('../base/BaseAIAdapter');
const TokenCounter = require('../../utils/tokenCounter');
const CostCalculator = require('../../utils/costCalculator');

class OpenAIAdapter extends BaseAIAdapter {
  /**
   * 构造函数
   * @param {Object} app - Egg Application 实例
   * @param {Object} config - 配置
   */
  constructor(app, config = {}) {
    super(app, config);

    this.provider = 'openai';
    this.apiEndpoint = config.apiEndpoint || 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel || 'gpt-3.5-turbo';
    this.defaultTemperature = config.temperature || 0.7;
    this.defaultMaxTokens = config.maxTokens || 2000;

    // 验证必需配置
    this._validateConfig(['apiKey']);
  }

  /**
   * 生成文本内容
   * @param {String|Array} prompt - 提示词（字符串或消息数组）
   * @param {Object} options - 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now();

    try {
      // 准备请求参数
      const requestBody = this._buildRequestBody(prompt, options);

      // 发送请求
      const response = await this._sendRequest('/chat/completions', requestBody);

      // 解析响应
      const result = this._parseResponse(response);

      // 计算成本
      const cost = CostCalculator.calculate(result.usage, requestBody.model);

      return {
        content: result.content,
        usage: result.usage,
        cost,
        metadata: {
          model: requestBody.model,
          finishReason: result.finishReason,
          responseTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('[OpenAI] Generation failed:', error);
      throw this._formatError(error);
    }
  }

  /**
   * 流式生成内容
   * @param {String|Array} prompt - 提示词
   * @param {Object} options - 生成选项
   * @param {Function} onChunk - 数据块回调
   * @return {Promise<Object>} 生成结果
   */
  async generateStream(prompt, options = {}, onChunk) {
    const startTime = Date.now();

    try {
      // 准备请求参数
      const requestBody = this._buildRequestBody(prompt, { ...options, stream: true });

      // 发送流式请求
      const response = await this._sendStreamRequest('/chat/completions', requestBody, onChunk);

      // 计算成本
      const cost = CostCalculator.calculate(response.usage, requestBody.model);

      return {
        content: response.content,
        usage: response.usage,
        cost,
        metadata: {
          model: requestBody.model,
          responseTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('[OpenAI] Stream generation failed:', error);
      throw this._formatError(error);
    }
  }

  /**
   * 构建请求体
   * @param {String|Array} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Object} 请求体
   * @private
   */
  _buildRequestBody(prompt, options = {}) {
    // 构建消息数组
    const messages = this._buildMessages(prompt, options);

    return {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.maxTokens || this.defaultMaxTokens,
      top_p: options.topP ?? 1.0,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stream: options.stream || false,
      ...(options.stop && { stop: options.stop }),
      ...(options.user && { user: options.user }),
    };
  }

  /**
   * 构建消息数组
   * @param {String|Array} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Array} 消息数组
   * @private
   */
  _buildMessages(prompt, options = {}) {
    // 如果已经是消息数组格式，直接返回
    if (Array.isArray(prompt)) {
      return prompt;
    }

    // 构建单一用户消息
    const messages = [];

    // 添加系统提示（如果有）
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // 添加用户消息
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
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

    const response = await this.app.curl(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      data: body,
      dataType: 'json',
      timeout: this.timeout,
      contentType: 'json',
    });

    if (response.status !== 200) {
      throw this._parseError(response);
    }

    return response.data;
  }

  /**
   * 发送流式请求
   * @param {String} endpoint - API 端点
   * @param {Object} body - 请求体
   * @param {Function} onChunk - 数据块回调
   * @return {Promise<Object>} 完整响应
   * @private
   */
  async _sendStreamRequest(endpoint, body, onChunk) {
    const url = `${this.apiEndpoint}${endpoint}`;
    let fullContent = '';
    let usage = {};

    return new Promise((resolve, reject) => {
      const stream = this.app.httpclient.request(url, {
        method: 'POST',
        headers: this._buildHeaders(),
        data: JSON.stringify(body),
        timeout: this.timeout,
        streaming: true,
      });

      stream.on('data', chunk => {
        const lines = chunk
          .toString()
          .split('\n')
          .filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';

              if (delta) {
                fullContent += delta;
                if (onChunk) {
                  onChunk(delta);
                }
              }

              // 获取 usage 信息（如果有）
              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch (error) {
              this.logger.warn('[OpenAI] Failed to parse stream chunk:', error.message);
            }
          }
        }
      });

      stream.on('end', () => {
        // 估算 token 使用（如果没有提供）
        if (!usage.totalTokens) {
          const promptTokens = TokenCounter.estimate(JSON.stringify(body.messages), body.model);
          const completionTokens = TokenCounter.estimate(fullContent, body.model);
          usage = {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          };
        }

        resolve({
          content: fullContent,
          usage,
        });
      });

      stream.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * 解析响应
   * @param {Object} response - API 响应
   * @return {Object} 解析后的结果
   * @private
   */
  _parseResponse(response) {
    const choice = response.choices?.[0];

    if (!choice) {
      throw new Error('Invalid response from OpenAI API: no choices returned');
    }

    return {
      content: choice.message?.content || '',
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
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
    const error = new Error(response.data?.error?.message || `OpenAI API error: ${response.status}`);

    error.code = response.data?.error?.code || 'OPENAI_API_ERROR';
    error.status = response.status;
    error.type = response.data?.error?.type;

    return error;
  }

  /**
   * 计算成本
   * @param {Object} usage - Token 使用情况
   * @param {String} model - 模型名称
   * @return {Number} 成本（美元）
   */
  calculateCost(usage, model) {
    return CostCalculator.calculate(usage, model);
  }

  /**
   * 估算 Token 数量
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  estimateTokens(text) {
    return TokenCounter.estimateGPT(text);
  }

  /**
   * 验证 API Key
   * @return {Promise<Boolean>} 是否有效
   */
  async validateApiKey() {
    try {
      await this.generate('test', {
        model: 'gpt-3.5-turbo',
        maxTokens: 5,
      });
      return true;
    } catch (error) {
      this.logger.warn('[OpenAI] API Key validation failed:', error.message);
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

      await this.generate('ping', {
        model: 'gpt-3.5-turbo',
        maxTokens: 5,
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
    return ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
  }
}

module.exports = OpenAIAdapter;
