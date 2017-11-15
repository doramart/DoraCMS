import Vue from 'vue'
import VueRouter from 'vue-router'
import Meta from 'vue-meta'

import { ArticleList, CmsCase, Article, AdminLogin, UserLoginForm, UserRegForm, UserCenter, UserMessage, UserReplies, SiteMap } from 'create-route'

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

export function createRouter() {
    const router = new VueRouter({
        mode: 'history',
        //base: __dirname,
        // scrollBehavior,
        routes: [
            { name: 'index', path: '/', component: ArticleList, meta: { typeId: 'indexPage' } },
            { name: 'index', path: '/page/:current(\\d+)?', component: ArticleList, meta: { typeId: 'indexPage' } },
            { name: 'cmscase', path: '/cmscase___:typeId?/:current(\\d+)?', component: CmsCase },
            { name: 'category', path: '/:cate1?___:typeId?/:current(\\d+)?', component: ArticleList },
            { name: 'category', path: '/:cate0/:cate1?___:typeId?/:current(\\d+)?', component: ArticleList },
            { name: 'search', path: '/search/:searchkey/:current(\\d+)?', component: ArticleList, meta: { typeId: 'search' } },
            { name: 'article', path: '/details/:id', component: Article, meta: { notKeepAlive: true } },
            { name: 'login', path: '/users/login', component: UserLoginForm },
            { name: 'reg', path: '/users/reg', component: UserRegForm },
            { name: 'ucenter', path: '/users/center', component: UserCenter },
            { name: 'umessage', path: '/users/messages', component: UserMessage },
            { name: 'uReplies', path: '/users/replies', component: UserReplies },
            { name: 'adminlogin', path: '/dr-admin', component: AdminLogin, meta: { typeId: 'adminlogin' } },
            { name: 'sitemap', path: '/sitemap.html', component: SiteMap },
            { name: 'tagPage', path: '/tag/:tagName/:page(\\d+)?', component: ArticleList, meta: { typeId: 'tags' } }
        ]
    })
    return router;
}

