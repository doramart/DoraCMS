<template>
  <div class="reset-password-container">
    <el-card class="reset-password-card">
      <template #header>
        <h3>{{ $t('user.auth.resetPassword') }}</h3>
      </template>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item :label="$t('user.auth.password.label')" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            :placeholder="$t('user.auth.password.nullTips')"
            show-password
          />
        </el-form-item>

        <el-form-item :label="$t('user.auth.password.confirm')" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            :placeholder="$t('user.auth.password.confirmNull')"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">
            {{ $t('user.action.modifyPassword') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { resetPassword } from '@/api/user';
const { t } = useI18n();
const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const formData = reactive({
  tokenId: '',
  password: '',
  confirmPassword: '',
});

onMounted(() => {
  formData.tokenId = document.getElementById('tokenId').value;
});

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.inputNull', [t('user.auth.password.label')])));
  } else if (!/(?!^\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{5,}/.test(value)) {
    callback(new Error(t('validation.ranglengthandnormal', [t('user.auth.password.label'), 6, 12])));
  } else {
    callback();
  }
};

const validateConfirmPass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.inputNull', [t('user.auth.password.confirm')])));
  } else if (value !== formData.password) {
    callback(new Error(t('validation.passwordNotMatching')));
  } else {
    callback();
  }
};

const rules = {
  password: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPass, trigger: 'blur' }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const response = await resetPassword(formData);
    if (response?.status === 200) {
      ElMessage.success(t('user.auth.resetPasswordSuccess'));
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } else {
      ElMessage.error(response?.message || t('user.auth.resetPasswordFailed'));
    }
  } catch (error) {
    console.error('Reset password error:', error);
    ElMessage.error(error.message || t('user.auth.resetPasswordFailed'));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.reset-password-card {
  width: 100%;
  max-width: 480px;
}

.submit-btn {
  width: 100%;
}

:deep(.el-card__header) {
  text-align: center;
}

:deep(.el-card__header h3) {
  margin: 0;
  font-size: 1.5rem;
}
</style>
