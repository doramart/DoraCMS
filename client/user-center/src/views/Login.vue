<template>
  <div class="login-container">
    <div class="page-logo">
      <Logo />
    </div>
    <el-row justify="center" align="middle" class="login-row">
      <el-col :xs="22" :sm="18" :md="12" :lg="8" :xl="6">
        <el-card class="login-card">
          <template #header>
            <div class="login-header">
              <h3 class="login-title">{{ t('user.auth.login') }}</h3>
              <el-dropdown @command="handleLanguageChange">
                <span class="language-switch">
                  {{ currentLanguage === 'zh-CN' ? t('system.language.chinese') : t('system.language.english') }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="zh-CN">{{ t('system.language.chinese') }}</el-dropdown-item>
                    <el-dropdown-item command="en-US">{{ t('system.language.english') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>

          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="rules"
            label-position="top"
            @submit.prevent="handleSubmit"
          >
            <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="mb-4" />

            <el-form-item :label="t('user.profile.basic.email')" prop="email">
              <el-input v-model="loginForm.email" type="email" :placeholder="t('user.profile.placeholder.email')" />
            </el-form-item>

            <el-form-item :label="t('user.auth.password.label')" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                :placeholder="t('user.auth.placeholder.password')"
                show-password
              />
            </el-form-item>

            <div class="login-buttons">
              <el-button type="primary" native-type="submit" :loading="loading">
                {{ t('user.auth.login') }}
              </el-button>
              <el-button @click="resetForm">
                {{ t('system.button.reset') }}
              </el-button>
            </div>

            <div class="forgot-password">
              <router-link to="/confirm-email"> {{ t('user.auth.password.forgot') }}？ </router-link>
            </div>
            <div class="register-entry">
              <span class="register-text">{{ t('user.auth.noAccount') }}</span>
              <router-link to="/register">{{ t('user.auth.register') }}</router-link>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { login } from '@/api/user';
import { useUserStore } from '@/stores/user';
import Logo from '@/components/Logo.vue';
import { persistLocalePreference } from '@/plugins/i18n';
const router = useRouter();
const userStore = useUserStore();
const { t, locale } = useI18n();
const loginFormRef = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const currentLanguage = computed(() => locale.value);

const loginForm = reactive({
  email: '',
  password: '',
});

const rules = {
  email: [
    { required: true, message: t('user.profile.placeholder.currentEmail'), trigger: 'blur' },
    {
      pattern: /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/,
      message: t('user.profile.placeholder.currentEmail'),
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: t('user.auth.placeholder.currentPassword'), trigger: 'blur' },
    {
      pattern: /(?!^\\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{5,}/,
      message: t('user.auth.placeholder.currentPassword'),
      trigger: 'blur',
    },
  ],
};

const handleLanguageChange = lang => {
  locale.value = lang;
  persistLocalePreference(lang);
};

const handleSubmit = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;
    errorMessage.value = '';

    const loginState = await userStore.userLogin(loginForm);
    if (loginState) {
      ElMessage.success(t('validation.userLoginOk'));
      router.push('/');
    } else {
      errorMessage.value = t('validation.loginNotSuccess');
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('validation.loginNotSuccess');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  if (loginFormRef.value) {
    loginFormRef.value.resetFields();
  }
  errorMessage.value = '';
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  position: relative;
}

.page-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

.login-row {
  min-height: calc(100vh - 40px);
}

.login-card {
  width: 100%;
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-title {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.language-switch {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.login-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.forgot-password {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.forgot-password a,
.register-entry a {
  color: #409eff;
  text-decoration: none;
}

.forgot-password a:hover,
.register-entry a:hover {
  text-decoration: underline;
}

.register-entry {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
}

.register-text {
  margin-right: 6px;
  color: #606266;
}

.mb-4 {
  margin-bottom: 16px;
}

@media screen and (max-width: 768px) {
  .login-container {
    padding: 10px;
  }

  .login-title {
    font-size: 1.2rem;
  }
}
</style>
