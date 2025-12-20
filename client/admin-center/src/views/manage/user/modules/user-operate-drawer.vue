<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { enableStatusOptions, userGenderOptions } from '@/constants/business';
import { uploadUrl } from '@/constants/common';
import { createUserItem, fetchGetAllRoles, updateUserItem } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';

defineOptions({ name: 'UserOperateDrawer' });

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.User | null;
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
const { defaultRequiredRule, patternRules } = useFormRules();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.user.addUser'),
    edit: $t('page.manage.user.editUser'),
  };
  return titles[props.operateType];
});

type Model = Partial<
  Pick<
    Api.SystemManage.User,
    | 'userName'
    | 'userGender'
    | 'nickName'
    | 'userPhone'
    | 'userEmail'
    | 'userRoles'
    | 'status'
    | 'password'
    | 'logo'
  >
> & {
  confirmPassword?: string;
};

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    userName: '',
    password: '',
    confirmPassword: '',
    userGender: undefined,
    nickName: '',
    userPhone: '',
    userEmail: '',
    userRoles: [] as string[],
    status: undefined,
    logo: '',
  };
}

type RuleKey = Extract<
  keyof Model,
  | 'userName'
  | 'userEmail'
  | 'userPhone'
  | 'logo'
  | 'status'
  | 'password'
  | 'confirmPassword'
  | 'nickName'
>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  userName: [defaultRequiredRule, patternRules.userName],
  userEmail: [
    defaultRequiredRule,
    {
      validator: (_rule, value) => {
        if (!value) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return new Error($t('common.validation.email'));
        }
        return true;
      },
      trigger: ['blur', 'change'],
    },
  ],
  userPhone: [
    defaultRequiredRule,
    {
      validator: (_rule, value) => {
        if (!value) return true;
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
          return new Error($t('common.validation.phone'));
        }
        return true;
      },
      trigger: ['blur', 'change'],
    },
  ],
  nickName: defaultRequiredRule,
  logo: defaultRequiredRule,
  status: defaultRequiredRule,
  password: {
    validator: (_rule, value) => {
      if (!value) return true;
      if (!model.value.confirmPassword) {
        return new Error($t('common.validation.confirmPasswordRequired'));
      }
      if (value !== model.value.confirmPassword) {
        return new Error($t('common.validation.passwordNotMatch'));
      }
      return true;
    },
    trigger: ['blur', 'change'],
  },
  confirmPassword: {
    validator: (_rule, value) => {
      if (!model.value.password) return true;
      if (!value) {
        return new Error($t('common.validation.confirmPasswordRequired'));
      }
      if (value !== model.value.password) {
        return new Error($t('common.validation.passwordNotMatch'));
      }
      return true;
    },
    trigger: ['blur', 'change'],
  },
};

/** the enabled role options */
const roleOptions = ref<CommonType.Option<string>[]>([]);

async function getRoleOptions() {
  const { data } = await fetchGetAllRoles();
  const options = data.map((item: { roleName: string; id: string }) => ({
    label: item.roleName,
    value: item.id,
  }));

  // the mock data does not have the roleCode, so fill it
  // if the real request, remove the following code
  // const userRoleOptions =
  //   model.value.userRoles?.map(item => ({
  //     label: item,
  //     value: item
  //   })) || [];
  // end

  roleOptions.value = [...options];
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    const userRoles = props.rowData.userRoles?.map((item: any) => item.id);
    model.value = {
      ...model.value,
      ...props.rowData,
      userRoles,
    };
  }
}

function closeDrawer() {
  visible.value = false;
}

// Upload methods
function handleAvatarSuccess(response: any) {
  if (response && response.status === 200) {
    model.value.logo = response.data.path;
    window.$message?.success($t('page.manage.user.uploadSuccess'));
  } else {
    window.$message?.error(response?.message || $t('page.manage.user.uploadFailed'));
  }
}

function handleUploadError() {
  window.$message?.error($t('page.manage.user.uploadFailed'));
}

function beforeAvatarUpload(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isValidType = allowedTypes.includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isValidType) {
    window.$message?.error($t('page.manage.user.imageTypeError'));
    return false;
  }

  if (!isLt2M) {
    window.$message?.error($t('page.manage.user.imageSizeError'));
    return false;
  }

  return true;
}

function handleAvatarRemove() {
  model.value.logo = '';
}

async function handleSubmit() {
  await validate();

  // request
  const requestObj = props.operateType === 'add' ? createUserItem : updateUserItem;
  const submitData = { ...model.value } as Partial<Model>;
  delete submitData.confirmPassword;
  if (!submitData.password) {
    delete submitData.password;
  }

  const success = await executeRequestCompat(() => requestObj(submitData as Api.SystemManage.User));

  if (success) {
    window.$message?.success($t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  }
  // 失败情况下错误消息已经在 request interceptor 中处理，这里不需要额外处理
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
    getRoleOptions();
  }
});
</script>

<template>
  <ElDrawer v-model="visible" :title="title" :size="360">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.manage.user.userName')" prop="userName">
        <ElInput v-model="model.userName" :placeholder="$t('page.manage.user.form.userName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.password')" prop="password">
        <ElInput
          v-model="model.password"
          type="password"
          :placeholder="$t('page.manage.user.form.password')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.confirmPassword')" prop="confirmPassword">
        <ElInput
          v-model="model.confirmPassword"
          type="password"
          :placeholder="$t('page.manage.user.form.confirmPassword')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userGender')" prop="userGender">
        <ElRadioGroup v-model="model.userGender">
          <ElRadio
            v-for="item in userGenderOptions"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
          />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.nickName')" prop="nickName">
        <ElInput v-model="model.nickName" :placeholder="$t('page.manage.user.form.nickName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userPhone')" prop="userPhone">
        <ElInput v-model="model.userPhone" :placeholder="$t('page.manage.user.form.userPhone')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userEmail')" prop="userEmail">
        <ElInput v-model="model.userEmail" :placeholder="$t('page.manage.user.form.userEmail')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userStatus')" prop="status">
        <ElRadioGroup v-model="model.status">
          <ElRadio
            v-for="item in enableStatusOptions"
            :key="item.value"
            :value="item.value"
            :label="$t(item.label)"
          />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userRole')" prop="roles">
        <ElSelect
          v-model="model.userRoles"
          multiple
          :placeholder="$t('page.manage.user.form.userRole')"
        >
          <ElOption
            v-for="{ label, value } in roleOptions"
            :key="value"
            :label="label"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userAvatar')" prop="logo">
        <ElUpload
          class="avatar-uploader"
          :action="uploadUrl"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          :on-error="handleUploadError"
          :on-remove="handleAvatarRemove"
        >
          <img v-if="model.logo" :src="model.logo" class="avatar" />
          <ElIcon v-else class="avatar-uploader-icon"><Plus /></ElIcon>
        </ElUpload>
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

<style scoped>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
  border-radius: 6px;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
