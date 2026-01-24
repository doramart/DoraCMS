<template>
  <div class="page-container personal-info">
    <PageHeader :title="$t('user.center.basicInfo')" />

    <div class="page-box-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="info-form">
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-4" />

        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item :label="$t('user.profile.basic.username')" prop="userName">
              <el-input v-model="formData.userName" :placeholder="$t('user.profile.placeholder.username')" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item :label="$t('user.profile.basic.name')" prop="name">
              <el-input v-model="formData.name" :placeholder="$t('user.profile.placeholder.name')" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item :label="$t('user.profile.basic.phoneNum')" prop="phoneNum">
              <el-input v-model="formData.phoneNum" :placeholder="$t('user.profile.placeholder.tel')" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item :label="$t('user.profile.basic.email')" prop="email">
              <el-input v-model="formData.email" disabled :placeholder="$t('user.profile.placeholder.email')" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <el-form-item :label="$t('user.profile.basic.comments')" prop="comments">
              <el-input v-model="formData.comments" :placeholder="$t('user.profile.placeholder.comments')" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item :label="$t('user.profile.basic.avatar')" prop="logo">
              <el-upload
                class="avatar-uploader"
                :action="UPLOAD_URL"
                :on-success="handleAvatarSuccess"
                :on-error="handleUploadError"
                :before-upload="beforeAvatarUpload"
                :on-remove="handleAvatarRemove"
                :limit="1"
                :show-file-list="false"
                list-type="picture-card"
                :auto-upload="true"
              >
                <img v-if="formData.logo" :src="formData.logo" class="avatar-image" />
                <el-icon v-else><Plus /></el-icon>
                <template #tip>
                  <div class="upload-tip">
                    {{ $t('user.profile.tips.avatarSize') }}
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            {{ $t('user.action.updateInfo') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { getUserProfile, updateUserProfile } from '@/api/profile';
import { Plus } from '@element-plus/icons-vue';
import { UPLOAD_URL } from '@/constants';
import PageHeader from '@/components/common/PageHeader.vue';

const { t } = useI18n();
const formRef = ref(null);
const errorMessage = ref('');
const avatarList = ref([]);

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('doracms_user_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
});

const formData = reactive({
  userName: '',
  name: '',
  phoneNum: '',
  email: '',
  comments: '',
  logo: '',
});

const rules = {
  userName: [
    {
      required: true,
      message: t('validation.inputNull', [t('user.profile.basic.username')]),
      trigger: 'blur',
    },
    {
      pattern: /^[a-zA-Z0-9_@.]+$/,
      message: t('user.profile.placeholder.username'),
      trigger: 'blur',
    },
  ],
  name: [
    {
      required: true,
      message: t('validation.inputNull', [t('user.profile.basic.name')]),
      trigger: 'blur',
    },
    {
      min: 2,
      max: 6,
      message: t('validation.ranglengthandnormal', [t('user.profile.basic.name'), 2, 6]),
      trigger: 'blur',
    },
    {
      pattern: /[\u4e00-\u9fa5]/,
      message: t('validation.ranglengthandnormal', [t('user.profile.basic.name'), 2, 6]),
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
};

const fetchUserInfo = async () => {
  try {
    const { data } = await getUserProfile();
    if (data) {
      Object.assign(formData, {
        name: data.name || '',
        userName: data.userName || '',
        email: data.email || '',
        phoneNum: data.phoneNum || '',
        comments: data.comments || '',
        logo: data.logo || '',
      });
      if (data.logo) {
        avatarList.value = [
          {
            name: 'avatar',
            url: data.logo,
          },
        ];
      }
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('common.error.fetchFailed');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    const { data } = await updateUserProfile(formData);
    if (data) {
      ElMessage.success(t('common.success.updateSuccess'));
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error.message || t('common.error.updateFailed');
  }
};

const handleAvatarSuccess = (response, file) => {
  console.log('Upload success:', response, file);
  if (response && response.status === 200) {
    formData.logo = response.data.path;
    ElMessage.success(t('upload.success'));
  } else {
    console.error('Upload response error:', response);
    ElMessage.error(response?.message || t('upload.failed'));
  }
};

const handleUploadError = (error, file, fileList) => {
  console.error('Upload error:', error, file, fileList);
  ElMessage.error(t('upload.failed'));
};

const beforeAvatarUpload = file => {
  console.log('Before upload:', file);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isValidType = allowedTypes.includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  console.log('File type:', file.type, 'Valid:', isValidType);
  console.log('File size:', file.size, 'Valid:', isLt2M);

  if (!isValidType) {
    ElMessage.error(t('upload.imageTypeError'));
    return false;
  }

  if (!isLt2M) {
    ElMessage.error(t('upload.imageSizeError'));
    return false;
  }

  return true;
};

const handleAvatarRemove = () => {
  formData.logo = '';
  avatarList.value = [];
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style lang="scss" scoped>
.personal-info {
  .info-form {
    max-width: 1200px;
    margin: 0 auto;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .avatar-uploader {
    display: flex;
    flex-direction: column;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-tip {
    font-size: 12px;
    color: #909399;
  }
}
</style>
