import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import i18n from '@/plugins/i18n';
import _ from 'lodash';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        redirect: '/home',
      },
      {
        path: '/home',
        name: 'UserCenter',
        component: () => import('@/views/user-center/index.vue'),
        meta: { titleKey: 'system.title.userHome' },
      },
      {
        path: '/my-articles',
        name: 'MyArticles',
        component: () => import('@/views/my-articles/index.vue'),
        meta: { titleKey: 'system.title.myArticles' },
      },
      {
        path: '/my-articles/create',
        name: 'CreateArticle',
        component: () => import('@/views/my-articles/components/ArticleEditor.vue'),
        meta: { titleKey: 'system.title.createArticle' },
      },
      {
        path: '/my-articles/edit/:id',
        name: 'EditArticle',
        component: () => import('@/views/my-articles/components/ArticleEditor.vue'),
        meta: { titleKey: 'system.title.editArticle' },
      },
      // AI 内容发布微应用路由
      {
        path: '/ai-content-publish/:pathMatch(.*)*',
        name: 'AIContentPublish',
        component: () => import('@/views/my-articles/components/AIContentPublish.vue'),
        meta: { titleKey: 'system.title.aiContentPublish' },
      },
      {
        path: '/join-comments',
        name: 'JoinComments',
        component: () => import('@/views/join-comments/index.vue'),
        meta: { titleKey: 'system.title.joinComments' },
      },
      {
        path: '/personal-info',
        name: 'PersonalInfo',
        component: () => import('@/views/personal-info/index.vue'),
        meta: { titleKey: 'system.title.personalInfo' },
      },
      {
        path: '/set-password',
        name: 'SetPassword',
        component: () => import('@/views/user/SetPassword.vue'),
        meta: { titleKey: 'system.title.changePassword' },
      },
      {
        path: '/api-key',
        name: 'ApiKey',
        component: () => import('@/views/api-key/index.vue'),
        meta: {
          titleKey: 'system.menu.apiKey',
          icon: 'key',
          permission: 'api_key:manage',
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { titleKey: 'user.auth.login' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { titleKey: 'system.title.register' },
  },
  {
    path: '/confirm-email',
    name: 'ConfirmEmail',
    component: () => import('@/views/ConfirmEmail.vue'),
    meta: { titleKey: 'system.title.forgotPassword' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/change-password/index.vue'),
    meta: { titleKey: 'system.title.resetPassword' },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory('/user-center'),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Set page title with i18n support
  if (to.meta.titleKey) {
    document.title = i18n.global.t(to.meta.titleKey) + ' - ' + i18n.global.t('system.title.userCenter');
  } else {
    document.title = import.meta.env.VITE_APP_TITLE || i18n.global.t('system.title.userCenter');
  }

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register', '/confirm-email', '/reset-password'];
  if (publicRoutes.includes(to.path)) {
    // If already logged in and trying to access login page, redirect to home
    if (to.path === '/login' && userStore.isLoggedIn) {
      next({ path: '/' });
      return;
    }
    next();
    return;
  }

  // For protected routes, verify login status
  if (!userStore.isLoggedIn) {
    next({ path: '/login' });
    return;
  }

  // Fetch user info if logged in
  try {
    const result = await userStore.fetchUserInfo();
    if (!_.isEmpty(result)) {
      next();
    } else {
      userStore.logout();
      next({ path: '/login' });
    }
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    userStore.logout();
    next({ path: '/login' });
  }
});

export default router;
