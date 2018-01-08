import Vue from 'vue'
import VueRouter from 'vue-router'
import Meta from 'vue-meta'

import { ArticleList, CmsCase, Article, AdminLogin, UserLoginForm, UserRegForm, UserCenter, UserPwd, UserMessage, UserReplies, UserAddContent, UserContents, SiteMap } from 'create-route'

Vue.use(VueRouter)
Vue.use(Meta)

const scrollBehavior = (to, from, savedPosition) => {
    if (savedPosition) {
        // savedPosition is only available for popstate navigations.
        return savedPosition
    } else {
        const position = {}
        // new navigation.
        // scroll to anchor by returning the selector
        if (to.hash) {
            position.selector = to.hash
        }
        // check if any matched route config has meta that requires scrolling to top
        if (to.matched.some(m => m.meta.scrollToTop)) {
            // cords will be used if no selector is provided,
            // or if the selector didn't match any element.
            position.x = 0
            position.y = 0
        }
        // if the returned position is falsy or an empty object,
        // will retain current scroll position.
        return position
    }
}

export function createRouter() {
    const router = new VueRouter({
        mode: 'history',
        scrollBehavior,
        routes: [
            { name: 'index', path: '/', component: ArticleList, meta: { typeId: 'indexPage', scrollToTop: true } },
            { name: 'index', path: '/page/:current(\\d+)?', component: ArticleList, meta: { typeId: 'indexPage', scrollToTop: true } },
            { name: 'cmscase', path: '/cmscase___:typeId?/:current(\\d+)?', component: CmsCase },
            { name: 'category', path: '/:cate1?___:typeId?/:current(\\d+)?', component: ArticleList, meta: { scrollToTop: true } },
            { name: 'category', path: '/:cate0/:cate1?___:typeId?/:current(\\d+)?', component: ArticleList, meta: { scrollToTop: true } },
            { name: 'search', path: '/search/:searchkey/:current(\\d+)?', component: ArticleList, meta: { typeId: 'search', scrollToTop: true } },
            { name: 'article', path: '/details/:id', component: Article, meta: { notKeepAlive: true, scrollToTop: true } },
            { name: 'login', path: '/users/login', component: UserLoginForm },
            { name: 'reg', path: '/users/reg', component: UserRegForm },
            { name: 'ucenter', path: '/users/center', component: UserCenter },
            { name: 'upassword', path: '/users/password', component: UserPwd },
            { name: 'umessage', path: '/users/messages', component: UserMessage },
            { name: 'uReplies', path: '/users/replies', component: UserReplies },
            { name: 'uAddContent', path: '/users/addContent', component: UserAddContent },
            { name: 'ueditContent', path: '/users/editContent/:id', component: UserAddContent },
            { name: 'userContents', path: '/users/contents', component: UserContents },
            { name: 'adminlogin', path: '/dr-admin', component: AdminLogin, meta: { typeId: 'adminlogin' } },
            { name: 'sitemap', path: '/sitemap.html', component: SiteMap },
            { name: 'tagPage', path: '/tag/:tagName/:current(\\d+)?', component: ArticleList, meta: { typeId: 'tags', scrollToTop: true } }
        ]
    })
    return router;
}

