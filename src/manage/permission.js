import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css'// progress bar style

NProgress.configure({ showSpinner: false })// NProgress Configuration


router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  if (store.getters.roles.length === 0) { // 判断当前用户是否已拉取完user_info信息
    store.dispatch('GetUserInfo').then(res => { // 拉取user_info
      const roles = res.data.roles // note: roles must be a array! such as: ['editor','develop']
      store.dispatch('GenerateRoutes', { roles }).then(() => { // 根据roles权限生成可访问的路由表
        router.addRoutes(store.getters.addRouters) // 动态添加可访问路由表
        next({ ...to, replace: true }) // hack方法 确保addRoutes已完成 ,set the replace: true so the navigation will not leave a history record
      })
    }).catch((err) => {
      store.dispatch('FedLogOut').then(() => {
        Message.error(err || 'Verification failed, please login again')
        next({ path: '/' })
      })
    })
  } else {
    next();
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
