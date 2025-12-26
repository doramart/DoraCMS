/**
 * 应用配置 Store
 * 用于管理微应用的运行环境配置
 * @description 支持在不同主应用（admin-center, user-center）中运行时的配置适配
 */
import { defineStore } from 'pinia';

/**
 * 主应用类型定义
 * @typedef {'admin-center' | 'user-center' | 'standalone'} HostAppType
 */

/**
 * API 路径前缀配置
 * 根据不同的主应用，使用不同的 API 路径前缀
 */
const API_PREFIX_MAP = {
  'admin-center': '/manage', // admin-center 使用 /manage 前缀
  'user-center': '/api', // user-center 使用 /api 前缀
  standalone: '/api', // 独立运行时默认使用 /api 前缀
};

export const useAppConfigStore = defineStore('app-config', {
  state: () => ({
    /**
     * 当前运行的主应用类型
     * @type {HostAppType}
     */
    hostApp: 'standalone',

    /**
     * 是否在 qiankun 环境中运行
     * @type {boolean}
     */
    isQiankunEnv: false,

    /**
     * 主应用传递的额外配置
     * @type {Object}
     */
    hostConfig: {},
  }),

  getters: {
    /**
     * 获取当前环境的 API 路径前缀
     * @returns {string} API 路径前缀
     */
    apiPrefix: state => {
      return API_PREFIX_MAP[state.hostApp] || API_PREFIX_MAP.standalone;
    },

    /**
     * 判断是否在 admin-center 中运行
     * @returns {boolean}
     */
    isAdminCenter: state => state.hostApp === 'admin-center',

    /**
     * 判断是否在 user-center 中运行
     * @returns {boolean}
     */
    isUserCenter: state => state.hostApp === 'user-center',

    /**
     * 判断是否独立运行
     * @returns {boolean}
     */
    isStandalone: state => state.hostApp === 'standalone',

    /**
     * 获取环境描述信息（用于调试）
     * @returns {string}
     */
    envInfo: state => {
      return `Host: ${state.hostApp}, Qiankun: ${state.isQiankunEnv}, API Prefix: ${API_PREFIX_MAP[state.hostApp]}`;
    },
  },

  actions: {
    /**
     * 初始化应用配置
     * @param {Object} config - 配置对象
     * @param {HostAppType} config.hostApp - 主应用类型
     * @param {boolean} config.isQiankunEnv - 是否在 qiankun 环境中
     * @param {Object} config.hostConfig - 主应用传递的额外配置
     */
    initConfig(config = {}) {
      this.hostApp = config.hostApp || 'standalone';
      this.isQiankunEnv = config.isQiankunEnv || false;
      this.hostConfig = config.hostConfig || {};

      console.log('[App Config] Initialized:', {
        hostApp: this.hostApp,
        apiPrefix: this.apiPrefix,
        isQiankunEnv: this.isQiankunEnv,
      });
    },

    /**
     * 转换 API 路径
     * @param {string} url - 原始 URL
     * @returns {string} 转换后的 URL
     * @description 将 /manage/* 或 /api/* 路径转换为当前环境对应的路径
     */
    transformApiUrl(url) {
      if (!url || typeof url !== 'string') {
        return url;
      }

      // 🔥 排除不需要转换的接口 (v1 API 不需要转换)
      const excludedPaths = ['/api/v1/contentCategory/getList', '/api/v1/contentTag/getList',
                              '/api/v1/categories', '/api/v1/tags'];

      if (excludedPaths.some(path => url.startsWith(path))) {
        return url;
      }

      // 检查 URL 是否以 /manage 或 /api 开头
      if (url.startsWith('/manage/')) {
        // 如果当前在 user-center，替换为 /api
        if (this.isUserCenter) {
          return url.replace('/manage/', '/api/');
        }
      } else if (url.startsWith('/api/')) {
        // 如果当前在 admin-center，替换为 /manage
        if (this.isAdminCenter) {
          return url.replace('/api/', '/manage/');
        }
      }

      return url;
    },

    /**
     * 重置配置为默认值
     */
    resetConfig() {
      this.hostApp = 'standalone';
      this.isQiankunEnv = false;
      this.hostConfig = {};
    },
  },
});
