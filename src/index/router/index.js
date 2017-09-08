import Vue from 'vue'
import VueRouter from 'vue-router'
import Meta from 'vue-meta'

import index from '../views/ArticleList.vue'
import article from '../views/Article.vue'
import adminLogin from '../views/AdminLogin.vue'
import userLoginForm from '../views/UserLoginForm'
import userRegForm from '../views/UserRegForm'
import userCenter from '../views/UserCenter'
import userMessage from '../views/UserMessage'
import userReplies from '../views/UserReplies'
import siteMap from '../views/SiteMap.vue'

Vue.use(VueRouter)
Vue.use(Meta)

const scrollBehavior = to => {
    const position = {}
    if (to.hash) {
        position.selector = to.hash
    }
    if (to.matched.some(mm => mm.meta.scrollToTop)) {
        position.x = 0
        position.y = 0
    }
    return position
}

// const guardRoute = (to, from, next) => {
//     var token = cookies.get('user') || !inBrowser
//     if (!token) {
//         next('/')
//     } else {
//         next()
//     }
// }
export function createRouter() {
    const router = new VueRouter({
        mode: 'history',
        //base: __dirname,
        // scrollBehavior,
        routes: [
            { name: 'index', path: '/', component: index, meta: { typeId: 'indexPage' } },
            { name: 'index', path: '/page/:current(\\d+)?', component: index, meta: { typeId: 'indexPage' } },
            { name: 'category', path: '/:cate1?___:typeId?/:current(\\d+)?', component: index },
            { name: 'category', path: '/:cate0/:cate1?___:typeId?/:current(\\d+)?', component: index },
            { name: 'search', path: '/search/:searchkey/:current(\\d+)?', component: index, meta: { typeId: 'search' } },
            { name: 'article', path: '/details/:id', component: article, meta: { notKeepAlive: true } },
            { name: 'login', path: '/users/login', component: userLoginForm },
            { name: 'reg', path: '/users/reg', component: userRegForm },
            { name: 'ucenter', path: '/users/center', component: userCenter },
            { name: 'umessage', path: '/users/messages', component: userMessage },
            { name: 'uReplies', path: '/users/replies', component: userReplies },
            { name: 'adminlogin', path: '/dr-admin', component: adminLogin, meta: { typeId: 'adminlogin' } },
            { name: 'sitemap', path: '/sitemap.html', component: siteMap },
            { name: 'tagPage', path: '/tag/:tagName/:page(\\d+)?', component: index, meta: { typeId: 'tags' } }
        ]
    })
    return router;
}

