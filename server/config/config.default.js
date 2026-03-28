'use strict';
const path = require('path');
const fs = require('fs');
const defaultConfig = require('./ext/config');
const envConfig = require('./env');

module.exports = appInfo => {
  const config = {};

  // 应用密钥 - 使用环境变量
  config.keys = envConfig.SECURITY.APP_KEYS;

  config.cluster = {
    listen: {
      port: envConfig.PORT,
      hostname: envConfig.HOSTNAME,
    },
    workers: envConfig.WORKERS, // Worker 进程数量，通过环境变量 EGG_WORKERS 配置，默认 1
  };

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: envConfig.CORS.DOMAIN_WHITELIST,
  };

  config.cors = {
    origin: envConfig.CORS.ORIGINS,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  };

  config.session = {
    key: 'DORA_SESS',
    maxAge: 30 * 24 * 3600 * 1000, // 30 days - 与JWT token保持一致
    httpOnly: true,
    encrypt: true,
    renew: true, // 延长会话有效期
    sameSite: 'lax', // 改为lax以支持跨域场景
  };

  config.adminInit = {
    token: envConfig.SECURITY.ADMIN_INIT_TOKEN,
    localOnly: envConfig.SECURITY.ADMIN_INIT_LOCAL_ONLY,
  };

  // 前台会员登录有效时间
  config.userMaxAge = 30 * 24 * 3600 * 1000; // 30 days - 与JWT token保持一致

  // 后台管理员登录有效时间
  config.adminUserMaxAge = 30 * 24 * 3600 * 1000; // 30 days - 与JWT token保持一致

  // 设置网站图标
  config.siteFile = {
    '/favicon.ico': fs.readFileSync(path.join(appInfo.baseDir, 'app/public/favicon.ico')),
  };

  config.permission = {
    registryFiles: [path.join(appInfo.baseDir, 'app/permission/definitions/manage.js')],
    cacheTTL: 5 * 60 * 1000,
    strictMenuBinding: true,
    whiteList: {
      routes: [
        'v1/admins/login',
        'v1/admins/logout',
        'v1/admins/me',
        'v1/admins/me/routes',
        'v1/admins/init',
        'v1/admins/init/status',
        'singleUser/*',
      ],
    },
    hotReload: {
      enabled: envConfig.getBoolEnv('PERMISSION_HOT_RELOAD_ENABLED', true),
      interval: envConfig.getNumberEnv('PERMISSION_HOT_RELOAD_INTERVAL', 5000),
    },
  };

  // 模块裁剪（模板生成项目使用，源码默认关闭）
  config.modulePrune = {
    enabled: envConfig.getBoolEnv('MODULE_PRUNE_ENABLED', false),
  };

  // 配置需要的中间件,数组顺序即为中间件的加载顺序
  config.middleware = [
    'requestId', // 请求追踪 ID 中间件 - 必须在最前面
    'apiVersion', // API 版本管理中间件 - 在 errorHandler 之后
    'errorHandler', // 统一错误处理中间件 - 需要在最前面
    'errorLogger', // 🔥 统一日志系统：错误日志中间件 - 自动捕获异常
    'apiVersionLogger', // API版本标识中间件 - 需要在最前面执行
    'accessLogger', // 🔥 统一日志系统：访问日志中间件 - 自动记录API请求
    'crossHeader',
    'localeDetector',
    'compress',
    'authUserToken',
    'authAdminToken',
    'authAdminPower',
    'spaFallback', // SPA 回退中间件 - 处理微前端路由
    'notfoundHandler', // 移到最后，并使用正确的文件名
  ];

  // API 版本管理配置
  config.apiVersion = {
    // 默认 API 版本
    defaultVersion: 'v1',

    // 支持的 API 版本列表
    supportedVersions: ['v1'],

    // 是否严格模式（不支持的版本返回 400）
    strictMode: false,

    // 版本提取正则表达式
    versionPattern: /^\/api\/(v\d+)\//,

    // 请求头字段名
    headerField: 'API-Version',
  };

  // Swagger API 文档配置
  config.swaggerdoc = {
    dirScanner: './app/controller',
    apiInfo: {
      title: 'DoraCMS API Documentation',
      description: `
# DoraCMS RESTful API 文档 - 应用底座平台

## 认证方式

### 1. JWT Token 认证（Bearer）
用于前端用户和管理员认证，在请求头中添加：
\`\`\`
Authorization: Bearer {your_jwt_token}
\`\`\`

### 2. API Key 认证
用于第三方应用和服务端集成，需要同时提供以下请求头：

#### 基本认证头
\`\`\`
X-API-Key: {your_api_key}
X-API-Secret: {your_api_secret}
X-API-Timestamp: {unix_timestamp_in_milliseconds}
X-API-Signature: {hmac_sha256_signature}
\`\`\`

#### 签名生成方法
使用 HMAC-SHA256 算法生成签名：
\`\`\`javascript
const crypto = require('crypto');

// 1. 构造签名字符串
const signString = \`\${apiKey}:\${timestamp}:\${method}:\${path}\`;

// 2. 使用 API Secret 生成 HMAC-SHA256 签名
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(signString)
  .digest('hex');
\`\`\`

#### 示例（Node.js）
\`\`\`javascript
const crypto = require('crypto');
const axios = require('axios');

const apiKey = 'ak_1234567890abcdef';
const apiSecret = 'sk_1234567890abcdef1234567890abcdef';
const timestamp = Date.now();
const method = 'GET';
const path = '/api/v1/content';

// 生成签名
const signString = \`\${apiKey}:\${timestamp}:\${method}:\${path}\`;
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(signString)
  .digest('hex');

// 发送请求
const response = await axios.get('https://api.example.com/api/v1/content', {
  headers: {
    'X-API-Key': apiKey,
    'X-API-Secret': apiSecret,
    'X-API-Timestamp': timestamp,
    'X-API-Signature': signature,
  },
});
\`\`\`

更多详细信息请参考 [API Key 使用指南](../docs/api-key-guide.md)

## API 版本管理
支持通过 URL 路径或请求头指定 API 版本：
- URL 路径：\`/api/v1/...\`
- 请求头：\`API-Version: v1\`

## 响应格式
所有 API 响应遵循统一格式：
\`\`\`json
{
  "status": 200,
  "data": {},
  "message": "",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
\`\`\`
      `,
      version: '3.0.0',
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      // JWT 认证
      Bearer: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT Token 认证，格式：Bearer {token}',
      },
      // API Key 认证
      ApiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key（公开部分）',
      },
      // API Secret
      ApiSecret: {
        type: 'apiKey',
        name: 'X-API-Secret',
        in: 'header',
        description: 'API Secret（私密部分）',
      },
      // API 时间戳
      ApiTimestamp: {
        type: 'apiKey',
        name: 'X-API-Timestamp',
        in: 'header',
        description: 'Unix 时间戳（毫秒）',
      },
      // API 签名
      ApiSignature: {
        type: 'apiKey',
        name: 'X-API-Signature',
        in: 'header',
        description: 'HMAC-SHA256 签名',
      },
    },
    enableSecurity: true,
    // 路由前缀
    routerMap: true,
    enable: true,
  };

  // gzip压缩
  config.compress = {
    threshold: 2048,
  };

  // ==================== 统一日志系统配置 ====================

  // 访问日志中间件配置
  config.accessLogger = {
    // 是否启用访问日志（建议：开发环境false，生产环境true）
    // 临时启用以验证日志系统功能
    enabled: true, // 已临时启用以验证功能，生产环境建议: envConfig.NODE_ENV === 'production'

    // 排除的路径（不记录这些路径的访问日志）
    excludePaths: [
      '/health', // 健康检查
      '/ping', // ping检测
      '/favicon.ico', // 网站图标
      '/robots.txt', // 爬虫协议
    ],

    // 排除的路径模式（正则表达式）
    excludePatterns: [
      /^\/public\//, // 静态资源
      /^\/static\//, // 静态文件
      /^\/uploads\//, // 上传文件
      /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i, // 静态资源文件
    ],

    // 是否只记录慢请求（true=只记录慢请求，false=记录所有请求）
    // 临时设置为false以记录所有请求用于验证
    logSlowRequests: envConfig.NODE_ENV === 'production', // 生产环境建议: envConfig.NODE_ENV === 'production'

    // 慢请求阈值（毫秒）- 响应时间超过此值才记录
    slowRequestThreshold: 1000, // 1秒

    // 是否记录请求体（敏感数据会自动脱敏）
    // 注意：记录请求体会增加日志大小，建议生产环境关闭
    logRequestBody: envConfig.NODE_ENV !== 'production',

    // 采样率（0-1之间，1表示100%记录）
    // 高流量场景下可以降低采样率以减少日志量
    samplingRate: 1.0,
  };

  // 错误日志中间件配置
  config.errorLogger = {
    // 是否启用错误日志（建议：始终启用）
    enabled: true,

    // 是否记录错误堆栈（建议：开发环境true，生产环境false）
    logStackTrace: envConfig.NODE_ENV !== 'production',

    // 是否在严重错误时发送通知（邮件、钉钉、短信等）
    notifyOnCritical: envConfig.NODE_ENV === 'production',

    // 严重错误的HTTP状态码列表
    criticalStatusCodes: [500, 502, 503, 504],

    // 通知配置（当notifyOnCritical=true时生效）
    notification: {
      // 邮件通知
      email: {
        enabled: false,
        recipients: ['admin@example.com'],
      },
      // 钉钉通知
      dingtalk: {
        enabled: false,
        webhook: '',
      },
      // 企业微信通知
      wecom: {
        enabled: false,
        webhook: '',
      },
      // 短信通知
      sms: {
        enabled: false,
        phones: [],
      },
    },
  };

  // 日志系统全局配置
  config.systemLog = {
    // 是否启用自动清理
    autoCleanup: true,

    // 清理计划（cron表达式：每天凌晨3点）
    cleanupSchedule: '0 3 * * *',

    // 各类型日志保留天数
    retentionDays: {
      exception: 90, // 异常日志保留90天
      error: 90, // 错误日志保留90天
      operation: 180, // 操作日志保留180天
      login: 90, // 登录日志保留90天
      logout: 90, // 登出日志保留90天
      access: 30, // 访问日志保留30天
      info: 30, // 信息日志保留30天
      debug: 7, // 调试日志保留7天
      warning: 60, // 警告日志保留60天
    },

    // 日志归档配置
    archive: {
      enabled: true,
      // 归档的日志类型
      types: ['exception', 'error', 'operation', 'login', 'logout', 'warning'],
      // 归档路径（相对于项目根目录）
      path: 'logs/archive',
      // 归档格式（zip, tar.gz）
      format: 'zip',
      // 是否删除归档后的原始日志
      deleteAfterArchive: true,
    },

    // 敏感数据脱敏配置
    dataMasking: {
      enabled: true,
      // 自定义敏感字段（会自动脱敏）
      customSensitiveFields: [
        // 默认已包含：password, token, apiKey, secret, creditCard等
        // 可以在这里添加项目特有的敏感字段
        'userPassword',
        'adminPassword',
        'privateKey',
      ],
    },

    // 性能监控配置
    performance: {
      // 是否启用性能监控
      enabled: true,
      // 慢操作阈值（毫秒）
      slowOperationThreshold: 3000, // 3秒
      // 是否记录慢操作
      logSlowOperations: true,
    },
  };

  // 会员中心权限校验
  config.authPage = {
    threshold: 1024, // 小于 1k 的响应体不压缩
  };

  // nunjucks模板引擎
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.html': 'nunjucks',
    },
    defaultExtension: '.html',
  };

  // 国际化
  config.i18n = {
    defaultLocale: 'en-US',
    queryField: 'locale',
    cookieField: 'locale',
    supportedLocales: ['zh-CN', 'en-US'],
  };

  config.localeDetector = {
    supportedLocales: ['zh-CN', 'en-US'],
    cookieField: 'locale',
  };

  // cdn域名 - 使用环境变量
  config.origin = envConfig.EXTERNAL.CDN_ORIGIN;
  // 系统服务提供商 - 使用环境变量
  config.doracms_api = envConfig.EXTERNAL.API_DOMAIN;
  // 模板文件目录
  config.temp_static_forder = process.cwd() + '/app/public/themes/';
  config.temp_view_forder = process.cwd() + '/app/view/';
  config.temp_locales_forder = process.cwd() + '/config/locale/';

  // 加密解密 - 使用环境变量
  config.session_secret = envConfig.SECURITY.SESSION_SECRET;
  config.auth_cookie_name = envConfig.SECURITY.AUTH_COOKIE_NAME;
  config.encrypt_key = envConfig.SECURITY.ENCRYPT_KEY;
  config.jwtSecret = envConfig.SECURITY.JWT_SECRET || envConfig.SECURITY.ENCRYPT_KEY;
  // JWT token 过期时间 - 使用环境变量
  config.jwtExpiresIn = envConfig.SECURITY.JWT_EXPIRES_IN;

  // Repository/Adapter 模式配置
  config.repository = {
    // 数据库类型：mongodb | mariadb
    databaseType: envConfig.REPOSITORY.DATABASE_TYPE,

    // 是否启用 Repository 模式（默认关闭，逐步迁移）
    enabled: envConfig.REPOSITORY.ENABLED,

    // Repository 缓存配置
    cache: {
      enabled: true,
      maxSize: 1000, // 最大缓存 Repository 实例数量
      ttl: 60 * 60 * 1000, // 缓存生存时间（毫秒）
    },

    // 数据转换配置
    transformer: {
      // 是否启用主键映射（id <-> id）
      enablePrimaryKeyMapping: true,

      // 是否启用时间字段格式化
      enableTimeFormatting: true,

      // 时间格式
      timeFormat: 'YYYY-MM-DD HH:mm:ss',

      // 是否保留原始字段（向后兼容）
      keepOriginalFields: true,
    },

    // 支持的实体列表（用于动态注册）
    supportedEntities: [
      'SystemConfig',
      'User',
      'Admin',
      'Content',
      'ContentTemplate',
      'TemplateItem',
      // ... 其他实体
    ],

    // MongoDB 特定配置
    mongodb: {
      // 是否使用现有的 Mongoose 连接
      useExistingConnection: true,

      // 查询优化
      optimization: {
        lean: true, // 默认使用 lean 查询
        populate: true, // 启用关联查询
      },
    },

    // MariaDB 特定配置
    mariadb: {
      // Sequelize 配置
      sequelize: {
        dialect: 'mysql',
        host: envConfig.MARIADB.HOST,
        port: envConfig.MARIADB.PORT,
        database: envConfig.MARIADB.DATABASE,
        username: envConfig.MARIADB.USERNAME,
        password: envConfig.MARIADB.PASSWORD,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        logging: false, // 生产环境关闭 SQL 日志
      },

      // 表前缀
      tablePrefix: envConfig.MARIADB.TABLE_PREFIX,

      // 字符集
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  };

  // 安全性校验
  config.security = {
    csrf: {
      enable: false,
    },
  };

  // 确保 notfound_handler 的配置正确
  config.notfoundHandler = {
    match: ['/*'], // 可以根据需要调整匹配规则
  };

  // api跨域
  config.crossHeader = {
    enable: true,
    match: ctx => {
      return ctx.path.startsWith('/api') || ctx.path.startsWith('/manage');
    },
    origins: envConfig.CORS.ORIGINS,
  };

  // 后台token校验
  config.authAdminToken = {
    match: ['/manage', '/admin'],
  };

  // 后台权限校验
  config.authAdminPower = {
    match: ['/manage'],
  };

  // 前台用户校验
  config.authUserToken = {
    ignore: ['/manage', '/user-center'],
  };

  // 文件上传
  config.multipart = {
    mode: 'stream',
    fileSize: '5mb',
    whitelist: ['.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip'],
    fileExtensions: ['.doc', '.docx'],
  };

  config.doraUploadFile = {
    uploadFileFormat: {
      upload_path: process.cwd() + '/app/public',
      static_root_path: 'cms', // 针对云存储可设置
    },
  };

  // doraMiddleStagePluginBegin
  config.doraMiddleStageRouter = {
    match: [ctx => ctx.path.startsWith('/manage/singleUser')],
  };
  // doraMiddleStagePluginEnd

  config.aiAssistant = {
    autoInit: true, // 自动初始化
  };

  // CONFIG_NORMALPLUGIN_END

  // EGGCONFIGDEFAULT
  Object.assign(config, defaultConfig);

  // mongoose 配置 - 使用环境变量
  config.mongoose = {
    client: {
      url: envConfig.MONGODB.URL,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
  };

  // redis 配置 - 使用环境变量
  if (envConfig.REDIS.HOST) {
    config.redis = {
      client: {
        port: envConfig.REDIS.PORT,
        host: envConfig.REDIS.HOST,
        password: envConfig.REDIS.PASSWORD || '',
        db: envConfig.REDIS.DB,
      },
    };
  }

  // 🎨 模板自动生成配置
  const templateAutoGenerationConfig = require('./template-auto-generation')(appInfo);
  Object.assign(config, templateAutoGenerationConfig);

  // 缓存配置 - 支持环境变量配置
  config.cache = {
    type: envConfig.getEnv('CACHE_TYPE', 'memory'), // 'redis' 或 'memory'
    defaultTTL: envConfig.getNumberEnv('CACHE_DEFAULT_TTL', 3600),
    maxSize: envConfig.getNumberEnv('MEMORY_CACHE_MAX_SIZE', 1000),
    namespace: envConfig.getEnv('CACHE_NAMESPACE', `${appInfo.name}:${envConfig.NODE_ENV}`),
    watch: {
      enabled: envConfig.getBoolEnv('CACHE_WATCH_ENABLED', true),
      channel: envConfig.getEnv('CACHE_WATCH_CHANNEL', 'unified-cache:watch'),
      broadcastValue: envConfig.getBoolEnv('CACHE_WATCH_BROADCAST_VALUE', true),
    },
  };

  // Webhook 配置
  config.webhook = {
    // 队列并发数
    concurrency: envConfig.getNumberEnv('WEBHOOK_CONCURRENCY', 5),
    // 默认超时时间（毫秒）
    defaultTimeout: envConfig.getNumberEnv('WEBHOOK_DEFAULT_TIMEOUT', 10000),
    // 默认重试配置
    defaultRetryConfig: {
      maxRetries: envConfig.getNumberEnv('WEBHOOK_MAX_RETRIES', 3),
      retryDelay: envConfig.getNumberEnv('WEBHOOK_RETRY_DELAY', 1000),
    },
    // 用户 Webhook 数量限制
    maxWebhooksPerUser: envConfig.getNumberEnv('WEBHOOK_MAX_PER_USER', 50),
    // 日志保留天数
    logRetentionDays: envConfig.getNumberEnv('WEBHOOK_LOG_RETENTION_DAYS', 90),
  };

  return config;
};
