/**
 * AI Assistant Plugin 默认配置
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const path = require('path');

module.exports = appInfo => {
  const config = {};

  // AI 助手基础配置
  config.aiAssistant = {
    // 是否自动初始化数据库（首次启动时）
    autoInit: true,
    // 插件自身需要放行的后端 API（不走权限链路）
    permissionWhiteList: [],

    // AI 功能是否启用
    enabled: true,

    // 默认提供商
    defaultProvider: 'openai',

    // 全局配置
    global: {
      // 最大重试次数
      maxRetries: 2,
      // 请求超时时间（毫秒）
      timeout: 30000,
      // 默认温度参数
      temperature: 0.7,
      // 默认 Top P 参数
      topP: 1.0,
      // 是否启用降级机制
      enableFallback: true,
    },

    // OpenAI 配置
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      apiEndpoint: 'https://api.openai.com/v1',
      defaultModel: 'gpt-3.5-turbo',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // DeepSeek 配置
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiEndpoint: 'https://api.deepseek.com',
      defaultModel: 'deepseek-chat',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // Ollama 配置（本地部署）
    ollama: {
      apiEndpoint: process.env.OLLAMA_API_ENDPOINT || 'http://localhost:11434',
      defaultModel: 'llama2',
      maxTokens: 4096,
      temperature: 0.7,
    },

    // 任务类型配置
    tasks: {
      title_generation: {
        enabled: true,
        maxLength: 100,
        temperature: 0.8,
      },
      tag_extraction: {
        enabled: true,
        maxTags: 10,
        temperature: 0.5,
      },
      summary_generation: {
        enabled: true,
        maxLength: 300,
        temperature: 0.7,
      },
      category_matching: {
        enabled: true,
        temperature: 0.5,
      },
      seo_optimization: {
        enabled: true,
        temperature: 0.6,
      },
      content_quality_check: {
        enabled: true,
        temperature: 0.5,
      },
    },

    // 使用限制
    limits: {
      // 每日每用户最大调用次数
      maxCallsPerDay: 100,
      // 每小时最大调用次数
      maxCallsPerHour: 20,
      // 单次请求最大 Token 数
      maxTokensPerRequest: 8000,
      // 是否启用限流
      enableRateLimit: true,
    },

    // 缓存配置
    cache: {
      // 是否启用缓存
      enabled: true,
      // 缓存过期时间（秒）
      ttl: 3600,
      // 缓存键前缀
      prefix: 'ai:cache:',
    },

    // 日志配置
    logging: {
      // 是否记录详细日志
      verbose: false,
      // 是否记录原始响应
      logRawResponse: false,
      // 日志保留天数
      retentionDays: 90,
    },

    // 安全配置
    security: {
      // API Key 加密密钥
      encryptionKey: process.env.AI_ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
      // 是否验证用户权限
      requireAuth: true,
      // 允许的用户角色
      allowedRoles: ['admin', 'editor'],
    },

    // 降级策略配置
    fallback: {
      // 是否启用自动降级
      enabled: true,
      // 降级链最大深度
      maxDepth: 3,
      // 降级触发条件
      triggers: {
        // 连续失败次数
        consecutiveFailures: 3,
        // 响应时间阈值（毫秒）
        slowResponseTime: 10000,
        // 成本阈值（元）
        costThreshold: 1.0,
      },
    },

    // 监控和告警
    monitoring: {
      // 是否启用监控
      enabled: true,
      // 性能指标采样率
      sampleRate: 1.0,
      // 告警配置
      alerts: {
        // 错误率告警阈值
        errorRateThreshold: 0.1,
        // 响应时间告警阈值（毫秒）
        responseTimeThreshold: 5000,
        // 成本告警阈值（元/天）
        dailyCostThreshold: 100,
      },
    },
  };

  // 插件静态资源配置
  config.aiAssistantStatic = {
    // 插件静态资源目录（使用 __dirname 获取插件目录）
    dir: path.join(__dirname, '../app/public'),
    // URL 访问前缀
    prefix: '/static/ai-assistant',
    // 是否启用
    enabled: true,
  };

  return config;
};
