/**
 * 模板自动生成配置
 * Template Auto-Generation Configuration
 */
'use strict';

module.exports = appInfo => {
  return {
    /**
     * 模板自动生成配置
     */
    templateAutoGeneration: {
      // 是否启用自动生成功能
      enabled: true,

      // 安装时的生成策略
      install: {
        generateLayouts: true, // 生成缺失的布局文件
        generateTemplates: true, // 生成模板变体
        generateComponents: false, // 不自动生成组件（避免过度生成）
        overwrite: false, // 不覆盖现有文件
        verbose: false, // 不显示详细日志
      },

      // 更新时的生成策略（更保守）
      update: {
        generateLayouts: true, // 仅生成缺失的布局
        generateTemplates: false, // 不生成模板变体（避免覆盖用户自定义）
        generateComponents: false, // 不生成组件
        overwrite: false, // 绝不覆盖现有文件
        verbose: false,
      },

      // 远程安装的生成策略
      remote: {
        generateLayouts: true,
        generateTemplates: true,
        generateComponents: false,
        overwrite: false,
        verbose: false,
      },

      // 默认内容类型
      contentTypes: [
        'index', // 首页
        'category', // 分类页
        'detail', // 详情页
        'search', // 搜索页
        'tag', // 标签页
        'author', // 作者页
        'archive', // 归档页
      ],

      // 默认布局类型
      layouts: [
        'default', // 默认布局（必需）
        'sidebar', // 侧边栏布局
        'wide', // 宽屏布局
        'minimal', // 极简布局
      ],

      // 生成时机配置
      triggers: {
        onInstall: true, // 安装时触发
        onUpdate: true, // 更新时触发
        onActivate: false, // 激活时不触发（避免性能问题）
        onFirstAccess: false, // 首次访问时不触发（影响用户体验）
      },

      // 生成规则
      rules: {
        // 必需文件列表（缺失时强制生成）
        required: ['layouts/default.html', 'templates/index.html'],

        // 推荐文件列表（缺失时建议生成）
        recommended: [
          'layouts/sidebar.html',
          'templates/category.html',
          'templates/detail.html',
          'components/header.html',
          'components/footer.html',
        ],

        // 跳过生成的文件模式
        skipPatterns: ['**/*.backup', '**/*.tmp', '**/node_modules/**', '**/.git/**'],
      },

      // 生成器配置
      generator: {
        // 模板变量配置
        templateVars: {
          siteName: 'DoraCMS',
          author: 'DoraCMS Team',
          year: new Date().getFullYear(),
        },

        // 样式配置
        styles: {
          framework: 'none', // 样式框架: 'bootstrap', 'tailwind', 'none'
          responsive: true, // 响应式设计
          darkMode: false, // 暗色模式支持
        },

        // 组件配置
        components: {
          includeNavigation: true,
          includeBreadcrumb: true,
          includePagination: true,
          includeSearch: false,
        },
      },

      // 性能配置
      performance: {
        maxConcurrency: 3, // 最大并发生成数
        timeout: 30000, // 生成超时时间（毫秒）
        retryCount: 2, // 失败重试次数
      },

      // 日志配置
      logging: {
        enabled: true,
        level: 'info', // 'debug', 'info', 'warn', 'error'
        logFile: 'logs/template-generation.log',
      },
    },
  };
};
