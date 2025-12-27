/**
 * 模块预设配置
 */

export interface ModulePreset {
  required: string[];
  optional: string[];
  description: string;
}

export const MODULE_PRESETS: Record<string, ModulePreset> = {
  // 完整全栈项目 - 推荐全部启用
  fullstack: {
    required: ['content', 'comment', 'mail', 'webhook', 'menu', 'role'],
    optional: ['ads', 'template', 'plugin'],
    description: '完整功能，适合学习和企业使用',
  },

  // 纯后端 API - 推荐核心功能
  'backend-only': {
    required: ['content', 'webhook'],
    optional: ['comment', 'mail', 'role'],
    description: 'Headless CMS，适合移动端和第三方集成',
  },

  // 前后端分离 - 用户端 - 推荐内容和互动
  'user-separated': {
    required: ['content', 'comment', 'mail'],
    optional: ['webhook', 'menu'],
    description: '博客和社区应用',
  },

  // 前后端分离 - 管理端 - 推荐全部启用
  'admin-separated': {
    required: ['content', 'comment', 'mail', 'webhook', 'menu', 'role'],
    optional: ['ads', 'template', 'plugin'],
    description: '企业内容管理系统',
  },

  // 移动端适配 - 推荐轻量化
  'mobile-optimized': {
    required: ['content', 'comment'],
    optional: ['mail', 'webhook'],
    description: 'H5 和移动端应用',
  },
};

export function getProjectTypeName(type: string): string {
  const names: Record<string, string> = {
    fullstack: '完整全栈项目',
    'backend-only': 'Headless CMS',
    'user-separated': '博客/社区',
    'admin-separated': '企业管理系统',
    'mobile-optimized': '移动端应用',
  };
  return names[type] || type;
}
