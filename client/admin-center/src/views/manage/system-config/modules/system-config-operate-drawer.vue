<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createSystemConfigItem, updateSystemConfigItem } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';

defineOptions({ name: 'SystemConfigOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.SystemConfig | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false,
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.systemConfig.addConfig'),
    edit: $t('page.manage.systemConfig.editConfig'),
  };
  return titles[props.operateType];
});

type Model = Partial<Api.SystemManage.SystemConfig>;

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    key: '',
    value: '',
    type: 'string',
    public: false,
  };
}

type RuleKey = Extract<keyof Model, 'key' | 'value' | 'type' | 'public'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  key: defaultRequiredRule,
  value: defaultRequiredRule,
  type: defaultRequiredRule,
  public: defaultRequiredRule,
};

const typeOptions = [
  { label: 'string', value: 'string' },
  { label: 'number', value: 'number' },
  { label: 'boolean', value: 'boolean' },
  { label: 'password', value: 'password' },
];

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    model.value = {
      ...model.value,
      ...props.rowData,
    };
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const requestObj = props.operateType === 'add' ? createSystemConfigItem : updateSystemConfigItem;
  const success = await executeRequestCompat(() =>
    requestObj(model.value as Api.SystemManage.SystemConfig)
  );

  if (success) {
    window.$message?.success($t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  }
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <ElDrawer v-model="visible" :title="title" :size="360">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.manage.systemConfig.key')" prop="key">
        <ElInput v-model="model.key" :placeholder="$t('page.manage.systemConfig.form.key')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.systemConfig.value')" prop="value">
        <ElInput
          v-if="model.type === 'password'"
          v-model="model.value"
          :placeholder="$t('page.manage.systemConfig.form.value')"
          type="password"
          show-password
        />
        <ElInput
          v-else-if="model.type === 'number'"
          v-model="model.value"
          :placeholder="$t('page.manage.systemConfig.form.value')"
          type="number"
        />
        <ElSwitch
          v-else-if="model.type === 'boolean'"
          v-model="model.value"
          :active-text="$t('common.yesOrNo.yes')"
          :inactive-text="$t('common.yesOrNo.no')"
        />
        <ElInput
          v-else-if="model.type === 'string'"
          v-model="model.value"
          :placeholder="$t('page.manage.systemConfig.form.value')"
          type="text"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.systemConfig.type')" prop="type">
        <ElSelect v-model="model.type" :placeholder="$t('page.manage.systemConfig.form.type')">
          <ElOption
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.systemConfig.public')" prop="public">
        <ElSwitch v-model="model.public" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>

<style scoped></style>
