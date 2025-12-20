<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import type { Component } from 'vue';
import { getPaletteColorByNumber, mixColor } from '@sa/color';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { loginModuleRecord } from '@/constants/app';
import { fetchAdminInitStatus, fetchInitSuperAdmin } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
import ResetPwd from './modules/reset-pwd.vue';
import BindWechat from './modules/bind-wechat.vue';

defineOptions({ name: 'LoginPage' });

interface Props {
  /** The login module */
  module?: UnionKey.LoginModule;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();
const { formRef: initFormRef, validate: validateInitForm, restoreValidation: restoreInitValidation } = useForm();

interface LoginModule {
  label: string;
  component: Component;
}

const moduleMap: Record<UnionKey.LoginModule, LoginModule> = {
  'pwd-login': { label: loginModuleRecord['pwd-login'], component: PwdLogin },
  'code-login': { label: loginModuleRecord['code-login'], component: CodeLogin },
  register: { label: loginModuleRecord.register, component: Register },
  'reset-pwd': { label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  'bind-wechat': { label: loginModuleRecord['bind-wechat'], component: BindWechat }
};

const activeModuleKey = computed<UnionKey.LoginModule>(() => props.module || 'pwd-login');
const activeModule = computed(() => moduleMap[activeModuleKey.value]);
const isPwdLogin = computed(() => activeModuleKey.value === 'pwd-login');

interface InitFormModel {
  userName: string;
  nickName: string;
  userEmail: string;
  password: string;
  confirmPassword: string;
}

interface LoginPrefill {
  userName: string;
  password: string;
}

const needInit = ref(false);
const checkingInitStatus = ref(true);
const initSubmitting = ref(false);
const loginPrefill = ref<LoginPrefill>({ userName: '', password: '' });

const createInitModel = (): InitFormModel => ({
  userName: '',
  nickName: '',
  userEmail: '',
  password: '',
  confirmPassword: '',
});

const initModel = ref<InitFormModel>(createInitModel());

onBeforeMount(async () => {
  await loadInitStatus();
});

async function loadInitStatus() {
  checkingInitStatus.value = true;
  try {
    const { data, error } = await fetchAdminInitStatus();
    if (!error && data) {
      needInit.value = Boolean(data.needInit);
    } else {
      needInit.value = false;
    }
  } finally {
    checkingInitStatus.value = false;
  }
}

const initRules = computed<Record<keyof InitFormModel, App.Global.FormRule[]>>(() => {
  const { formRules, defaultRequiredRule, createConfirmPwdRule } = useFormRules();

  return {
    userName: formRules.userName,
    nickName: [defaultRequiredRule],
    userEmail: formRules.email,
    password: formRules.pwd,
    confirmPassword: createConfirmPwdRule(
      computed(() => initModel.value.password)
    ),
  };
});

const pwdLoginProps = computed(() => ({
  initialUserName: loginPrefill.value.userName,
  initialPassword: loginPrefill.value.password,
}));

function resetInitForm() {
  initModel.value = createInitModel();
  restoreInitValidation();
}

async function handleInitSubmit() {
  await validateInitForm();
  initSubmitting.value = true;
  try {
    const payload: Api.Auth.InitAdminParams = {
      userName: initModel.value.userName,
      nickName: initModel.value.nickName,
      userEmail: initModel.value.userEmail,
      password: initModel.value.password,
    };
    const { error } = await fetchInitSuperAdmin(payload);
    if (!error) {
      window.$message?.success($t('page.login.initAdmin.success'));
      loginPrefill.value = {
        userName: initModel.value.userName,
        password: initModel.value.password,
      };
      needInit.value = false;
      resetInitForm();
    }
  } finally {
    initSubmitting.value = false;
  }
}

const bgThemeColor = computed(() =>
  themeStore.darkMode ? getPaletteColorByNumber(themeStore.themeColor, 600) : themeStore.themeColor
);

const bgColor = computed(() => {
  const COLOR_WHITE = '#ffffff';

  const ratio = themeStore.darkMode ? 0.5 : 0.2;

  return mixColor(COLOR_WHITE, themeStore.themeColor, ratio);
});
</script>

<template>
  <div class="relative size-full flex-center overflow-hidden" :style="{ backgroundColor: bgColor }">
    <WaveBg :theme-color="bgThemeColor" />
    <ElCard class="relative z-4 w-auto rd-12px">
      <div class="w-400px lt-sm:w-300px">
        <header class="flex-y-center justify-between">
          <SystemLogo class="text-64px text-primary lt-sm:text-48px" />
          <h3 class="text-28px text-primary font-500 lt-sm:text-22px">{{ $t('system.title') }}</h3>
          <div class="i-flex-col">
            <ThemeSchemaSwitch
              :theme-schema="themeStore.themeScheme"
              :show-tooltip="false"
              class="text-20px lt-sm:text-18px"
              @switch="themeStore.toggleThemeScheme"
            />
            <LangSwitch
              v-if="themeStore.header.multilingual.visible"
              :lang="appStore.locale"
              :lang-options="appStore.localeOptions"
              :show-tooltip="false"
              @change-lang="appStore.changeLocale"
            />
          </div>
        </header>
        <main class="pt-24px">
          <ElSkeleton v-if="checkingInitStatus" :rows="6" animated />
          <template v-else>
            <template v-if="needInit">
              <h3 class="text-18px text-primary font-medium">
                {{ $t('page.login.initAdmin.title') }}
              </h3>
              <p class="mt-2 text-14px text-#666">
                {{ $t('page.login.initAdmin.description') }}
              </p>
              <ElForm
                ref="initFormRef"
                :model="initModel"
                :rules="initRules"
                label-position="top"
                size="large"
                class="pt-16px"
              >
                <ElFormItem prop="userName" :label="$t('page.login.initAdmin.form.userName')">
                  <ElInput v-model="initModel.userName" autocomplete="off" />
                </ElFormItem>
                <ElFormItem prop="nickName" :label="$t('page.login.initAdmin.form.nickName')">
                  <ElInput v-model="initModel.nickName" autocomplete="off" />
                </ElFormItem>
                <ElFormItem prop="userEmail" :label="$t('page.login.initAdmin.form.email')">
                  <ElInput v-model="initModel.userEmail" type="email" autocomplete="off" />
                </ElFormItem>
                <ElFormItem prop="password" :label="$t('page.login.initAdmin.form.password')">
                  <ElInput v-model="initModel.password" type="password" autocomplete="new-password" />
                </ElFormItem>
                <ElFormItem prop="confirmPassword" :label="$t('page.login.initAdmin.form.confirmPassword')">
                  <ElInput v-model="initModel.confirmPassword" type="password" autocomplete="new-password" />
                </ElFormItem>
                <div class="mt-6 flex justify-end gap-3">
                  <ElButton @click="resetInitForm">{{ $t('common.cancel') }}</ElButton>
                  <ElButton type="primary" :loading="initSubmitting" @click="handleInitSubmit">
                    {{ $t('common.confirm') }}
                  </ElButton>
                </div>
              </ElForm>
            </template>
            <template v-else>
              <h3 class="text-18px text-primary font-medium">{{ $t(activeModule.label) }}</h3>
              <div class="pt-24px">
                <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
                  <component
                    :is="activeModule.component"
                    :key="activeModuleKey"
                    v-bind="isPwdLogin ? pwdLoginProps : {}"
                  />
                </Transition>
              </div>
            </template>
          </template>
        </main>
      </div>
    </ElCard>
  </div>
</template>

<style scoped></style>
