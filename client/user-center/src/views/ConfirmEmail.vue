<template>
  <div class="confirm-email-container">
    <div class="page-logo">
      <Logo />
    </div>
    <el-row justify="center" align="middle" class="confirm-email-row">
      <el-col :xs="22" :sm="18" :md="14" :lg="8" :xl="8">
        <el-card class="confirm-email-card">
          <template #header>
            <h3>{{ $t('user.auth.email.confirm') }}</h3>
          </template>

          <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" @submit.prevent="handleSubmit">
            <el-form-item :label="$t('user.profile.basic.email')" prop="email">
              <el-input v-model="formData.email" type="email" :placeholder="$t('user.profile.placeholder.email')" />
            </el-form-item>

            <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-4" />

            <div class="form-actions">
              <el-button type="primary" native-type="submit" :loading="loading">
                {{ $t('user.auth.email.sendEmail') }}
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { sendConfirmEmail } from '@/api/user';
import Logo from '@/components/Logo.vue';

const { t } = useI18n();
const formRef = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const formData = reactive({
  email: '',
});

const rules = {
  email: [
    { required: true, message: t('user.profile.placeholder.currentEmail'), trigger: 'blur' },
    {
      pattern: /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/,
      message: t('user.auth.email.invalidEmail'),
      trigger: 'blur',
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;
    errorMessage.value = '';

    await sendConfirmEmail({ email: formData.email });
    ElMessage.success(t('user.auth.email.sendSuccess'));
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('user.auth.email.sendFailed');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.confirm-email-container {
  padding: 40px 20px;
  position: relative;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-logo {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
}

.confirm-email-row {
  min-height: calc(100vh - 40px);
}

.confirm-email-card {
  margin-bottom: 40px;
}

.form-actions {
  margin-top: 24px;
  text-align: center;
}

:deep(.el-card__header) {
  text-align: center;
}

:deep(.el-card__header h3) {
  margin: 0;
  font-size: 1.5rem;
}
</style>
