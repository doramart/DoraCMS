import { createRouter as createVueRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';
import i18n from '@/plugins/i18n';

const routes = [
  {
    path: '/',
    name: 'ModelList',
    component: () => import('@/views/ModelList.vue'),
    meta: { titleKey: 'system.title.aiModelManage', requiresAuth: false },
  },
  {
    path: '/remote-page/ai-model-manage',
    name: 'ModelListRemote',
    component: () => import('@/views/ModelList.vue'),
    meta: { titleKey: 'system.title.aiModelManage', requiresAuth: false },
  },
  {
    path: '/admin-center/remote-page/ai-model-manage',
    name: 'ModelListMain',
    component: () => import('@/views/ModelList.vue'),
    meta: { titleKey: 'system.title.aiModelManage', requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
  },
];

export function createRouter(baseUrl = '/') {
  const router = createVueRouter({
    history: createWebHistory(baseUrl),
    routes,
  });

  // 路由守卫
  router.beforeEach((to, from, next) => {
    // Set page title with i18n support
    const { t } = i18n.global;
    if (to.meta.titleKey) {
      document.title = t(to.meta.titleKey);
    } else {
      document.title = import.meta.env.VITE_APP_TITLE || 'AI Model Manage';
    }

    // 检查是否需要认证
    if (to.meta.requiresAuth) {
      // 检查是否有权限访问
      const hasPermission = checkPermission();
      if (!hasPermission) {
        ElMessage.warning(t('system.error.authRequired'));
        next({ path: '/dashboard' });
        return;
      }
    }

    next();
  });

  // 路由错误处理
  router.onError(error => {
    console.error('Router error:', error);
    // ElMessage.error('Navigation failed. Please try again.');
  });

  return router;
}

// 模拟权限检查
function checkPermission() {
  // 这里可以检查 token、用户权限等
  // 返回 true 表示有权限，false 表示无权限
  const tokenKey = import.meta.env.VITE_ADMIN_TOKEN_KEY || 'doracms_admin_token';
  const token = localStorage.getItem(tokenKey);
  return !!token;
}

export default createRouter;
