'use strict';

/**
 * 将业务模块与初始化数据里的菜单/权限做映射
 * 仅用于启动时按模块裁剪初始化数据
 */

module.exports = {
  content: {
    menus: [
      // 文档管理（目录 + 细分菜单）
      'document',
      'document_content-category',
      'document_content',
      'document_content-tag',
      'document_content-message',
      // AI 助手相关菜单（依赖 content 模块）
      'remote-page_ai-content-publish',
      'remote-page_ai-model-manage',
    ],
    permissionPrefixes: ['content.', 'categories.', 'tags.'],
  },
  comment: {
    menus: ['document_content-message'],
    permissionPrefixes: ['messages.'],
  },
  ads: {
    menus: ['manage_ads'],
    permissionPrefixes: ['ads.'],
  },
  template: {
    menus: ['extend_template-config'],
    permissionPrefixes: ['templates.'],
  },
  webhook: {
    menus: ['manage_webhook'],
    permissionPrefixes: ['webhooks.'],
  },
  plugin: {
    menus: ['extend_plugin'],
    permissionPrefixes: ['plugins.'],
  },
};
