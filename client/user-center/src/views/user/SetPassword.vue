<template>
  <div class="page-container set-password-container">
    <PageHeader :title="$t('user.auth.password.modify')" />

    <div class="page-box-content">
      <el-form ref="passwordForm" :model="formData" :rules="rules" label-width="120px" @submit.prevent="handleSubmit">
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
          <el-button type="primary" @click="handleSubmit">
            {{ $t('user.action.modifyPassword') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { changePassword } from '@/api/profile';
import PageHeader from '@/components/common/PageHeader.vue';

const { t } = useI18n();
const passwordForm = ref(null);

const formData = reactive({
  password: '',
  confirmPassword: '',
});

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('validation.inputNull', [t('user.auth.password.label')])));
  } else if (!/(?!^\d+$)(?!^[a-zA-Z]+$)(?!^[_#@]+$).{5,}/.test(value)) {
    callback(new Error(t('validation.passwordStrength')));
  } else {
    if (formData.confirmPassword !== '') {
      passwordForm.value?.validateField('confirmPassword');
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
  password: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
};

const handleSubmit = async () => {
  if (!passwordForm.value) return;

  try {
    await passwordForm.value.validate();
    const response = await changePassword({
      password: formData.password,
    });

    if (response.status === 200) {
      ElMessage.success(t('validation.userLoginOk'));
      // 重置表单
      passwordForm.value.resetFields();
    } else {
      ElMessage.error(response.message || t('common.error'));
    }
  } catch (error) {
    console.error('Password change failed:', error);
    ElMessage.error(t('common.error'));
  }
};
</script>

<style scoped>
.set-password-container {
  /* margin: 20px auto;
  padding: 0 20px; */
  /* width: ;   */
  /* padding: 20px; */
}

.set-password-card {
  border-radius: 8px;
}

.set-password-card :deep(.el-card__header) {
  padding: 15px 20px;
}

.set-password-card h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}
</style>
