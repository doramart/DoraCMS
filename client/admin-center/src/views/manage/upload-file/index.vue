<script setup lang="ts">
import { computed, ref } from 'vue';
import { fetchGetUploadConfig, updateUploadConfig } from '@/service/api/upload-file';
import { useForm, useFormRules } from '@/hooks/common/form';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';

defineOptions({ name: 'UploadFileConfig' });

const { formRef, validate } = useForm();
const { defaultRequiredRule } = useFormRules();

const loading = ref(false);

const model = ref<Api.SystemManage.UploadConfig>({
  type: 'local',
  uploadPath: '',
  qn_bucket: '',
  qn_accessKey: '',
  qn_secretKey: '',
  qn_zone: '',
  qn_endPoint: '',
  oss_bucket: '',
  oss_accessKey: '',
  oss_secretKey: '',
  oss_region: '',
  oss_endPoint: '',
  oss_apiVersion: '',
});

const rules = {
  type: defaultRequiredRule,
  qn_bucket: defaultRequiredRule,
  qn_accessKey: defaultRequiredRule,
  qn_secretKey: defaultRequiredRule,
  qn_zone: defaultRequiredRule,
  qn_endPoint: defaultRequiredRule,
  oss_bucket: defaultRequiredRule,
  oss_accessKey: defaultRequiredRule,
  oss_secretKey: defaultRequiredRule,
  oss_region: defaultRequiredRule,
};

const uploadTypeOptions = [
  { label: $t('page.manage.uploadFile.local'), value: 'local' },
  { label: $t('page.manage.uploadFile.qiniu'), value: 'qn' },
  { label: $t('page.manage.uploadFile.aliyun'), value: 'oss' },
];

const showQiniuFields = computed(() => model.value.type === 'qn');
const showOssFields = computed(() => model.value.type === 'oss');
const showLocalFields = computed(() => model.value.type === 'local');

async function getUploadConfig() {
  loading.value = true;
  try {
    const { data } = await fetchGetUploadConfig();
    if (data) {
      model.value = { ...model.value, ...data };
    }
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  await validate();
  loading.value = true;
  try {
    const success = await executeRequestCompat(() => updateUploadConfig(model.value));
    if (success) {
      window.$message?.success($t('common.updateSuccess'));
    }
  } finally {
    loading.value = false;
  }
}

getUploadConfig();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ElCard class="sm:flex-1-hidden card-wrapper">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.uploadFile.title') }}</p>
        </div>
      </template>

      <ElForm ref="formRef" v-loading="loading" :model="model" :rules="rules" label-width="120px">
        <ElFormItem :label="$t('page.manage.uploadFile.type')" prop="type">
          <ElSelect v-model="model.type" class="w-full">
            <ElOption
              v-for="item in uploadTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <template v-if="showLocalFields">
          <ElFormItem :label="$t('page.manage.uploadFile.uploadPath')" prop="uploadPath">
            <ElInput
              v-model="model.uploadPath"
              :placeholder="$t('page.manage.uploadFile.form.uploadPath')"
            />
          </ElFormItem>
        </template>

        <template v-if="showQiniuFields">
          <ElFormItem :label="$t('page.manage.uploadFile.qn_bucket')" prop="qn_bucket">
            <ElInput
              v-model="model.qn_bucket"
              :placeholder="$t('page.manage.uploadFile.form.qn_bucket')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.qn_accessKey')" prop="qn_accessKey">
            <ElInput
              v-model="model.qn_accessKey"
              :placeholder="$t('page.manage.uploadFile.form.qn_accessKey')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.qn_secretKey')" prop="qn_secretKey">
            <ElInput
              v-model="model.qn_secretKey"
              type="password"
              show-password
              :placeholder="$t('page.manage.uploadFile.form.qn_secretKey')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.qn_zone')" prop="qn_zone">
            <ElInput
              v-model="model.qn_zone"
              :placeholder="$t('page.manage.uploadFile.form.qn_zone')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.qn_endPoint')" prop="qn_endPoint">
            <ElInput
              v-model="model.qn_endPoint"
              :placeholder="$t('page.manage.uploadFile.form.qn_endPoint')"
            />
          </ElFormItem>
        </template>

        <template v-if="showOssFields">
          <ElFormItem :label="$t('page.manage.uploadFile.oss_bucket')" prop="oss_bucket">
            <ElInput
              v-model="model.oss_bucket"
              :placeholder="$t('page.manage.uploadFile.form.oss_bucket')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.oss_accessKey')" prop="oss_accessKey">
            <ElInput
              v-model="model.oss_accessKey"
              :placeholder="$t('page.manage.uploadFile.form.oss_accessKey')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.oss_secretKey')" prop="oss_secretKey">
            <ElInput
              v-model="model.oss_secretKey"
              type="password"
              show-password
              :placeholder="$t('page.manage.uploadFile.form.oss_secretKey')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.oss_region')" prop="oss_region">
            <ElInput
              v-model="model.oss_region"
              :placeholder="$t('page.manage.uploadFile.form.oss_region')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.oss_endPoint')" prop="oss_endPoint">
            <ElInput
              v-model="model.oss_endPoint"
              :placeholder="$t('page.manage.uploadFile.form.oss_endPoint')"
            />
          </ElFormItem>
          <ElFormItem :label="$t('page.manage.uploadFile.oss_apiVersion')" prop="oss_apiVersion">
            <ElInput
              v-model="model.oss_apiVersion"
              :placeholder="$t('page.manage.uploadFile.form.oss_apiVersion')"
            />
          </ElFormItem>
        </template>

        <ElFormItem>
          <ElButton type="primary" :loading="loading" @click="handleSubmit">
            {{ $t('common.update') }}
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}
</style>
