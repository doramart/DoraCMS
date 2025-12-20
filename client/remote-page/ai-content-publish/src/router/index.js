import { createRouter as createVueRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';

const routes = [
  {
    path: '/',
    name: 'ContentPublish',
    component: () => import('@/views/ContentPublish.vue'),
    meta: { title: 'AI 智能发布', requiresAuth: false },
  },
  {
    path: '/remote-page/ai-content-publish',
    name: 'ContentPublishRemote',
    component: () => import('@/views/ContentPublish.vue'),
    meta: { title: 'AI 智能发布', requiresAuth: false },
  },
  {
    path: '/admin-center/remote-page/ai-content-publish',
    name: 'ContentPublishAdmin',
    component: () => import('@/views/ContentPublish.vue'),
    meta: { title: 'AI 智能发布', requiresAuth: false },
  },
  {
    path: '/user-center/ai-content-publish',
    name: 'ContentPublishUser',
    component: () => import('@/views/ContentPublish.vue'),
    meta: { title: 'AI 智能发布', requiresAuth: false },
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
    // Set page title
    document.title = to.meta.title || import.meta.env.VITE_APP_TITLE || 'AI Content Publish';

    // 检查是否需要认证
    if (to.meta.requiresAuth) {
      // 演示路由守卫：检查是否有权限访问
      const hasPermission = checkPermission();
      if (!hasPermission) {
        ElMessage.warning('This page requires authentication. Redirecting to home...');
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
