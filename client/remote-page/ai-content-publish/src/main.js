import { createApp } from 'vue';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/es/helper';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import { createRouter } from './router';
import { createPinia } from 'pinia';
// import './style.css'; // 移除这个文件，它的全局样式会覆盖 Element Plus
import './styles/main.scss';
import i18n, { persistLocalePreference } from './plugins/i18n';

let app;
let removeLocaleListener;
const LOCALE_EVENT = 'app:locale-changed';

// qiankun 生命周期函数
renderWithQiankun({
  mount(props) {
    render(props);
  },
  bootstrap() {},
  unmount() {
    if (app) {
      app.unmount();
    }
    if (removeLocaleListener) {
      removeLocaleListener();
      removeLocaleListener = null;
    }
  },
  update() {},
});

// 独立运行时
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
}

// 渲染页面
function render(props) {
  const { container, hostApp, locale: hostLocale, onGlobalStateChange, ...otherProps } = props;

  // 根据运行环境确定 baseUrl
  let baseUrl;
  const isQiankunEnv = qiankunWindow.__POWERED_BY_QIANKUN__;

  if (isQiankunEnv) {
    // 在 qiankun 中运行，使用相对路径
    baseUrl = '/';
  } else {
    // 独立运行，检查当前路径
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/static/remote-page/ai-content-publish/')) {
      // 通过静态资源访问
      baseUrl = '/static/remote-page/ai-content-publish/';
    } else {
      // 开发环境独立运行
      baseUrl = '/';
    }
  }

  const router = createRouter(baseUrl);
  const pinia = createPinia();

  // 防止子应用路由初始化时触发主应用路由变化
  router.isReady();

  if (removeLocaleListener) {
    removeLocaleListener();
    removeLocaleListener = null;
  }

  app = createApp(App);
  app.use(pinia); // pinia 必须先于其他插件安装
  app.use(router);
  app.use(ElementPlus, {
    locale: zhCn,
  });
  app.use(i18n);
  removeLocaleListener = setupLocaleBridge({
    initialLocale: hostLocale,
    onGlobalStateChange,
  });

  // 【核心】初始化应用配置，必须在 pinia 安装之后
  import('@/stores/app-config').then(({ useAppConfigStore }) => {
    const appConfigStore = useAppConfigStore();
    appConfigStore.initConfig({
      hostApp: hostApp || 'standalone', // 从 props 获取主应用标识
      isQiankunEnv,
      hostConfig: otherProps,
    });
  });

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  // 主应用全局组件
  if (props.components) {
    Object.keys(props.components).forEach(key => {
      app.component(key, props.components[key]);
    });
  }

  const dom = container ? container.querySelector('#app') : document.getElementById('app');
  app.mount(dom);
}

function setupLocaleBridge({ initialLocale, onGlobalStateChange } = {}) {
  let currentLocale = i18n.global.locale.value || 'zh-CN';
  persistLocalePreference(currentLocale);

  const applyLocale = lang => {
    if (!lang || lang === currentLocale) {
      return;
    }
    currentLocale = lang;
    i18n.global.locale.value = lang;
    persistLocalePreference(lang);
  };

  if (initialLocale) {
    applyLocale(initialLocale);
  }

  const cleanups = [];

  if (typeof onGlobalStateChange === 'function') {
    const unsubscribe = onGlobalStateChange((state = {}) => {
      if (state.locale) {
        applyLocale(state.locale);
      }
    }, true);
    cleanups.push(unsubscribe);
  }

  if (typeof window !== 'undefined') {
    const handler = event => {
      applyLocale(event.detail);
    };
    window.addEventListener(LOCALE_EVENT, handler);
    cleanups.push(() => window.removeEventListener(LOCALE_EVENT, handler));
  }

  return () => {
    cleanups.forEach(fn => {
      if (typeof fn === 'function') {
        fn();
      }
    });
  };
}
