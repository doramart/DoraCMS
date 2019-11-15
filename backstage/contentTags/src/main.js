import './set-public-path'
import Vue from 'vue';

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import ElementUI from 'element-ui'

import '@/styles/index.scss' // global css

import App from './App.vue';
import router from './router/index';
import store from './store'
import singleSpaVue from 'single-spa-vue';


import './icons' // icon
import i18n from './lang' // Internationalization
import * as filters from './filters' // global filters

Vue.config.productionTip = false;


Vue.use(ElementUI, {
  size: Cookies.get('size') || 'medium', // set element-ui default size
  i18n: (key, value) => i18n.t(key, value)
})

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

const vueLifecycles = singleSpaVue({
  Vue,
  appOptions: {
    render: (h) => h(App),
    router,
    store,
    i18n
  },
});

export const bootstrap = [
  vueLifecycles.bootstrap,
];

export function mount(props) {
  return vueLifecycles.mount(props);
}

export const unmount = [
  vueLifecycles.unmount,
];