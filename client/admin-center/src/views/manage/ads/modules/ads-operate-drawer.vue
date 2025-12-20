<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect, ElSwitch, ElUpload } from 'element-plus';
import { uploadUrl } from '@/constants/common';
import { createAd, updateAd } from '@/service/api/ads';
import { beforeAvatarUpload } from '@/utils/upload';
import { $t } from '@/locales';
defineOptions({ name: 'AdsOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.DocumentManage.Advertisement | null;
}

const props = defineProps<Props>();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('common.add'),
    edit: $t('common.edit'),
  };
  return titles[props.operateType];
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<Partial<Api.DocumentManage.Advertisement>>({
  name: '',
  type: '1',
  state: false,
  carousel: false,
  height: null,
  comments: '',
  items: [],
});

const rules = {
  name: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  comments: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  type: [{ required: true, message: $t('common.required'), trigger: 'change' }],
  'items.0.title': [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  'items.0.link': [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  'items.0.sImg': [{ required: true, message: $t('common.required'), trigger: 'change' }],
};

// 添加自定义验证函数
const validateItems = (_: any, value: any, callback: any) => {
  if (!value || value.length === 0) {
    callback(new Error($t('common.required')));
  } else {
    callback();
  }
};

function resetForm() {
  form.name = '';
  form.type = '1';
  form.state = false;
  form.carousel = false;
  form.height = null;
  form.comments = '';
  form.items = [];
}

function addItem() {
  form.items?.push({
    title: '',
    link: '',
    alt: '',
    target: '_blank',
    sImg: '',
    height: null,
    width: null,
  } as Api.DocumentManage.AdItem);
}

function removeItem(index: number) {
  form.items?.splice(index, 1);
}

function handleUploadSuccess(response: any, _uploadFile: any) {
  // 从响应中获取索引
  const index = Number(response?.data?.index);

  if (response?.data?.path && form.items && Number.isNaN(index) === false) {
    form.items[index].sImg = response.data.path;
    window.$message?.success($t('common.uploadSuccess'));
  } else {
    window.$message?.error($t('common.uploadError'));
  }
}

async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;
    let result: any = '';
    if (props.operateType === 'edit') {
      result = await updateAd(form);
    } else {
      result = await createAd(form);
    }
    if (!result?.error) {
      window.$message?.success($t('common.updateSuccess'));
      visible.value = false;
      emit('submitted');
    }
  } catch (err) {
    console.error('Submit error:', err);
    window.$message?.error($t('common.submitError'));
  } finally {
    loading.value = false;
  }
}

// Initialize form data when rowData changes
watch(
  () => props.rowData,
  newVal => {
    if (newVal) {
      Object.assign(form, newVal);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);
</script>

<template>
  <ElDrawer
    v-model="visible"
    :title="title"
    :size="800"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="resetForm"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px" class="h-full flex-col-stretch">
      <div class="flex-1-hidden overflow-y-auto">
        <ElFormItem :label="$t('page.document.ads.name')" prop="name">
          <ElInput v-model="form.name" :placeholder="$t('page.document.ads.name')" />
        </ElFormItem>

        <ElFormItem :label="$t('page.document.ads.type')" prop="type">
          <ElSelect v-model="form.type" class="w-full">
            <ElOption :label="$t('page.document.ads.typeOptions.image')" value="1" />
            <ElOption :label="$t('page.document.ads.typeOptions.text')" value="2" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem :label="$t('page.document.ads.state')">
          <ElSwitch v-model="form.state" />
        </ElFormItem>

        <ElFormItem :label="$t('page.document.ads.carousel')">
          <ElSwitch v-model="form.carousel" />
        </ElFormItem>

        <ElFormItem :label="$t('page.document.ads.height')">
          <ElInput v-model="form.height" type="number" />
        </ElFormItem>

        <ElFormItem :label="$t('page.document.ads.comments')" prop="comments">
          <ElInput v-model="form.comments" type="textarea" :rows="3" :placeholder="$t('page.document.ads.comments')" />
        </ElFormItem>

        <div v-if="form.type === '1'" class="mb-16px">
          <div class="mb-8px flex items-center justify-between">
            <span class="text-14px">{{ $t('page.document.ads.items') }}</span>
            <ElButton type="primary" link @click="addItem">
              {{ $t('common.add') }}
            </ElButton>
          </div>

          <ElFormItem prop="items" :rules="[{ validator: validateItems, trigger: 'change' }]" class="!mb-0">
            <div class="item-container">
              <div v-for="(item, index) in form.items" :key="index" class="item-container-item border rounded p-16px">
                <ElFormItem
                  :label="$t('page.document.ads.item')"
                  :prop="`items.${index}.title`"
                  :rules="rules['items.0.title']"
                >
                  <ElInput v-model="item.title" />
                </ElFormItem>

                <ElFormItem
                  :label="$t('page.document.ads.link')"
                  :prop="`items.${index}.link`"
                  :rules="rules['items.0.link']"
                >
                  <ElInput v-model="item.link" />
                </ElFormItem>

                <ElFormItem
                  :label="$t('page.document.ads.image')"
                  :prop="`items.${index}.sImg`"
                  :rules="rules['items.0.sImg']"
                  class="!mb-16px"
                >
                  <ElUpload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                    :on-success="handleUploadSuccess"
                    :data="{ index, action: 'uploadimage' }"
                  >
                    <img v-if="item.sImg" :src="item.sImg" class="avatar" />
                    <div v-else class="avatar-uploader-icon">
                      <i class="el-icon-plus"></i>
                    </div>
                  </ElUpload>
                </ElFormItem>

                <div class="flex justify-end">
                  <ElButton type="danger" link @click="removeItem(index)">
                    {{ $t('common.delete') }}
                  </ElButton>
                </div>
              </div>
            </div>
          </ElFormItem>
        </div>
      </div>

      <div class="flex justify-end gap-16px">
        <ElButton @click="visible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="loading" @click="submit">
          {{ $t('common.confirm') }}
        </ElButton>
      </div>
    </ElForm>
  </ElDrawer>
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
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}
.item-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .item-container-item {
    width: 100%;
    .el-form-item {
      margin: 8px 0;
    }
  }
}
</style>
