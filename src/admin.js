// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './manage/App.vue'
import router from './manage/router'
import ElementUI from 'element-ui'
import '../node_modules/element-ui/lib/theme-chalk/index.css'
import '../node_modules/font-awesome/css/font-awesome.min.css'
import './manage/assets/styles/public.css';
import Axios from 'axios';
// 自定义全局组件Loading
import Loading from './manage/components/loading'
import * as filters from './filters'

import store from './manage/store/index.js'
Vue.config.productionTip = false

Vue.use(ElementUI);
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

const app = new Vue({
    // el: '#a',
    router,
    store,
    ...App
})

app.$mount('#app')
