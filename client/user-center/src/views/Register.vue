<template>
  <div class="register-container">
    <div class="page-logo">
      <Logo />
    </div>
    <el-card class="register-card">
      <template #header>
        <h3 class="card-title">{{ $t('user.auth.newAccount') }}</h3>
      </template>

      <el-form ref="registerForm" :model="formData" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-4" />

        <el-form-item :label="$t('user.profile.basic.username')" prop="userName">
          <el-input v-model="formData.userName" :placeholder="$t('user.profile.placeholder.username')" />
        </el-form-item>

        <el-form-item :label="$t('user.profile.basic.email')" prop="email">
          <el-input v-model="formData.email" type="email" :placeholder="$t('user.profile.placeholder.email')" />
        </el-form-item>

        <el-form-item :label="$t('user.auth.verify.imageCode')" prop="messageCode">
          <el-row :gutter="10">
            <el-col :span="16">
              <el-input v-model="formData.messageCode" :placeholder="$t('user.auth.verify.imageCode')" />
            </el-col>
            <el-col :span="8">
              <el-button type="primary" :loading="sendingCode" :disabled="countdown > 0" @click="handleSendCode">
                {{ countdown > 0 ? `${countdown}s` : $t('user.auth.verify.sendCode') }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item :label="$t('user.auth.password.label')" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            :placeholder="$t('user.auth.placeholder.password')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('user.auth.password.confirm')" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            :placeholder="$t('user.auth.placeholder.rePassword')"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="w-full">
            {{ $t('user.action_type_register') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { register } from '@/api/user';
import { sendVerificationCode } from '@/api/profile';
import { useI18n } from 'vue-i18n';
import Logo from '@/components/Logo.vue';

const { t } = useI18n();
const router = useRouter();
const registerForm = ref(null);
const loading = ref(false);
const sendingCode = ref(false);
const errorMessage = ref('');
const countdown = ref(0);
let countdownTimer = null;

const formData = reactive({
  userName: '',
  email: '',
  messageCode: '',
  password: '',
  confirmPassword: '',
  regType: '2',
});

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.inputNull', [t('user.auth.password.label')])));
  } else if (!/(?!^\\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{5,}/.test(value)) {
    callback(new Error(t('validation.passwordStrength')));
  } else {
    if (formData.confirmPassword !== '') {
      registerForm.value?.validateField('confirmPassword');
    }
    callback();
  }
};

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.inputNull', [t('user.auth.password.confirm')])));
  } else if (value !== formData.password) {
    callback(new Error(t('validation.passwordNotMatching')));
  } else {
    callback();
  }
};

const rules = {
  userName: [
    {
      required: true,
      message: t('validation.inputNull', [t('user.profile.basic.username')]),
      trigger: 'blur',
    },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{4,11}$/,
      message: t('validation.rangelength', [t('user.profile.basic.username'), 5, 12]),
      trigger: 'blur',
    },
  ],
  email: [
    {
      required: true,
      message: t('validation.inputNull', [t('user.profile.basic.email')]),
      trigger: 'blur',
    },
    {
      type: 'email',
      message: t('validation.inputCorrect', [t('user.profile.basic.email')]),
      trigger: 'blur',
    },
  ],
  messageCode: [
    {
      required: true,
      message: t('validation.inputNull', [t('user.auth.verify.imageCode')]),
      trigger: 'blur',
    },
    {
      min: 6,
      max: 6,
      message: t('validation.inputCorrect', [t('user.auth.verify.imageCode')]),
      trigger: 'blur',
    },
  ],
  password: [{ validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }],
};

const startCountdown = () => {
  countdown.value = 60; // 60秒倒计时

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
};

const handleSendCode = async () => {
  // 验证邮箱格式
  if (!formData.email) {
    errorMessage.value = t('validation.inputNull', [t('user.profile.basic.email')]);
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(formData.email)) {
    errorMessage.value = t('validation.inputCorrect', [t('user.profile.basic.email')]);
    return;
  }

  try {
    sendingCode.value = true;
    errorMessage.value = '';
    await sendVerificationCode({ email: formData.email, messageType: '0', sendType: '2' });
    ElMessage.success(t('user.auth.verify.codeSent'));
    startCountdown(); // 启动倒计时
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('common.error');
  } finally {
    sendingCode.value = false;
  }
};

const handleSubmit = async () => {
  if (!registerForm.value) return;

  try {
    await registerForm.value.validate();
    loading.value = true;
    errorMessage.value = '';

    await register(formData);
    ElMessage.success(t('user.auth.registerSuccess'));
    router.push('/login');
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('common.error');
  } finally {
    loading.value = false;
  }
};

// 清理定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
  position: relative;
}

.page-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

.register-card {
  width: 100%;
  max-width: 500px;
}

.card-title {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  color: #303133;
}

.mb-4 {
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}
</style>
