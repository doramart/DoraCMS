import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './styles/main.scss';
import i18n from './plugins/i18n';
import './qiankun'; // 导入 qiankun 配置

const app = createApp(App);
const pinia = createPinia();

app.use(ElementPlus, {
  locale: zhCn,
});
app.use(router);
app.use(pinia);
app.use(i18n);

app.mount('#app');
