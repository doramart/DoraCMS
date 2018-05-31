// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './manage/App.vue'
import router from './manage/router'
import ElementUI from 'element-ui'
// 引用三种语言
import zhCN from 'element-ui/lib/locale/lang/zh-CN'
import ja from 'element-ui/lib/locale/lang/ja'
import en from 'element-ui/lib/locale/lang/en'
import './manage/assets/styles/public.css';
import Axios from 'axios';
// 自定义全局组件Loading
import Loading from './manage/components/loading'
import * as filters from './filters'
// 国际化
import VueI18n from 'vue-i18n'
import en_local from './manage/common/lang/en';
import zh_local from './manage/common/lang/zh';
import ja_jp_local from './manage/common/lang/ja_jp';
import store from './manage/store/index.js'
Vue.config.productionTip = false
Vue.use(VueI18n)
Vue.use(ElementUI, { zhCN });
Vue.use(Loading);

// register global utility filters.
Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key])
})

// axios拦截返回，拦截token过期
Axios.interceptors.response.use(function (response) {
    let res = response.data;
    if (res.state === 'error') {
        if (res.err && res.err.indexOf('token') !== -1) {
            store.dispatch("loginState", {
                userInfo: {},
                state: false
            });
        }
        return response;
    }
    return response;
}, function (error) {
    return Promise.reject(error);
});

const i18n = new VueI18n({
    locale: 'zh',  // 语言标识
    messages: {
        'zh': zh_local,
        'ja_jp': ja_jp_local,
        'en': en_local
    }
})

const app = new Vue({
    i18n,
    router,
    store,
    ...App
})

app.$mount('#app')
