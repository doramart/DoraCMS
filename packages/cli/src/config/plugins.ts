/**
 * EggJS 插件配置定义
 *
 * 插件分为两类：
 * 1. 核心插件（必需）：系统运行必需的插件，不可禁用
 * 2. 可选插件（可选）：增强功能的插件，用户可以选择是否启用
 */

export interface PluginConfig {
  name: string;
  description: string;
  required: boolean;
  packageName?: string;
  path?: string;
  dependencies?: string[];
  configKey: string; // plugin.js 中的导出键名
}

/**
 * 核心插件（必需，不可禁用）
 */
export const CORE_PLUGINS: Record<string, PluginConfig> = {
  nunjucks: {
    name: 'Nunjucks 模板引擎',
    description: '服务端渲染模板引擎',
    required: true,
    packageName: 'egg-view-nunjucks',
    configKey: 'nunjucks',
  },
  session: {
    name: 'Session 会话',
    description: '用户会话管理',
    required: true,
    configKey: 'session',
  },
  redis: {
    name: 'Redis 缓存',
    description: 'Redis 缓存和会话存储',
    required: true,
    packageName: 'egg-redis',
    configKey: 'redis',
  },
  static: {
    name: '静态资源',
    description: '静态文件服务',
    required: true,
    configKey: 'static',
  },
  doraValidate: {
    name: 'Dora 数据验证',
    description: '数据验证插件',
    required: true,
    packageName: 'egg-dora-validate',
    path: '../lib/plugin/egg-dora-validate',
    configKey: 'doraValidate',
  },
  doraMiddleStage: {
    name: 'Dora 中台管理',
    description: '中台管理功能插件',
    required: true,
    packageName: 'egg-dora-middlestage',
    path: '../lib/plugin/egg-dora-middlestage',
    configKey: 'doraMiddleStage',
  },
  swaggerdoc: {
    name: 'Swagger API 文档',
    description: 'API 文档自动生成',
    required: true,
    packageName: 'egg-swagger-doc',
    configKey: 'swaggerdoc',
  },
};

/**
 * 可选插件（用户可选择是否启用）
 */
export const OPTIONAL_PLUGINS: Record<string, PluginConfig> = {
  aiAssistant: {
    name: 'AI 助手',
    description: 'AI 内容生成和图片生成（支持 OpenAI、DeepSeek、Ollama、豆包）',
    required: false,
    path: '../lib/plugin/egg-ai-assistant',
    configKey: 'aiAssistant',
  },
  // socketio: {
  //   name: 'Socket.IO',
  //   description: 'WebSocket 实时通信',
  //   required: false,
  //   packageName: 'egg-socket.io',
  //   configKey: 'io',
  // },
  // cors: {
  //   name: 'CORS 跨域',
  //   description: '跨域资源共享支持',
  //   required: false,
  //   packageName: 'egg-cors',
  //   configKey: 'cors',
  // },
};

/**
 * 根据项目类型获取推荐的插件配置
 */
export function getRecommendedPlugins(projectType: string): string[] {
  const recommendations: Record<string, string[]> = {
    fullstack: ['aiAssistant'],
    'backend-only': ['aiAssistant'],
    'user-separated': ['aiAssistant'],
    'admin-separated': ['aiAssistant'],
    'mobile-optimized': [],
  };

  return recommendations[projectType] || [];
}

/**
 * 获取插件推荐说明
 */
export function getPluginRecommendationMessage(projectType: string): string {
  const messages: Record<string, string> = {
    fullstack: '推荐启用 AI 助手，增强内容创作和图片生成能力',
    'backend-only': '推荐启用 AI 助手，提供 AI 内容生成 API',
    'user-separated': '推荐启用 AI 助手，增强内容创作能力',
    'admin-separated': '推荐启用 AI 助手，提供完整的 AI 辅助功能',
    'mobile-optimized': 'AI 助手为可选功能，根据需求启用',
  };

  return messages[projectType] || 'AI 助手为可选功能';
}
