<script setup lang="ts">
import { reactive } from 'vue';
import { ElButton, ElCascader, ElDialog, ElForm, ElFormItem, ElMessage } from 'element-plus';
import { fetchGetContentCategoryList, moveContentToCategory } from '@/service/api/content';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import { convertToTree } from '../utils';

defineOptions({ name: 'ContentMoveCateModal' });

interface Props {
  /** selected content ids */
  selectedIds: string[];
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const emit = defineEmits(['submitted']);

const { formRef, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const state = reactive({
  formData: {
    categories: undefined as string[] | undefined,
  },
  categories: [] as any[],
});

const rules = {
  categories: defaultRequiredRule,
};

const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true,
};

async function getCategoryOptions() {
  const { error, data } = await fetchGetContentCategoryList();
  if (!error && data) {
    state.categories = data;
  }
}

function handleChangeCategory(value: any) {
  console.log('Selected category:', value);
}

async function submitForm() {
  try {
    // Check form validation
    if (!formRef.value) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    if (!props.selectedIds || props.selectedIds.length === 0) {
      ElMessage.warning($t('page.document.content.selectContentFirst'));
      return;
    }

    const params = {
      ids: props.selectedIds.join(','),
      categories: state.formData.categories,
    };

    const { error } = await moveContentToCategory(params);

    if (!error) {
      ElMessage.success($t('common.operateSuccess'));
      closeModal();
      emit('submitted');
    }
  } catch (error) {
    console.error('Error moving contents to category:', error);
  }
}

function closeModal() {
  visible.value = false;
  resetForm();
}

function resetForm() {
  state.formData.categories = undefined;
  restoreValidation();
}

// Initialize data
getCategoryOptions();
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('page.document.content.selectCategory')"
    width="500px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <ElForm ref="formRef" :model="state.formData" :rules="rules" label-width="120px">
      <p class="notice-tip">
        {{ $t('page.document.content.selectedContent') }}
        <span class="text-danger font-bold">{{ selectedIds.length }}</span>
        {{ $t('page.document.content.items') }}
      </p>
      <ElFormItem :label="$t('page.document.content.category')" prop="categories">
        <ElCascader
          v-model="state.formData.categories"
          :options="state.categories"
          :props="categoryProps"
          filterable
          clearable
          class="w-full"
          @change="handleChangeCategory"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="closeModal">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" @click="submitForm">{{ $t('common.confirm') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
.notice-tip {
  padding: 8px 16px;
  background-color: var(--el-color-info-light-9);
  border-radius: 4px;
  border-left: 5px solid var(--el-color-primary);
  margin: 0 0 25px;
}
</style>
