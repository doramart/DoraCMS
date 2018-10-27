import Vue from 'vue'

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import Element from 'element-ui'
import Axios from 'axios';
import 'element-ui/lib/theme-chalk/index.css'

import '@/styles/index.scss' // global css

import App from './App'
import router from './router'
import store from './store'

import i18n from './lang' // Internationalization
import './icons' // icon
import './permission' // permission control

import * as filters from './filters' // global filters


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

Vue.use(Element, {
    size: Cookies.get('size') || 'medium', // set element-ui default size
    i18n: (key, value) => i18n.t(key, value)
})

// register global utility filters.
Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

new Vue({
    el: '#app',
    router,
    store,
    i18n,
    render: h => h(App)
})
