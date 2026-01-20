import { registerMicroApps } from 'qiankun';
import { useTabStore } from '@/store/modules/tab';
import { initialLocale } from './actions';
// import HeaderView from '../components/header-view'

// 向子应用传值（方法，组件等，只要是对象，key 名无要求）
const props = {
  hostApp: 'admin-center', // 标识当前主应用
  locale: initialLocale,
  components: {
    // HeaderView
  },
  closeTab: () => {
    const tabStore = useTabStore();
    tabStore.removeActiveTab();
  }
};

registerMicroApps([
  // {
  //   name: 'demo1',
  //   entry: process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '/demo1/',
  //   container: '#subapp-container',
  //   activeRule: location => location.pathname.startsWith('/remote-page/demo1'),
  //   props
  // },
  {
    name: 'ai-model-manage',
    entry: import.meta.env.MODE !== 'prod' ? 'http://localhost:8082' : '/static/remote-page/ai-model-manage/',
    container: '#subapp-container',
    activeRule: location => location.pathname.includes('/remote-page/ai-model-manage'),
    props
  },
  {
    name: 'ai-content-publish',
    entry: import.meta.env.MODE !== 'prod' ? 'http://localhost:8083' : '/static/remote-page/ai-content-publish/',
    container: '#subapp-container',
    activeRule: location => location.pathname.includes('/remote-page/ai-content-publish'),
    props
  }
]);
