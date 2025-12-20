<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="logo">
        <Logo />
      </div>
      <div class="nav">
        <el-button link type="info" size="small" @click="goToHome">{{ t('system.menu.home') }}</el-button>
      </div>
      <div class="user-info">
        <el-dropdown>
          <span class="user-dropdown">
            {{ userInfo.userName }}
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/home')">{{ t('system.menu.profile') }}</el-dropdown-item>
              <el-dropdown-item @click="handleLogout">{{ t('system.menu.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <el-aside width="220px" class="layout-aside">
        <el-menu
          default-active="1"
          class="el-menu-vertical"
          :router="true"
          :unique-opened="false"
          :default-openeds="['2', '3']"
        >
          <el-menu-item index="/home">
            <el-icon><home-filled /></el-icon>
            <span>{{ t('system.menu.userHome') }}</span>
          </el-menu-item>

          <el-sub-menu index="2">
            <template #title>
              <el-icon><notebook /></el-icon>
              <span>{{ t('system.menu.content') }}</span>
            </template>
            <el-menu-item index="/my-articles">
              <el-icon><document /></el-icon>
              <span>{{ t('system.menu.myArticles') }}</span>
            </el-menu-item>
            <el-menu-item index="/join-comments">
              <el-icon><chat-round /></el-icon>
              <span>{{ t('system.menu.joinComments') }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="3">
            <template #title>
              <el-icon><user /></el-icon>
              <span>{{ t('system.menu.account') }}</span>
            </template>
            <el-menu-item index="/personal-info">
              <el-icon><setting /></el-icon>
              <span>{{ t('system.menu.personalInfo') }}</span>
            </el-menu-item>
            <el-menu-item index="/set-password">
              <el-icon><key /></el-icon>
              <span>{{ t('system.menu.changePassword') }}</span>
            </el-menu-item>
            <el-menu-item index="/api-key">
              <el-icon><Operation /></el-icon>
              <span>{{ t('system.menu.apiKey') }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-main class="layout-main">
        <el-card class="layout-card">
          <router-view />
        </el-card>
      </el-main>
    </el-container>

    <el-footer class="layout-footer"> © 2025 {{ t('system.footer.copyright') }} </el-footer>
  </el-container>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue';
import { HomeFilled, Document, User, Notebook, ChatRound, Key, Setting, Operation } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import Logo from '@/components/Logo.vue';

const { t } = useI18n();
const userStore = useUserStore();
const router = useRouter();
const userInfo = userStore.userInfo;

const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL);

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(t('system.dialog.logoutConfirm'), t('system.dialog.title'), {
      confirmButtonText: t('system.button.confirm'),
      cancelButtonText: t('system.button.cancel'),
      type: 'warning',
    });

    const success = await userStore.userLogout();
    if (success) {
      router.push('/login');
    }
  } catch (error) {
    // 用户点击取消按钮，不做任何操作
    if (error !== 'cancel') {
      console.error(t('system.error.logoutFailed'), error);
    }
  }
};

const goToHome = () => {
  window.open('/', '_self');
};
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;

  .layout-header {
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 20px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 99;
    border-bottom: 1px solid #e6e6e6;
    .logo {
      display: flex;
      align-items: center;
    }

    .nav {
      flex: 1;
      margin-left: 30px;

      a {
        margin-right: 20px;
        font-size: 14px;
        text-decoration: none;

        &.router-link-active {
          color: #409eff;
        }
      }
    }

    .user-info {
      .user-dropdown {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
    }
  }

  .main-container {
    height: calc(100vh - 120px);
  }

  .layout-aside {
    border-right: 1px solid #e6e6e6;
    background-color: #f6f8fa;
    :deep(.el-menu) {
      border-right: none;
      background-color: transparent;
    }
  }

  .layout-main {
    padding: 0;
    background-color: #f5f5f5;
    overflow-y: auto;
    height: 100%;
    .layout-card {
      height: 100%;
      overflow-y: auto;
      border: none;
      border-radius: 0;
      :deep(.el-card__body) {
        padding: 0;
        height: 100%;
      }
    }
  }

  .layout-footer {
    padding: 15px 0;
    text-align: center;
    background-color: #fff;
    color: #999;
    font-size: 14px;
    height: 60px;
    border-top: 1px solid #e6e6e6;
  }
}
</style>
