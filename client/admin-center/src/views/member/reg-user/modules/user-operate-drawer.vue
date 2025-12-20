<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';
import { updateRegUser } from '@/service/api/reg-user';
import { $t } from '@/locales';

defineOptions({ name: 'UserOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.RegUser | null;
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

const form = reactive<Partial<Api.SystemManage.RegUser>>({
  userName: '',
  phoneNum: '',
  email: '',
  enable: true,
  comments: '',
  group: '0',
  createdAt: new Date().toISOString(),
  logo: '',
  idType: '',
  introduction: '',
  birth: '',
  gender: '',
  state: '',
  loginActive: false,
});

const rules = {
  userName: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  phoneNum: [{ required: true, message: $t('common.required'), trigger: 'blur' }],
  email: [
    { required: true, message: $t('common.required'), trigger: 'blur' },
    { type: 'email' as const, message: $t('form.email.invalid'), trigger: 'blur' },
  ],
};

const roleOptions = [
  { label: $t('page.member.regUser.normalUser'), value: '0' },
  { label: $t('page.member.regUser.adminUser'), value: '1' },
];

function resetForm() {
  form.userName = '';
  form.phoneNum = '';
  form.email = '';
  form.enable = true;
  form.comments = '';
  form.group = '0';
  form.createdAt = new Date().toISOString();
  form.logo = '';
  form.idType = '';
  form.introduction = '';
  form.birth = '';
  form.gender = '';
  form.state = '';
  form.loginActive = false;
}

async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (props.operateType === 'edit') {
      await updateRegUser({ ...form, id: props.rowData?.id });
    } else {
      // 新增用户功能暂未实现
      console.warn('Create user API not implemented yet');
    }

    window.$message?.success($t('common.updateSuccess'));
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
        <ElFormItem :label="$t('page.member.regUser.userName')" prop="userName">
          <ElInput v-model="form.userName" :placeholder="$t('page.member.regUser.userName')" />
        </ElFormItem>

        <ElFormItem :label="$t('page.member.regUser.phone')" prop="phoneNum">
          <ElInput v-model="form.phoneNum" :placeholder="$t('page.member.regUser.phone')" />
        </ElFormItem>

        <ElFormItem :label="$t('page.member.regUser.email')" prop="email">
          <ElInput v-model="form.email" :placeholder="$t('page.member.regUser.email')" />
        </ElFormItem>

        <ElFormItem :label="$t('page.member.regUser.role')" prop="group">
          <ElSelect v-model="form.group" class="w-full">
            <ElOption
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem :label="$t('page.member.regUser.status')">
          <ElSwitch v-model="form.enable" />
        </ElFormItem>

        <ElFormItem :label="$t('page.member.regUser.comments')" prop="comments">
          <ElInput
            v-model="form.comments"
            type="textarea"
            :rows="3"
            :placeholder="$t('page.member.regUser.comments')"
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
