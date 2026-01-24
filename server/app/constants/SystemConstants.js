/*
 * @Author: Claude Code
 * @Date: 2024-08-17
 * @Description: 系统常量定义
 * 统一管理系统中使用的各种常量，避免硬编码
 */

'use strict';

/**
 * 系统常量定义
 * 包含状态、权限、用户、分页等各种常量
 */
const SYSTEM_CONSTANTS = {
  // ==================== 通用状态常量 ====================
  STATUS: {
    ENABLED: '1', // 启用
    DISABLED: '0', // 禁用
    DELETED: '-1', // 已删除
    PENDING: '2', // 待审核
  },

  // 状态文本映射
  STATUS_TEXT: {
    1: '启用',
    0: '禁用',
    '-1': '已删除',
    2: '待审核',
  },

  // Boolean状态文本映射（用于使用true/false作为状态的模块）
  BOOLEAN_STATUS_TEXT: {
    true: '启用',
    false: '禁用',
  },

  // ==================== 内容相关常量 ====================
  CONTENT: {
    // 内容状态
    STATUS: {
      DRAFT: '0', // 草稿
      PENDING: '1', // 待审核
      PUBLISHED: '2', // 已发布
      OFFLINE: '3', // 已下架
    },

    // 内容状态文本映射
    STATUS_TEXT: {
      0: '草稿',
      1: '待审核',
      2: '已发布',
      3: '已下架',
    },
  },

  // ==================== 权限相关常量 ====================
  PERMISSION: {
    // 菜单层级
    ROOT_PARENT_ID: '0', // 根级菜单的父ID
    ROOT_PARENT_ID_NUMBER: 0, // 根级菜单的父ID
    MAX_PAGE_SIZE: 9999, // 最大菜单数量
    // 菜单类型
    MENU_TYPE: {
      DIRECTORY: '1', // 目录
      MENU: '2', // 菜单
      BUTTON: '3', // 按钮
    },

    // 菜单类型文本
    MENU_TYPE_TEXT: {
      1: '目录',
      2: '菜单',
      3: '按钮',
    },

    // 默认菜单图标
    DEFAULT_MENU_ICON: 'icon-menu-default',

    // 权限操作类型
    ACTION_TYPE: {
      CREATE: 'create', // 创建
      READ: 'read', // 读取
      UPDATE: 'update', // 更新
      DELETE: 'delete', // 删除
      IMPORT: 'import', // 导入
      EXPORT: 'export', // 导出
    },
  },

  // ==================== 用户相关常量 ====================
  USER: {
    // 性别
    GENDER: {
      MALE: '1', // 男
      FEMALE: '2', // 女
      UNKNOWN: '0', // 未知
    },

    // 性别文本
    GENDER_TEXT: {
      1: '男',
      2: '女',
      0: '未知',
    },

    // 默认头像
    DEFAULT_AVATAR: 'https://cdn.html-js.cn/cms/upload/images/default-avatar.png',

    // 账户状态
    ACCOUNT_STATUS: {
      NORMAL: '1', // 正常
      LOCKED: '0', // 锁定
      EXPIRED: '-1', // 过期
    },

    // 用户状态文本映射
    STATUS_TEXT: {
      0: '已删除',
      1: '正常',
    },

    // 用户类型
    USER_TYPE: {
      ADMIN: 'admin', // 管理员
      USER: 'user', // 普通用户
      GUEST: 'guest', // 访客
    },

    // 密码强度要求
    PASSWORD_RULES: {
      MIN_LENGTH: 6, // 最小长度
      MAX_LENGTH: 50, // 最大长度
      REQUIRE_UPPERCASE: false, // 是否需要大写字母
      REQUIRE_LOWERCASE: false, // 是否需要小写字母
      REQUIRE_NUMBERS: false, // 是否需要数字
      REQUIRE_SYMBOLS: false, // 是否需要特殊符号
    },
  },

  // ==================== 角色相关常量 ====================
  ROLE: {
    // 角色类型
    ROLE_TYPE: {
      SYSTEM: 'system', // 系统角色
      CUSTOM: 'custom', // 自定义角色
    },

    // 默认角色
    DEFAULT_ROLES: {
      SUPER_ADMIN: 'super_admin', // 超级管理员
      ADMIN: 'admin', // 管理员
      USER: 'user', // 普通用户
    },

    // 角色状态
    ROLE_STATUS: {
      ACTIVE: '1', // 激活
      INACTIVE: '0', // 非激活
    },
  },

  // ==================== 分页相关常量 ====================
  PAGINATION: {
    DEFAULT_PAGE: 1, // 默认页码
    DEFAULT_PAGE_SIZE: 15, // 默认每页数量
    MAX_PAGE_SIZE: 100, // 最大每页数量
    MIN_PAGE_SIZE: 1, // 最小每页数量
  },

  // ==================== 文件上传相关常量 ====================
  UPLOAD: {
    // 允许的图片格式
    IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],

    // 允许的文档格式
    DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],

    // 最大文件大小 (5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024,

    // 上传状态
    UPLOAD_STATUS: {
      PENDING: 'pending', // 待上传
      UPLOADING: 'uploading', // 上传中
      SUCCESS: 'success', // 成功
      FAILED: 'failed', // 失败
    },
  },

  // ==================== 日志相关常量 ====================
  LOG: {
    // 日志级别
    LEVEL: {
      ERROR: 'error', // 错误
      WARN: 'warn', // 警告
      INFO: 'info', // 信息
      DEBUG: 'debug', // 调试
    },

    // 操作类型
    OPERATION_TYPE: {
      LOGIN: 'login', // 登录
      LOGOUT: 'logout', // 登出
      CREATE: 'create', // 创建
      UPDATE: 'update', // 更新
      DELETE: 'delete', // 删除
      VIEW: 'view', // 查看
      EXPORT: 'export', // 导出
      IMPORT: 'import', // 导入
    },
  },

  // ==================== 数据库相关常量 ====================
  DATABASE: {
    // 数据库类型
    TYPE: {
      MONGODB: 'mongodb', // MongoDB
      MARIADB: 'mariadb', // MariaDB
      MYSQL: 'mysql', // MySQL
      POSTGRESQL: 'postgresql', // PostgreSQL
    },

    // 连接状态
    CONNECTION_STATUS: {
      CONNECTED: 'connected', // 已连接
      DISCONNECTED: 'disconnected', // 已断开
      CONNECTING: 'connecting', // 连接中
      ERROR: 'error', // 错误
    },
  },

  // ==================== 缓存相关常量 ====================
  CACHE: {
    // 缓存键前缀
    PREFIX: {
      USER: 'user:', // 用户缓存
      ROLE: 'role:', // 角色缓存
      MENU: 'menu:', // 菜单缓存
      PERMISSION: 'permission:', // 权限缓存
      SESSION: 'session:', // 会话缓存
    },

    // 缓存过期时间（秒）
    TTL: {
      SHORT: 300, // 5分钟
      MEDIUM: 1800, // 30分钟
      LONG: 3600, // 1小时
      VERY_LONG: 86400, // 24小时
    },
  },

  // ==================== API相关常量 ====================
  API: {
    // API版本
    VERSION: {
      V1: 'v1',
      V2: 'v2',
    },

    // 响应状态码
    STATUS_CODE: {
      SUCCESS: 200, // 成功
      CREATED: 201, // 已创建
      BAD_REQUEST: 400, // 请求错误
      UNAUTHORIZED: 401, // 未授权
      FORBIDDEN: 403, // 禁止访问
      NOT_FOUND: 404, // 未找到
      SERVER_ERROR: 500, // 服务器错误
    },

    // 响应消息
    MESSAGE: {
      SUCCESS: '操作成功',
      CREATED: '创建成功',
      UPDATED: '更新成功',
      DELETED: '删除成功',
      NOT_FOUND: '记录不存在',
      UNAUTHORIZED: '未授权访问',
      FORBIDDEN: '权限不足',
      BAD_REQUEST: '请求参数错误',
      SERVER_ERROR: '服务器内部错误',
    },
  },

  // ==================== 时间相关常量 ====================
  TIME: {
    // 时间格式
    FORMAT: {
      DATE: 'YYYY-MM-DD', // 日期格式
      TIME: 'HH:mm:ss', // 时间格式
      DATETIME: 'YYYY-MM-DD HH:mm:ss', // 日期时间格式
      TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS', // 时间戳格式
    },

    // 时区
    TIMEZONE: {
      BEIJING: 'Asia/Shanghai', // 北京时间
      UTC: 'UTC', // UTC时间
    },
  },

  // ==================== 邮件相关常量 ====================
  MAIL: {
    // 邮件模板类型
    TEMPLATE_TYPE: {
      GENERAL: 'general', // 通用模板
      WELCOME: 'welcome', // 欢迎邮件
      NOTIFICATION: 'notification', // 通知邮件
      PROMOTION: 'promotion', // 推广邮件
      SYSTEM: 'system', // 系统邮件
      NEWSLETTER: 'newsletter', // 新闻邮件
      VERIFICATION: 'verification', // 验证邮件
      PASSWORD_RESET: 'password_reset', // 密码重置
      INVOICE: 'invoice', // 发票邮件
      REMINDER: 'reminder', // 提醒邮件
    },

    // 邮件模板类型数组（用于验证）
    VALID_TEMPLATE_TYPES: [
      'general',
      'welcome',
      'notification',
      'promotion',
      'system',
      'newsletter',
      'verification',
      'password_reset',
      'invoice',
      'reminder',
    ],

    // 邮件模板类型文本映射
    TEMPLATE_TYPE_TEXT: {
      general: '通用模板',
      welcome: '欢迎邮件',
      notification: '通知邮件',
      promotion: '推广邮件',
      system: '系统邮件',
      newsletter: '新闻邮件',
      verification: '验证邮件',
      password_reset: '密码重置',
      invoice: '发票邮件',
      reminder: '提醒邮件',
    },

    // 邮件状态
    STATUS: {
      DRAFT: 'draft', // 草稿
      ACTIVE: 'active', // 激活
      INACTIVE: 'inactive', // 非激活
      ARCHIVED: 'archived', // 归档
    },

    // 邮件优先级
    PRIORITY: {
      LOW: 'low', // 低优先级
      NORMAL: 'normal', // 正常优先级
      HIGH: 'high', // 高优先级
      URGENT: 'urgent', // 紧急
    },

    // 业务场景邮件类型映射（替代硬编码的数字字符串）
    BUSINESS_TYPES: {
      PASSWORD_RESET: 'password_reset', // 密码重置邮件 (替代 '0')
      MESSAGE_NOTIFICATION: 'notification', // 消息通知邮件 (替代 '6')
      VERIFICATION_CODE: 'verification', // 验证码邮件 (替代 '8')
      BULK_EMAIL: 'newsletter', // 邮件群发 (替代 '-1')
    },

    // 邮件发送状态
    DELIVERY_STATUS: {
      PENDING: '0', // 待发送
      INCOMPLETE: '1', // 未完成
      SUCCESS: '2', // 发送成功
    },

    // 邮件发送状态文本映射
    DELIVERY_STATUS_TEXT: {
      0: '待发送',
      1: '未完成',
      2: '发送成功',
    },

    // 发送日志状态文本映射
    SEND_LOG_STATUS_TEXT: {
      0: '发送失败',
      1: '发送成功',
    },

    // 静态邮件模板（数据库缺失时的保底配置）
    STATIC_TEMPLATES: {
      password_reset: [
        {
          comment: '找回密码',
          title: '通过加密链接重置密码',
          subTitle: '找回密码',
          type: 'password_reset',
          content: `<h2><strong>重置密码</strong></h2>
<p>您好，{{email}}：</p>
<p>请点击下方链接重置您的密码：</p>
<p><a href="{{siteDomain}}/user-center/reset-password?key={{token}}" target="">
  <span style="color: rgb(225, 60, 57);">点击重置密码</span>
</a></p>
<p>如果无法点击，请将链接复制到浏览器打开：</p>
<p>{{siteDomain}}/user-center/reset-password?key={{token}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      notification: [
        {
          comment: '留言通知',
          title: '有人给您留言啦！！！',
          subTitle: '留言通知',
          type: 'notification',
          content: `<p><strong>留言通知</strong></p>
<h2>您有新的留言回复</h2>
<p><strong>{{message_author_userName}}</strong> 于 <strong>{{message_sendDate}}</strong><br>
在文章「<strong>{{message_content_title}}</strong>」中回复了您。</p>
<p>查看详情：{{siteDomain}}/details/{{message_content_id}}.html</p>
<p>感谢您的参与，欢迎继续交流。</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      reminder: [
        {
          comment: '提醒通知',
          title: '提醒您关注的重要事项',
          subTitle: '提醒通知',
          type: 'reminder',
          content: `<p><strong>提醒通知</strong></p>
<h2>{{title}}</h2>
<p>{{content}}</p>
<p>感谢您的关注，祝您生活愉快。</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      verification: [
        {
          comment: '邮箱验证码',
          title: '请查收您的邮箱验证码',
          subTitle: '发送验证码',
          type: 'verification',
          content: `<p><strong>邮箱验证码</strong></p>
<p>您正在注册 <span style="color: rgb(225, 60, 57);"><strong>{{siteName}}</strong></span> 账号。</p>
<p>本次验证码为：<span style="color: rgb(225, 60, 57);"><strong>{{msgCode}}</strong></span></p>
<p>验证码有效期内请勿泄露，如非本人操作请忽略本邮件。</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      general: [
        {
          comment: '通用模板',
          title: '站点通知',
          subTitle: '通用通知',
          type: 'general',
          content: `<h2>{{title}}</h2>
<p>{{content}}</p>
<p>如需帮助，请访问 {{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      welcome: [
        {
          comment: '欢迎邮件',
          title: '欢迎加入 {{siteName}}',
          subTitle: '欢迎邮件',
          type: 'welcome',
          content: `<h2>欢迎加入 {{siteName}}</h2>
<p>您好，{{userName}}：</p>
<p>感谢注册并使用我们的服务，祝您使用愉快。</p>
<p>访问站点：{{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      promotion: [
        {
          comment: '推广邮件',
          title: '最新活动上线',
          subTitle: '推广邮件',
          type: 'promotion',
          content: `<h2>{{title}}</h2>
<p>{{content}}</p>
<p>立即查看：{{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      system: [
        {
          comment: '系统邮件',
          title: '系统通知',
          subTitle: '系统邮件',
          type: 'system',
          content: `<h2>系统通知</h2>
<p>{{content}}</p>
<p>如需帮助，请访问 {{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      newsletter: [
        {
          comment: '新闻邮件',
          title: '{{title}}',
          subTitle: '新闻邮件',
          type: 'newsletter',
          content: `<h2>{{title}}</h2>
<p>{{content}}</p>
<p>更多内容：{{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
      invoice: [
        {
          comment: '发票邮件',
          title: '发票通知',
          subTitle: '发票邮件',
          type: 'invoice',
          content: `<h2>发票通知</h2>
<p>发票编号：{{invoiceNo}}</p>
<p>金额：{{amount}}</p>
<p>到期日期：{{dueDate}}</p>
<p>如需帮助，请访问 {{siteDomain}}</p>
<p>&copy; 2025-present {{siteDomain}} All rights reserved.</p>`,
        },
      ],
    },
  },

  // ==================== API Key相关常量 ====================
  API_KEY: {
    // API Key状态
    STATUS: {
      ACTIVE: 'active', // 激活
      DISABLED: 'disabled', // 禁用
    },

    // API Key状态文本映射
    STATUS_TEXT: {
      active: '激活',
      disabled: '禁用',
    },
  },

  // ==================== 系统配置相关常量 ====================
  SYSTEM_CONFIG: {
    // 公开状态文本映射
    PUBLIC_STATUS_TEXT: {
      true: '公开',
      false: '私有',
    },
    // 受保护的系统配置键（禁止删除）
    PROTECTED_KEYS: [
      'siteName',
      'siteLogo',
      'siteDomain',
      'siteEmail',
      'siteEmailServer',
      'siteEmailPwd',
      'siteKeywords',
      'siteDiscription',
      'statisticalCode',
      'siteAltKeywords',
      'showImgCode',
      'registrationNo',
    ],
  },

  // ==================== 系统操作日志相关常量 ====================
  SYSTEM_OPTION_LOG: {
    // 日志类型
    TYPE: {
      LOGIN: 'login', // 登录
      LOGOUT: 'logout', // 登出
      EXCEPTION: 'exception', // 异常
      OPERATION: 'operation', // 操作
      ACCESS: 'access', // 访问
      ERROR: 'error', // 错误
      WARNING: 'warning', // 警告
      INFO: 'info', // 信息
      DEBUG: 'debug', // 调试
    },

    // 操作类型文本映射
    TYPE_TEXT: {
      login: '登录',
      logout: '登出',
      exception: '异常',
      operation: '操作',
      access: '访问',
      error: '错误',
      warning: '警告',
      info: '信息',
      debug: '调试',
    },

    // 严重程度
    SEVERITY: {
      LOW: 'low', // 低
      MEDIUM: 'medium', // 中
      HIGH: 'high', // 高
      CRITICAL: 'critical', // 严重
    },

    // 严重程度文本映射
    SEVERITY_TEXT: {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重',
    },

    // 用户类型
    USER_TYPE: {
      ADMIN: 'admin', // 管理员
      USER: 'user', // 普通用户
      GUEST: 'guest', // 访客
      SYSTEM: 'system', // 系统
    },

    // 用户类型文本映射
    USER_TYPE_TEXT: {
      admin: '管理员',
      user: '普通用户',
      guest: '访客',
      system: '系统',
    },

    // 环境类型
    ENVIRONMENT: {
      DEVELOPMENT: 'development',
      STAGING: 'staging',
      PRODUCTION: 'production',
    },

    // 客户端平台
    PLATFORM: {
      WEB: 'web',
      MOBILE: 'mobile',
      DESKTOP: 'desktop',
      API: 'api',
    },

    // 操作动作
    ACTION: {
      CREATE: 'create', // 创建
      UPDATE: 'update', // 更新
      DELETE: 'delete', // 删除
      READ: 'read', // 查看
      IMPORT: 'import', // 导入
      EXPORT: 'export', // 导出
      APPROVE: 'approve', // 审核通过
      REJECT: 'reject', // 审核拒绝
      ENABLE: 'enable', // 启用
      DISABLE: 'disable', // 禁用
      INSTALL: 'install', // 安装
      UNINSTALL: 'uninstall', // 卸载
    },

    // 操作动作文本映射
    ACTION_TEXT: {
      create: '创建',
      update: '更新',
      delete: '删除',
      read: '查看',
      import: '导入',
      export: '导出',
      approve: '审核通过',
      reject: '审核拒绝',
      enable: '启用',
      disable: '禁用',
      install: '安装',
      uninstall: '卸载',
    },

    // 业务模块
    MODULE: {
      ADMIN: 'admin',
      USER: 'user',
      ROLE: 'role',
      MENU: 'menu',
      CONTENT: 'content',
      TEMPLATE: 'template',
      PLUGIN: 'plugin',
      API_KEY: 'apiKey',
      SYSTEM_CONFIG: 'systemConfig',
      FILE: 'file',
      MAIL: 'mail',
    },

    // 默认保留天数
    RETENTION_DAYS: {
      EXCEPTION: 90,
      ERROR: 90,
      OPERATION: 180,
      LOGIN: 90,
      LOGOUT: 90,
      ACCESS: 30,
      INFO: 30,
      DEBUG: 7,
      WARNING: 60,
    },
  },

  // ==================== 验证相关常量 ====================
  VALIDATION: {
    // 正则表达式
    REGEX: {
      EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // 邮箱
      PHONE: /^1[3-9]\d{9}$/, // 手机号
      USERNAME: /^[a-zA-Z0-9_]{3,20}$/, // 用户名
      PASSWORD: /^.{6,50}$/, // 密码
      URL: /^https?:\/\/[^\s]+$/, // URL
      IP: /^(\d{1,3}\.){3}\d{1,3}$/, // IP地址
    },

    // 字段长度限制
    LENGTH: {
      USERNAME: { MIN: 3, MAX: 20 }, // 用户名长度
      PASSWORD: { MIN: 6, MAX: 50 }, // 密码长度
      EMAIL: { MIN: 5, MAX: 100 }, // 邮箱长度
      PHONE: { MIN: 11, MAX: 11 }, // 手机号长度
      NAME: { MIN: 1, MAX: 50 }, // 姓名长度
      DESCRIPTION: { MIN: 0, MAX: 500 }, // 描述长度
    },
  },
};

// 冻结常量对象，防止被修改
Object.freeze(SYSTEM_CONSTANTS);

// 递归冻结所有嵌套对象
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && typeof obj[prop] === 'object') {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

deepFreeze(SYSTEM_CONSTANTS);

module.exports = SYSTEM_CONSTANTS;
