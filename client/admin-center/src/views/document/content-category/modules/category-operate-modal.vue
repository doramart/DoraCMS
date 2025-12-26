<!-- Category Operation Modal -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import {
  addContentCategory,
  getMyTemplateList,
  getOneContentCategory,
  updateContentCategory,
} from '@/service/api/content-category';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';

defineOptions({ name: 'CategoryOperateModal' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const type = ref<'add' | 'edit'>('add');
const parentId = ref('0');
const parentData = ref<Record<string, any>>({});
const templateList = ref<any[]>([]);

const formData = ref<Api.SystemManage.ContentCategory>({
  id: '',
  name: '',
  enable: true,
  type: '1',
  sImg: '',
  icon: '',
  contentTemp: '',
  defaultUrl: '',
  sortId: 1,
  keywords: '',
  comments: '',
  parentId: '0',
  createBy: '',
  createdAt: '',
  updateBy: '',
  updatedAt: '',
  status: '1',
  url: '',
});

const title = computed(() => {
  return type.value === 'add' ? $t('page.document.contentCategory.add') : $t('page.document.contentCategory.edit');
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: $t('page.document.contentCategory.nameRequired'),
      trigger: 'blur',
    },
    {
      min: 2,
      max: 20,
      message: $t('page.document.contentCategory.nameLength'),
      trigger: 'blur',
    },
  ],
  defaultUrl: [
    {
      required: true,
      message: $t('page.document.contentCategory.seoUrlRequired'),
      trigger: 'blur',
    },
  ],
  comments: [
    {
      required: true,
      message: $t('page.document.contentCategory.descriptionRequired'),
      trigger: 'blur',
    },
    {
      min: 4,
      max: 100,
      message: $t('page.document.contentCategory.descriptionLength'),
      trigger: 'blur',
    },
  ],
};

const uploadAction = `${import.meta.env.VITE_SERVICE_BASE_URL}/api/v1/files`;

async function getTemplateList() {
  // const res: any = await getMyTemplateList();
  // if (res?.response?.status === 200) {
  //   templateList.value = res.data || [];
  // }
}

async function getDetail(id: string) {
  const res: any = await getOneContentCategory(id);
  if (!res.error) {
    formData.value = {
      ...res.data,
      contentTemp: res.data.contentTemp?.id || '',
    };
  }
}

function handleUploadSuccess(res: any) {
  formData.value.sImg = res.data.path;
}

function beforeUpload(file: File) {
  const isImage = /^image\/(jpeg|png|gif)$/.test(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error($t('page.document.contentCategory.imageTypeError'));
    return false;
  }
  if (!isLt2M) {
    ElMessage.error($t('page.document.contentCategory.imageSizeError'));
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        const api = type.value === 'add' ? addContentCategory : updateContentCategory;
        const success = await executeRequestCompat(() => api(formData.value));

        if (success) {
          ElMessage.success(type.value === 'add' ? $t('common.addSuccess') : $t('common.modifySuccess'));
          visible.value = false;
          emit('success');
        }
      } finally {
        loading.value = false;
      }
    }
  });
}

function handleClosed() {
  formRef.value?.resetFields();
  formData.value = {
    id: '',
    name: '',
    enable: true,
    type: '1',
    sImg: '',
    icon: '',
    contentTemp: '',
    defaultUrl: '',
    sortId: 1,
    keywords: '',
    comments: '',
    parentId: '0',
    createBy: '',
    createdAt: '',
    updateBy: '',
    updatedAt: '',
    status: '1',
    url: '',
  };
}

defineExpose({
  open: async (options: { type: 'add' | 'edit'; id?: string; parentId?: string; parentData?: Record<string, any> }) => {
    type.value = options.type;
    if (options.type === 'edit' && options.id) {
      await getDetail(options.id);
    } else if (options.type === 'add') {
      formData.value.parentId = options.parentId || '0';
      parentId.value = options.parentId || '0';
      if (options.parentData) {
        parentData.value = options.parentData;
      }
    }
    await getTemplateList();
    visible.value = true;
  },
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="600px" :close-on-click-modal="false" @closed="handleClosed">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="120px" class="mt-4">
      <ElFormItem v-if="type === 'add' && parentId !== '0'" :label="$t('page.document.contentCategory.parentName')">
        <ElInput v-model="parentData.name" disabled />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.name')" prop="name">
        <ElInput v-model="formData.name" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.enable')" prop="enable">
        <ElSwitch v-model="formData.enable" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.type')" prop="type">
        <ElRadioGroup v-model="formData.type">
          <ElRadio value="1">{{ $t('page.document.contentCategory.typeNormal') }}</ElRadio>
          <ElRadio value="2">{{ $t('page.document.contentCategory.typeSinger') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.icon')" prop="icon">
        <ElInput v-model="formData.icon" :placeholder="$t('page.document.contentCategory.form.icon')" class="flex-1">
          <template #suffix>
            <Icon v-if="formData.icon" :icon="formData.icon" class="text-icon" />
          </template>
        </ElInput>
      </ElFormItem>

      <ElFormItem v-if="parentId === '0'" :label="$t('page.document.contentCategory.cover')" prop="sImg">
        <ElUpload
          class="avatar-uploader"
          :action="uploadAction"
          :show-file-list="false"
          :on-success="handleUploadSuccess"
          :before-upload="beforeUpload"
        >
          <img v-if="formData.sImg" :src="formData.sImg" class="avatar" />
          <ElIcon v-else class="avatar-uploader-icon">
            <Plus />
          </ElIcon>
        </ElUpload>
      </ElFormItem>

      <ElFormItem v-if="parentId === '0'" :label="$t('page.document.contentCategory.template')" prop="contentTemp">
        <ElSelect v-model="formData.contentTemp">
          <ElOption v-for="item in templateList" :key="item.id" :label="item.name" :value="item.id" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.seoUrl')" prop="defaultUrl">
        <ElInput v-model="formData.defaultUrl" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.sort')" prop="sortId">
        <ElInputNumber v-model="formData.sortId" :min="1" :max="50" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.keywords')" prop="keywords">
        <ElInput v-model="formData.keywords" type="textarea" :rows="2" />
      </ElFormItem>

      <ElFormItem :label="$t('page.document.contentCategory.description')" prop="comments">
        <ElInput v-model="formData.comments" type="textarea" :rows="2" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  text-align: center;
}

.avatar {
  width: 150px;
  height: 150px;
  display: block;
}
</style>
