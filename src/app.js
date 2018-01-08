// import Vue from './utils/ele-vue'
import Vue from 'vue'
import App from './index/App.vue'
import { createStore } from './index/store'
import { createRouter } from './index/router'
import { sync } from 'vuex-router-sync'
import * as filters from './filters'
import titleMixin from './mixins'
import ElementUI from 'element-ui'
import Header from './index/components/header'
import Footer from './index/components/Footer'

Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key])
})

Vue.mixin(titleMixin)
Vue.use(ElementUI)

const preFetchComponent = [
    Header,
    Footer
]
export function createApp() {
    const router = createRouter()
    const store = createStore()
    sync(store, router)
    const app = new Vue({
        router,
        store,
        ...App
    })
    return { app, router, store, preFetchComponent }
}
