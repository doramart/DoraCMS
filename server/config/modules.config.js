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
 * 性能优化：
 * - 禁用不需要的模块可以减少内存占用和启动时间
 * - 精简配置（仅核心+内容管理）可减少约 60% 的 Repository 数量
 */

'use strict';

module.exports = {
  // 核心模块（必需，不可禁用）
  core: {
    user: {
      enabled: true,
      name: '用户管理',
      description: '用户认证和管理',
      repositories: ['User'],
      dependencies: [],
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
  },

  // 业务模块（可选）
  business: {
    content: {
      enabled: true,
      name: '内容管理',
      description: '文章、分类、标签管理',
      repositories: ['Content', 'ContentCategory', 'ContentTag', 'ContentInteraction'],
      dependencies: ['user', 'uploadFile'],
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
    mail: {
      enabled: true,
      name: '邮件通知',
      description: '邮件发送和模板',
      repositories: ['MailTemplate'],
      dependencies: [],
    },
    webhook: {
      enabled: true,
      name: 'Webhook',
      description: '事件通知和集成',
      repositories: ['Webhook', 'WebhookLog'],
      dependencies: ['user', 'content'],
    },
    menu: {
      enabled: true,
      name: '菜单管理',
      description: '导航菜单配置',
      repositories: ['Menu'],
      dependencies: [],
    },
    role: {
      enabled: true,
      name: '角色权限',
      description: '角色和权限管理',
      repositories: ['Role', 'Admin', 'PermissionDefinition'],
      dependencies: ['user'],
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
