<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElButton, ElDrawer, ElForm, ElFormItem, ElInput } from 'element-plus';
import { createContentTag, updateContentTag } from '@/service/api/content-tag';
import { $t } from '@/locales';

defineOptions({ name: 'TagOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.ContentTag | null;
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

const form = reactive<Partial<Api.SystemManage.ContentTag>>({
  name: '',
  comments: '',
});

const rules = {
  name: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  comments: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
};

function resetForm() {
  form.name = '';
  form.comments = '';
}

async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (props.operateType === 'edit') {
      await updateContentTag({ ...form, id: props.rowData?.id });
    } else {
      const createData: Api.SystemManage.ContentTag = {
        id: '',
        name: form.name || '',
        comments: form.comments || '',
      };
      await createContentTag(createData);
    }

    window.$message?.success($t('common.operateSuccess'));
    visible.value = false;
    emit('submitted');
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
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="resetForm"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="h-full flex-col-stretch"
    >
      <div class="flex-1-hidden overflow-y-auto">
        <ElFormItem :label="$t('common.name')" prop="name">
          <ElInput v-model="form.name" :placeholder="$t('common.name')" />
        </ElFormItem>

        <ElFormItem :label="$t('common.description')" prop="comments">
          <ElInput
            v-model="form.comments"
            type="textarea"
            :rows="4"
            :placeholder="$t('common.description')"
          />
        </ElFormItem>
      </div>

      <div class="mt-4 flex-y-center justify-end gap-2">
        <ElButton @click="visible = false">
          {{ $t('common.cancel') }}
        </ElButton>
        <ElButton type="primary" :loading="loading" @click="submit">
          {{ $t('common.confirm') }}
        </ElButton>
      </div>
    </ElForm>
  </ElDrawer>
</template>
