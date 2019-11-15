import Vue from 'vue'
import Router from 'vue-router'
import settings from "@root/publicMethods/settings";
import Content from '@/views/content'

Vue.use(Router)

const createRouter = () => new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior: () => ({
    y: 0
  }),
  routes: [{
    path: settings.admin_base_path + '/content',
    name: 'content',
    component: Content
  }, {
    path: settings.admin_base_path + '/content/addContent',
    name: 'addContent',
    component: () => import( /* webpackChunkName: "addContent" */ '@/views/content/contentForm.vue')
  }, {
    path: settings.admin_base_path + '/content/editContent/:id',
    name: 'editContent',
    component: () => import( /* webpackChunkName: "editContent" */ '@/views/content/contentForm.vue')
  }]
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router