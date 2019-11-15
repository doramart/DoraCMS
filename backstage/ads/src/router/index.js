import Vue from 'vue'
import Router from 'vue-router'
import settings from "@root/publicMethods/settings";
import Ads from '@/views/ads'

Vue.use(Router)

const createRouter = () => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior: () => ({
    y: 0
  }),
  routes: [{
    path: settings.admin_base_path + '/ads',
    name: 'ads',
    component: Ads
  }, {
    path: settings.admin_base_path + '/ads/editAds/:id',
    name: 'editAds',
    component: () => import( /* webpackChunkName: "editAds" */ '@/views/ads/infoForm.vue')
  }, {
    path: settings.admin_base_path + '/ads/addAds',
    name: 'addAds',
    component: () => import( /* webpackChunkName: "editAds" */ '@/views/ads/infoForm.vue')
  }]
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router