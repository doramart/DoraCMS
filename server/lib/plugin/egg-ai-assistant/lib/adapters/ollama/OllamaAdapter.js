/**
 * Ollama 适配器
 * 支持本地部署的 Ollama 模型
 *
 * Ollama 是开源的本地 LLM 运行框架，支持多种开源模型
 * 优势：
 * - 完全本地运行，无需 API Key
 * - 数据隐私保护
 * - 无使用成本
 * - 支持多种开源模型（Llama 2/3, Mistral, Qwen, etc）
 *
 * @author DoraCMS Team
 * @since 2025-01-12
 */
'use strict';

const BaseAIAdapter = require('../base/BaseAIAdapter');
const TokenCounter = require('../../utils/tokenCounter');

class OllamaAdapter extends BaseAIAdapter {
  /**
   * 构造函数
   * @param {Object} app - Egg Application 实例
   * @param {Object} config - 配置
   */
  constructor(app, config = {}) {
    super(app, config);

    this.provider = 'ollama';
    // Ollama 默认运行在本地 11434 端口
    this.apiEndpoint = config.apiEndpoint || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'qwen2:7b'; // 默认使用 Qwen2 7B
    this.defaultTemperature = config.temperature || 0.7;
    this.defaultMaxTokens = config.maxTokens || 2000;

    // Ollama 特定配置
    this.keepAlive = config.keepAlive || '5m'; // 模型保持加载时间
    this.numCtx = config.numCtx || 2048; // 上下文窗口大小

    // Ollama 不需要 API Key
    this.apiKey = 'ollama-local';

    this.logger.info('[Ollama] Adapter initialized with endpoint:', this.apiEndpoint);
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

      this.logger.debug('[Ollama] Request:', {
        model: requestBody.model,
        messageCount: requestBody.messages?.length || 0,
        temperature: requestBody.options?.temperature,
      });

      // 发送请求
      const response = await this._sendRequest('/api/chat', requestBody);

      // 解析响应
      const result = this._parseResponse(response);

      // Ollama 本地运行，成本为 0
      const cost = 0;

      this.logger.info('[Ollama] Generation successful:', {
        tokens: result.usage.totalTokens,
        time: Date.now() - startTime,
      });

      return {
        content: result.content,
        usage: result.usage,
        cost,
        metadata: {
          model: requestBody.model,
          responseTime: Date.now() - startTime,
          provider: 'ollama',
          local: true,
        },
      };
    } catch (error) {
      this.logger.error('[Ollama] Generation failed:', error);
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

      this.logger.debug('[Ollama] Stream request:', {
        model: requestBody.model,
        messageCount: requestBody.messages?.length || 0,
      });

      // 发送流式请求
      const response = await this._sendStreamRequest('/api/chat', requestBody, onChunk);

      return {
        content: response.content,
        usage: response.usage,
        cost: 0, // 本地运行，无成本
        metadata: {
          model: requestBody.model,
          responseTime: Date.now() - startTime,
          provider: 'ollama',
          local: true,
        },
      };
    } catch (error) {
      this.logger.error('[Ollama] Stream generation failed:', error);
      throw this._formatError(error);
    }
  }

  /**
   * 构建请求体（Ollama 格式）
   * @param {String|Array} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Object} 请求体
   * @private
   */
  _buildRequestBody(prompt, options = {}) {
    // 构建消息数组
    const messages = this._buildMessages(prompt, options);

    const body = {
      model: options.model || this.defaultModel,
      messages,
      stream: options.stream || false,
      options: {
        temperature: options.temperature ?? this.defaultTemperature,
        num_predict: options.maxTokens || this.defaultMaxTokens,
        top_p: options.topP ?? 1.0,
        num_ctx: options.numCtx || this.numCtx,
      },
      keep_alive: options.keepAlive || this.keepAlive,
    };

    // 添加可选参数
    if (options.stop) {
      body.options.stop = options.stop;
    }

    return body;
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

    try {
      const response = await this.app.curl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: body,
        dataType: 'json',
        timeout: this.timeout,
        contentType: 'json',
      });

      if (response.status !== 200) {
        throw this._parseError(response);
      }

      return response.data;
    } catch (error) {
      // 如果是连接错误，提供更友好的错误信息
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const err = new Error(
          'Cannot connect to Ollama server. Please make sure Ollama is running at ' + this.apiEndpoint
        );
        err.code = 'OLLAMA_CONNECTION_ERROR';
        throw err;
      }
      throw error;
    }
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
    let totalTokens = 0;

    return new Promise((resolve, reject) => {
      const stream = this.app.httpclient.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          try {
            const parsed = JSON.parse(line);

            // Ollama 流式响应格式
            if (parsed.message?.content) {
              const delta = parsed.message.content;
              fullContent += delta;

              if (onChunk) {
                onChunk(delta);
              }
            }

            // 检查是否完成
            if (parsed.done) {
              // Ollama 提供的 token 统计
              if (parsed.prompt_eval_count && parsed.eval_count) {
                totalTokens = parsed.prompt_eval_count + parsed.eval_count;
              }
            }
          } catch (error) {
            this.logger.warn('[Ollama] Failed to parse stream chunk:', error.message);
          }
        }
      });

      stream.on('end', () => {
        // 如果没有提供 token 统计，进行估算
        if (totalTokens === 0) {
          const promptTokens = TokenCounter.estimate(JSON.stringify(body.messages));
          const completionTokens = TokenCounter.estimate(fullContent);
          totalTokens = promptTokens + completionTokens;
        }

        resolve({
          content: fullContent,
          usage: {
            promptTokens: 0, // Ollama 不总是提供详细统计
            completionTokens: 0,
            totalTokens,
          },
        });
      });

      stream.on('error', error => {
        // 连接错误处理
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          const err = new Error(
            'Cannot connect to Ollama server. Please make sure Ollama is running at ' + this.apiEndpoint
          );
          err.code = 'OLLAMA_CONNECTION_ERROR';
          reject(err);
        } else {
          reject(error);
        }
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
    if (!response.message?.content) {
      throw new Error('Invalid response from Ollama API: no content returned');
    }

    // Ollama 响应格式
    const content = response.message.content;
    const promptTokens = response.prompt_eval_count || 0;
    const completionTokens = response.eval_count || 0;

    return {
      content,
      finishReason: response.done ? 'stop' : 'unknown',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
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
    const error = new Error(response.data?.error || `Ollama API error: ${response.status}`);

    error.code = 'OLLAMA_API_ERROR';
    error.status = response.status;

    return error;
  }

  /**
   * 计算成本（Ollama 本地运行，无成本）
   * @param {Object} usage - Token 使用情况
   * @param {String} model - 模型名称
   * @return {Number} 成本（美元）
   */
  calculateCost(usage, model) {
    return 0; // 本地运行，无成本
  }

  /**
   * 估算 Token 数量
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  estimateTokens(text) {
    return TokenCounter.estimate(text);
  }

  /**
   * 验证连接（Ollama 不需要 API Key）
   * @return {Promise<Boolean>} 是否可用
   */
  async validateApiKey() {
    try {
      // 尝试获取模型列表来验证连接
      await this._listModels();
      return true;
    } catch (error) {
      this.logger.warn('[Ollama] Connection validation failed:', error.message);
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

      // 尝试列出模型
      const models = await this._listModels();

      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        provider: this.provider,
        responseTime,
        models: models.map(m => m.name),
        stats: this.getStats(),
        endpoint: this.apiEndpoint,
      };
    } catch (error) {
      return {
        healthy: false,
        provider: this.provider,
        error: error.message,
        stats: this.getStats(),
        endpoint: this.apiEndpoint,
      };
    }
  }

  /**
   * 获取可用的模型列表
   * @return {Promise<Array>} 模型列表
   */
  async listModels() {
    return await this._listModels();
  }

  /**
   * 列出本地已下载的模型
   * @return {Promise<Array>} 模型列表
   * @private
   */
  async _listModels() {
    const url = `${this.apiEndpoint}/api/tags`;

    try {
      const response = await this.app.curl(url, {
        method: 'GET',
        dataType: 'json',
        timeout: 10000,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      return response.data.models || [];
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Ollama server. Please make sure Ollama is running at ' + this.apiEndpoint);
      }
      throw error;
    }
  }

  /**
   * 拉取（下载）模型
   * @param {String} modelName - 模型名称
   * @param {Function} onProgress - 进度回调
   * @return {Promise<Object>} 下载结果
   */
  async pullModel(modelName, onProgress) {
    const url = `${this.apiEndpoint}/api/pull`;

    return new Promise((resolve, reject) => {
      const stream = this.app.httpclient.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ name: modelName }),
        streaming: true,
      });

      let lastStatus = '';

      stream.on('data', chunk => {
        const lines = chunk
          .toString()
          .split('\n')
          .filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);

            if (parsed.status) {
              lastStatus = parsed.status;

              if (onProgress) {
                onProgress({
                  status: parsed.status,
                  progress: parsed.completed || 0,
                  total: parsed.total || 0,
                });
              }
            }
          } catch (error) {
            this.logger.warn('[Ollama] Failed to parse pull progress:', error.message);
          }
        }
      });

      stream.on('end', () => {
        resolve({
          success: true,
          model: modelName,
          status: lastStatus,
        });
      });

      stream.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * 删除模型
   * @param {String} modelName - 模型名称
   * @return {Promise<Object>} 删除结果
   */
  async deleteModel(modelName) {
    const url = `${this.apiEndpoint}/api/delete`;

    const response = await this.app.curl(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { name: modelName },
      dataType: 'json',
    });

    if (response.status !== 200) {
      throw new Error(`Failed to delete model: ${response.status}`);
    }

    return {
      success: true,
      model: modelName,
    };
  }

  /**
   * 获取推荐的模型列表
   * @return {Array<Object>} 推荐模型
   */
  getRecommendedModels() {
    return [
      {
        name: 'qwen2:7b',
        description: '阿里通义千问 2，支持中文，7B 参数',
        size: '4.4 GB',
        recommended: true,
      },
      {
        name: 'llama3:8b',
        description: 'Meta Llama 3，通用模型，8B 参数',
        size: '4.7 GB',
        recommended: true,
      },
      {
        name: 'mistral:7b',
        description: 'Mistral 7B，高性能开源模型',
        size: '4.1 GB',
        recommended: false,
      },
      {
        name: 'gemma:7b',
        description: 'Google Gemma，轻量级模型',
        size: '5.0 GB',
        recommended: false,
      },
    ];
  }
}

module.exports = OllamaAdapter;
