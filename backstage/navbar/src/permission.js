import router from './router'
import store from './store'
import {
  Message
} from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import {
  getToken
} from '@root/publicMethods/auth' // get token from cookie
import getPageTitle from '@root/publicMethods/get-page-title'
import settings from '@root/publicMethods/settings'

NProgress.configure({
  showSpinner: false
}) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({
        path: '/'
      })
      NProgress.done()
    } else {

      const hasGetUserInfo = store.getters.name;
      if (hasGetUserInfo) {
        next()
      } else {
        try {
          const hasRoles = store.getters.routes && store.getters.routes.length > 0

          if (hasRoles) {
            next();
          } else {
            // get user info
            await store.dispatch('user/getInfo');
            let accessRoutes = await store.dispatch('user/getResources');
            router.addRoutes(accessRoutes)
            next({
              ...to,
              replace: true
            })
          }
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          window.location.href = `${settings.server_api}${settings.admin_base_path}/login`;
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.

      window.location.href = `${settings.server_api}${settings.admin_base_path}/login?redirect=${to.path}`;
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})