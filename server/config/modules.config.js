/**
 * DoraCMS 模块配置
 *
 * 此文件定义了系统中所有可用的模块及其状态
 * 可以通过修改 enabled 字段来启用/禁用模块
 *
 * 注意：
 * 1. 核心模块不能禁用（enabled 字段无效）
 * 2. 禁用模块时请注意依赖关系（参见 dependencies 字段）
 * 3. 修改后需要重启应用
 * 4. 如果删除此文件，系统将使用默认配置（所有模块启用）
 *
 * 模块分类：
 * - core: 核心模块（系统运行必需，包含后台管理基础功能）
 *   • user: 前台用户管理
 *   • admin: 后台管理员管理
 *   • role: 角色权限管理
 *   • menu: 菜单管理
 *   • systemConfig: 系统配置
 *   • uploadFile: 文件上传
 *   • apiKey: API Key 管理
 *
 * - business: 业务模块（可选，根据需求启用）
 *   • content: 内容管理
 *   • comment: 评论系统
 *   • webhook: 事件通知
 *   • mail: 邮件通知
 *   • ads: 广告管理
 *   • template: 模板管理
 *   • plugin: 插件系统
 *
 * 性能优化：
 * - 禁用不需要的业务模块可以减少内存占用和启动时间
 * - 精简配置（仅核心+内容管理）可减少约 60% 的 Repository 数量
 * - 核心模块（admin、role、menu）是后台管理必需的，不建议禁用
 */

'use strict';

module.exports = {
  // 核心模块（必需，不可禁用）
  core: {
    user: {
      enabled: true,
      name: '用户管理',
      description: '前台用户认证和管理',
      repositories: ['User'],
      dependencies: [],
      // 注意: 用户注册验证和密码重置功能需要 mail 模块
    },
    admin: {
      enabled: true,
      name: '管理员管理',
      description: '后台管理员认证和管理',
      repositories: ['Admin'],
      dependencies: [],
    },
    role: {
      enabled: true,
      name: '角色权限',
      description: '角色和权限管理',
      repositories: ['Role', 'PermissionDefinition'],
      dependencies: ['admin'],
    },
    menu: {
      enabled: true,
      name: '菜单管理',
      description: '导航菜单配置',
      repositories: ['Menu'],
      dependencies: ['admin'],
    },
    systemConfig: {
      enabled: true,
      name: '系统配置',
      description: '系统配置管理',
      repositories: ['SystemConfig', 'SystemOptionLog'],
      dependencies: [],
    },
    uploadFile: {
      enabled: true,
      name: '文件上传',
      description: '文件上传和管理',
      repositories: ['UploadFile'],
      dependencies: [],
    },
    apiKey: {
      enabled: true,
      name: 'API Key',
      description: 'API Key 管理',
      repositories: ['ApiKey'],
      dependencies: ['user'],
    },
    mail: {
      enabled: true,
      name: '邮件通知',
      description: '邮件发送和模板（用户注册验证、密码重置等）',
      repositories: ['MailTemplate'],
      dependencies: [],
      // 注意: user 和 admin 模块的邮件通知功能依赖此模块
    },
  },

  // 业务模块（可选）
  business: {
    content: {
      enabled: true,
      name: '内容管理',
      description: '文章、分类、标签管理',
      repositories: ['Content', 'ContentCategory', 'ContentTag', 'ContentInteraction'],
      dependencies: ['user', 'uploadFile'],
      // 注意: 如果启用 AI 助手插件，AI 相关的 Repository 会自动关联到此模块
      aiRepositories: ['AIModel', 'AIUsageLog', 'PromptTemplate'],
    },
    comment: {
      enabled: true,
      name: '评论系统',
      description: '用户评论和互动',
      repositories: ['Message', 'MessageInteraction'],
      dependencies: ['user', 'content'],
    },
    ads: {
      enabled: true,
      name: '广告管理',
      description: '广告位和广告内容',
      repositories: ['Ads', 'AdsItems'],
      dependencies: [],
    },
    template: {
      enabled: true,
      name: '模板管理',
      description: '主题模板管理',
      repositories: ['Template'],
      dependencies: [],
    },
    webhook: {
      enabled: true,
      name: 'Webhook',
      description: '事件通知和集成',
      repositories: ['Webhook', 'WebhookLog'],
      dependencies: ['user', 'content'],
    },
    plugin: {
      enabled: true,
      name: '插件系统',
      description: '插件管理和扩展',
      repositories: ['Plugin'],
      dependencies: [],
    },
  },
};
