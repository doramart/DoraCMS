import { registerMicroApps } from 'qiankun';

// 向子应用传值（方法，组件等）
const props = {
  hostApp: 'user-center', // 标识当前主应用
  components: {},
};

// 注册微应用
registerMicroApps([
  {
    name: 'ai-content-publish',
    entry: process.env.NODE_ENV === 'production' ? '/static/remote-page/ai-content-publish/' : 'http://localhost:8083',
    container: '#subapp-container',
    activeRule: location => location.pathname.includes('/ai-content-publish'),
    props,
  },
]);
