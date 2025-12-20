<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
// import { loginModuleRecord } from '@/constants/app';
import { fetchGetSystemConfigs } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
// import { useRouterPush } from '@/hooks/common/router';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
defineOptions({ name: 'PwdLogin' });

interface Props {
  initialUserName?: string;
  initialPassword?: string;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
// const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useForm();
const showImgCode = ref(false);
interface FormModel {
  userName: string;
  password: string;
  imageCode: string;
}

const model = ref<FormModel>({
  userName: '',
  password: '',
  imageCode: '',
});

onBeforeMount(async () => {
  await loadSystemConfigs();
});

async function loadSystemConfigs() {
  const { data, error } = await fetchGetSystemConfigs({});
  if (!error && data) {
    showImgCode.value = Boolean(data.showImgCode);
  }
}

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale ref, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd,
    imageCode: [{ required: true, message: $t('page.login.common.imageCodeRequired') }],
  };
});
const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL;
const imgCodeUrl = ref(`${BASE_URL}/api/getImgCode`);

function reSetImgCode() {
  imgCodeUrl.value = `${BASE_URL}/api/getImgCode?${Math.random()}`;
}

watch(
  () => [props.initialUserName, props.initialPassword],
  ([userName, password]) => {
    if (typeof userName !== 'undefined') {
      model.value.userName = userName;
    }
    if (typeof password !== 'undefined') {
      model.value.password = password;
    }
  },
  { immediate: true }
);

async function handleSubmit() {
  await validate();
  await authStore.login(model.value.userName, model.value.password, model.value.imageCode);
}

// type AccountKey = 'super' | 'admin' | 'user';

// interface Account {
//   key: AccountKey;
//   label: string;
//   userName: string;
//   password: string;
// }

// const accounts = computed<Account[]>(() => [
//   {
//     key: 'super',
//     label: $t('page.login.pwdLogin.superAdmin'),
//     userName: 'Super',
//     password: '123456'
//   },
//   {
//     key: 'admin',
//     label: $t('page.login.pwdLogin.admin'),
//     userName: 'Admin',
//     password: '123456'
//   },
//   {
//     key: 'user',
//     label: $t('page.login.pwdLogin.user'),
//     userName: 'User',
//     password: '123456'
//   }
// ]);

// async function handleAccountLogin(account: Account) {
//   await authStore.login(account.userName, account.password);
// }
</script>

<template>
  <ElForm
    ref="formRef"
    :model="model"
    :rules="rules"
    size="large"
    :show-label="false"
    @keyup.enter="handleSubmit"
  >
    <ElFormItem prop="userName">
      <ElInput
        v-model="model.userName"
        :placeholder="$t('page.login.common.userNamePlaceholder')"
      />
    </ElFormItem>
    <ElFormItem prop="password">
      <ElInput
        v-model="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </ElFormItem>
    <ElFormItem v-if="showImgCode" prop="imageCode">
      <div class="flex items-center gap-2">
        <ElInput
          v-model="model.imageCode"
          :placeholder="$t('page.login.common.imageCodePlaceholder')"
        />
        <img
          :src="imgCodeUrl"
          class="h-10 cursor-pointer"
          :alt="$t('page.login.common.imageCode')"
          @click="reSetImgCode"
        />
      </div>
    </ElFormItem>
    <ElSpace direction="vertical" :size="24" class="w-full" fill>
      <div class="flex-y-center justify-between">
        <ElCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</ElCheckbox>
        <!--
 <ElButton text @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </ElButton>
-->
      </div>
      <ElButton
        type="primary"
        size="large"
        round
        block
        :loading="authStore.loginLoading"
        @click="handleSubmit"
      >
        {{ $t('common.confirm') }}
      </ElButton>
      <!--
 <div class="flex-y-center justify-between gap-12px">
        <ElButton class="flex-1" size="default" @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </ElButton>
        <ElButton class="flex-1" size="default" @click="toggleLoginModule('register')">
          {{ $t(loginModuleRecord.register) }}
        </ElButton>
      </div>
      <ElDivider class="text-14px text-#666 !m-0">{{ $t('page.login.pwdLogin.otherAccountLogin') }}</ElDivider>
      <div class="flex-center gap-12px">
        <ElButton
          v-for="item in accounts"
          :key="item.key"
          size="default"
          type="primary"
          :disabled="authStore.loginLoading"
          @click="handleAccountLogin(item)"
        >
          {{ item.label }}
        </ElButton>
      </div>
-->
    </ElSpace>
  </ElForm>
</template>

<style scoped></style>
