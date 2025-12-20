<script setup lang="ts">
import { reactive, watch } from 'vue';
import { addTemplateItem } from '@/service/api/template-config';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'TempItemOperateModal' });

interface Props {
  templateData: {
    name: string;
    forder: string;
    comments: string;
    temp_id: string;
  };
  folderList: Api.PluginManage.TemplateItem[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

type RuleKey = 'name' | 'forder' | 'comments';

const rules: Record<RuleKey, App.Global.FormRule> = {
  name: {
    ...defaultRequiredRule,
    min: 1,
    max: 12,
    message: $t('page.extend.templateConfig.form.name')
  },
  forder: {
    ...defaultRequiredRule,
    min: 1,
    max: 30,
    message: $t('page.extend.templateConfig.form.template')
  },
  comments: {
    ...defaultRequiredRule,
    min: 2,
    max: 30,
    message: $t('page.extend.templateConfig.form.comments')
  }
};

const formData = reactive({
  name: '',
  forder: '',
  comments: '',
  temp_id: ''
});

async function handleSubmit() {
  await validate();

  try {
    const params = { ...formData };
    await addTemplateItem(params);
    window.$message?.success($t('common.addSuccess'));
    closeModal();
    emit('success');
  } catch (error) {
    console.error('Failed to add template item:', error);
  }
}

function closeModal() {
  visible.value = false;
}

watch(
  () => props.templateData,
  newVal => {
    if (visible.value) {
      Object.assign(formData, newVal);
    }
  },
  { deep: true }
);

watch(visible, newVal => {
  if (newVal) {
    Object.assign(formData, props.templateData);
    restoreValidation();
  } else {
    // Reset form data
    formData.name = '';
    formData.forder = '';
    formData.comments = '';
  }
});
</script>

<script lang="ts">
export default {
  name: 'TempItemOperateModal'
};
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('page.extend.templateConfig.addTemplateItem')"
    width="500px"
    :close-on-click-modal="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem :label="$t('common.name')" prop="name">
        <ElInput v-model="formData.name" />
      </ElFormItem>
      <ElFormItem :label="$t('page.extend.templateConfig.form.template')" prop="forder">
        <ElSelect v-model="formData.forder" style="width: 100%">
          <ElOption v-for="item in folderList" :key="item.name" :label="item.name" :value="item.name" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('common.description')" prop="comments">
        <ElInput v-model="formData.comments" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace>
        <ElButton @click="closeModal">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>
