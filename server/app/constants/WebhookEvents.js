/**
 * Webhook 事件常量定义
 * 定义系统支持的所有 Webhook 事件类型
 */
'use strict';

const WebhookEvents = {
  // ===== 内容相关事件 =====
  CONTENT: {
    CREATED: 'content.created', // 内容创建
    UPDATED: 'content.updated', // 内容更新
    DELETED: 'content.deleted', // 内容删除
    PUBLISHED: 'content.published', // 内容发布
    UNPUBLISHED: 'content.unpublished', // 内容取消发布
  },

  // ===== 用户相关事件 =====
  USER: {
    REGISTERED: 'user.registered', // 用户注册
    UPDATED: 'user.updated', // 用户信息更新
    DELETED: 'user.deleted', // 用户删除
    LOGIN: 'user.login', // 用户登录
    LOGOUT: 'user.logout', // 用户登出
  },

  // ===== 评论相关事件 =====
  COMMENT: {
    CREATED: 'comment.created', // 评论创建
    UPDATED: 'comment.updated', // 评论更新
    DELETED: 'comment.deleted', // 评论删除
    APPROVED: 'comment.approved', // 评论审核通过
    REJECTED: 'comment.rejected', // 评论审核拒绝
  },

  // ===== 留言相关事件 =====
  MESSAGE: {
    CREATED: 'message.created', // 留言创建
    REPLIED: 'message.replied', // 留言回复
    DELETED: 'message.deleted', // 留言删除
  },

  // ===== 系统相关事件 =====
  SYSTEM: {
    ERROR: 'system.error', // 系统错误
    WARNING: 'system.warning', // 系统警告
    MAINTENANCE: 'system.maintenance', // 系统维护
  },
};

/**
 * 获取所有事件列表
 * @return {Array<String>} 所有事件的数组
 */
WebhookEvents.getAllEvents = function () {
  const events = [];
  for (const category of Object.values(WebhookEvents)) {
    if (typeof category === 'object') {
      events.push(...Object.values(category));
    }
  }
  return events;
};

/**
 * 获取事件分类
 * @return {Object} 事件分类对象
 */
WebhookEvents.getCategories = function () {
  return {
    content: Object.values(WebhookEvents.CONTENT),
    user: Object.values(WebhookEvents.USER),
    comment: Object.values(WebhookEvents.COMMENT),
    message: Object.values(WebhookEvents.MESSAGE),
    system: Object.values(WebhookEvents.SYSTEM),
  };
};

/**
 * 验证事件是否有效
 * @param {String} event 事件名称
 * @return {Boolean} 是否有效
 */
WebhookEvents.isValidEvent = function (event) {
  return WebhookEvents.getAllEvents().includes(event);
};

/**
 * 获取事件的分类名称
 * @param {String} event 事件名称
 * @return {String|null} 分类名称
 */
WebhookEvents.getCategoryName = function (event) {
  if (!event || typeof event !== 'string') {
    return null;
  }
  const parts = event.split('.');
  return parts.length > 0 ? parts[0] : null;
};

/**
 * 获取事件的操作名称
 * @param {String} event 事件名称
 * @return {String|null} 操作名称
 */
WebhookEvents.getActionName = function (event) {
  if (!event || typeof event !== 'string') {
    return null;
  }
  const parts = event.split('.');
  return parts.length > 1 ? parts[1] : null;
};

/**
 * 格式化事件名称为可读文本
 * @param {String} event 事件名称
 * @return {String} 可读文本
 */
WebhookEvents.formatEventName = function (event) {
  if (!event) return '';
  return event
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

module.exports = WebhookEvents;
