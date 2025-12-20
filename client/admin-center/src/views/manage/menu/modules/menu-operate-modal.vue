<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, menuIconTypeOptions, menuTypeOptions } from '@/constants/business';
import { createMenuItem, fetchGetAllRoles, updateMenuItem } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { getLocalIcons } from '@/utils/icon';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import {
  getLayoutAndPage,
  getPathParamFromRoutePath,
  getRoutePathByRouteName,
  getRoutePathWithParam,
  transformLayoutAndPageToComponent,
} from './shared';

defineOptions({ name: 'MenuOperateModal' });

export type OperateType = UI.TableOperateType | 'addChild';

interface Props {
  /** the type of operation */
  operateType: OperateType;
  /** the edit menu data or the parent menu data when adding a child menu */
  rowData?: Api.SystemManage.Menu | null;
  /** all pages */
  allPages: string[];
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
  const titles: Record<OperateType, string> = {
    add: $t('page.manage.menu.addMenu'),
    addChild: $t('page.manage.menu.addChildMenu'),
    edit: $t('page.manage.menu.editMenu'),
  };
  return titles[props.operateType];
});

type Model = Pick<
  Api.SystemManage.Menu,
  | 'menuType'
  | 'menuName'
  | 'routeName'
  | 'routePath'
  | 'component'
  | 'order'
  | 'i18nKey'
  | 'icon'
  | 'iconType'
  | 'status'
  | 'parentId'
  | 'keepAlive'
  | 'constant'
  | 'href'
  | 'hideInMenu'
  | 'activeMenu'
  | 'multiTab'
  | 'fixedIndexInTab'
> & {
  query: NonNullable<Api.SystemManage.Menu['query']>;
  buttons: MenuButtonModel[];
  layout: string;
  page: string;
  pathParam: string;
};

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    menuType: '1',
    menuName: '',
    routeName: '',
    routePath: '',
    pathParam: '',
    component: '',
    layout: '',
    page: '',
    i18nKey: null,
    icon: '',
    iconType: '1',
    parentId: '0',
    status: '1',
    keepAlive: false,
    constant: false,
    order: 0,
    href: null,
    hideInMenu: false,
    activeMenu: undefined,
    multiTab: false,
    fixedIndexInTab: undefined,
    query: [],
    buttons: [] as MenuButtonModel[],
  };
}

type RuleKey = Extract<keyof Model, 'menuName' | 'status' | 'routeName' | 'routePath'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  menuName: defaultRequiredRule,
  status: defaultRequiredRule,
  routeName: defaultRequiredRule,
  routePath: defaultRequiredRule,
};

const disabledMenuType = computed(() => props.operateType === 'edit');

const localIcons = getLocalIcons();
const localIconOptions = localIcons.map(item => ({
  label: () => (
    <div class="flex-y-center gap-16px">
      <SvgIcon localIcon={item} class="text-icon" />
      <span>{item}</span>
    </div>
  ),
  value: item,
}));

const showLayout = computed(() => model.value.parentId === '0');

const showPage = computed(() => model.value.menuType === '2');

const pageOptions = computed(() => {
  const allPages = [...props.allPages];

  if (model.value.routeName && !allPages.includes(model.value.routeName)) {
    allPages.unshift(model.value.routeName);
  }

  const opts: CommonType.Option[] = allPages.map(page => ({
    label: page,
    value: page,
  }));

  return opts;
});

const layoutOptions: CommonType.Option[] = [
  { label: 'base', value: 'base' },
  { label: 'blank', value: 'blank' },
];

/** the enabled role options */
const roleOptions = ref<CommonType.Option<string>[]>([]);

const httpMethodOptions: CommonType.Option<string>[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => ({
  label: method,
  value: method,
}));

async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles();

  if (!error) {
    const options = data.map((item: any) => ({
      label: item.roleName,
      value: item.roleCode,
    }));

    roleOptions.value = [...options];
  }
}

/** - add a query input */
function addQuery(index: number) {
  model.value.query.splice(index + 1, 0, { key: '', value: '' });
}

/** - remove a query input */
function removeQuery(index: number) {
  model.value.query.splice(index, 1);
}

/** - add a button input */
type MenuButtonModel = Required<NonNullable<Api.SystemManage.Menu['buttons']>>[number];

function createEmptyButton(): MenuButtonModel {
  return {
    desc: '',
    api: '',
    permissionCode: '',
    httpMethod: 'POST',
  };
}

function normalizeButtons(buttons: NonNullable<Api.SystemManage.Menu['buttons']>) {
  return buttons.map(button => ({
    desc: button.desc ?? '',
    api: button.api ?? '',
    permissionCode: button.permissionCode ?? '',
    httpMethod: (button.httpMethod ?? 'POST').toUpperCase() as MenuButtonModel['httpMethod'],
  }));
}

function addButton(index: number) {
  model.value.buttons.splice(index + 1, 0, createEmptyButton());
}

/** - remove a button input */
function removeButton(index: number) {
  model.value.buttons.splice(index, 1);
}

function handleInitModel() {
  // 🔥 修复：完全重置 model，避免残留字段（如 id, url）
  model.value = createDefaultModel();

  if (!props.rowData) return;

  if (props.operateType === 'addChild') {
    const { id } = props.rowData;

    Object.assign(model.value, { parentId: id });
  }

  if (props.operateType === 'edit') {
    const { component, url: _url, ...rest } = props.rowData; // 🔥 排除 url 字段

    const { layout, page } = getLayoutAndPage(component);
    const { path, param } = getPathParamFromRoutePath(rest.routePath);

    model.value = {
      ...model.value,
      ...rest,
      layout,
      page,
      routePath: path,
      pathParam: param,
    };
  }

  if (!model.value.query) {
    model.value.query = [];
  }
  if (!model.value.buttons) {
    model.value.buttons = [];
  }
  model.value.buttons = normalizeButtons(model.value.buttons);
}

function closeDrawer() {
  visible.value = false;
}

function handleUpdateRoutePathByRouteName() {
  if (model.value.routeName) {
    model.value.routePath = getRoutePathByRouteName(model.value.routeName);
  } else {
    model.value.routePath = '';
  }
}

function handleUpdateI18nKeyByRouteName() {
  if (model.value.routeName) {
    model.value.i18nKey = `route.${model.value.routeName}` as App.I18n.I18nKey;
  } else {
    model.value.i18nKey = null;
  }
}

function getSubmitParams() {
  const { layout, page, pathParam, ...params } = model.value;

  const component = transformLayoutAndPageToComponent(layout, page);
  const routePath = getRoutePathWithParam(model.value.routePath, pathParam);

  params.component = component;
  params.routePath = routePath;

  // 🔥 修复：清理不应提交到后端的字段
  const result: any = params;

  // 新增时排除 id 和 url
  if (props.operateType === 'add' || props.operateType === 'addChild') {
    delete result.id;
    delete result.url;
  }

  // 排除虚拟字段和临时字段（这些是后端计算或前端展示用的）
  delete result.statusText;
  delete result.menuTypeText;
  delete result.hasParent;
  delete result.levelText;
  delete result.children;
  delete result.createdAt;
  delete result.updatedAt;

  return result;
}

const validatePermissionCodes = () => {
  const codes = model.value.buttons.map(button => button.permissionCode);
  const uniqueCodes = new Set(codes);
  return codes.length === uniqueCodes.size;
};

// 🔒 API安全验证函数
const validateButtonApis = () => {
  const errors: string[] = [];

  model.value.buttons.forEach((button, index) => {
    if (!button.api) return;

    // 验证API格式
    const apiPattern = /^[a-zA-Z][a-zA-Z0-9]*\/[a-zA-Z][a-zA-Z0-9]*$/;
    if (!apiPattern.test(button.api)) {
      errors.push(`${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.formatError')}`);
    }

    // 验证API长度
    if (button.api.length > 100) {
      errors.push(`${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.tooLong')}`);
    }

    // 验证危险字符
    const dangerousChars = /(\.\.|\/\/)/;
    if (dangerousChars.test(button.api)) {
      errors.push(
        `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.dangerousChars')}`
      );
    }

    // 验证操作名格式和安全性
    const parts = button.api.split('/');
    if (parts.length === 2) {
      const operation = parts[1];

      // 验证操作名格式
      const operationPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
      if (!operationPattern.test(operation)) {
        errors.push(
          `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.operationFormatError')}`
        );
      }

      // 防止危险操作名
      const dangerousOperations = [
        'eval',
        'exec',
        'system',
        'shell',
        'cmd',
        'deleteAll',
        'dropTable',
        'truncate',
        'format',
        'rm',
        'rmdir',
        'unlink',
        'destroy',
      ];

      if (dangerousOperations.includes(operation)) {
        errors.push(
          `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.dangerousOperation')}`
        );
      }

      // 操作名长度限制
      if (operation.length > 50) {
        errors.push(
          `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.operationTooLong')}`
        );
      }
    }
  });

  return errors;
};

// 🔒 单个API验证函数（实时验证）
const validateSingleButtonApi = (button: any, index: number) => {
  if (!button.api) return;

  const apiPattern = /^[a-zA-Z][a-zA-Z0-9]*\/[a-zA-Z][a-zA-Z0-9]*$/;
  if (!apiPattern.test(button.api)) {
    window.$message?.warning(
      `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.formatError')}`
    );
    return;
  }

  const dangerousChars = /[<>\"'&\s]/;
  const dangerousSequences = /(\.\.|\/\/)/;
  if (dangerousChars.test(button.api) || dangerousSequences.test(button.api)) {
    window.$message?.warning(
      `${$t('common.button')} ${index + 1}: ${$t('page.manage.menu.security.apiValidation.dangerousChars')}`
    );
    return;
  }
};

async function handleSubmit() {
  await validate();

  if (!validatePermissionCodes()) {
    window.$message?.error($t('page.manage.menu.form.buttonPermissionCodeDuplicate' as App.I18n.I18nKey));
    return;
  }

  // 🔒 API安全验证
  const apiErrors = validateButtonApis();
  if (apiErrors.length > 0) {
    window.$message?.error(`${$t('page.manage.menu.security.configErrors')}：\n${apiErrors.join('\n')}`);
    return;
  }

  const params: any = getSubmitParams();

  // eslint-disable-next-line no-console
  // console.log('params: ', props.operateType);
  const requestObj = props.operateType === 'edit' ? updateMenuItem : createMenuItem;
  const success = await executeRequestCompat(() => requestObj(params));

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
    getRoleOptions();
  }
});

watch(
  () => model.value.routeName,
  () => {
    handleUpdateRoutePathByRouteName();
    handleUpdateI18nKeyByRouteName();
  }
);
</script>

<template>
  <ElDialog v-model="visible" :title="title" preset="card" class="w-1100px">
    <ElScrollbar class="h-480px pr-20px">
      <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
        <ElRow>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuType')" prop="menuType">
              <ElRadioGroup v-model="model.menuType" :disabled="disabledMenuType">
                <ElRadio
                  v-for="item in menuTypeOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="$t(item.label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuName')" prop="menuName">
              <ElInput v-model="model.menuName" :placeholder="$t('page.manage.menu.form.menuName')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.routeName')" prop="routeName">
              <ElInput v-model="model.routeName" :placeholder="$t('page.manage.menu.form.routeName')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.routePath')" prop="routePath">
              <ElInput v-model="model.routePath" disabled :placeholder="$t('page.manage.menu.form.routePath')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.pathParam')" prop="pathParam">
              <ElInput v-model="model.pathParam" :placeholder="$t('page.manage.menu.form.pathParam')" />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="showLayout" :span="12">
            <ElFormItem :label="$t('page.manage.menu.layout')" prop="layout">
              <ElSelect v-model="model.layout" clearable :placeholder="$t('page.manage.menu.form.layout')">
                <ElOption
                  v-for="{ label, value } in layoutOptions"
                  :key="value"
                  :label="label"
                  :value="value"
                ></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="showPage" :span="12">
            <ElFormItem :label="$t('page.manage.menu.page')" prop="page">
              <ElSelect v-model="model.page" clearable :placeholder="$t('page.manage.menu.form.page')">
                <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value"></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.i18nKey')" prop="i18nKey">
              <ElInput v-model="model.i18nKey" :placeholder="$t('page.manage.menu.form.i18nKey')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.order')" prop="order">
              <ElInputNumber v-model="model.order" class="w-full" :placeholder="$t('page.manage.menu.form.order')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.iconTypeTitle')" prop="iconType">
              <ElRadioGroup v-model="model.iconType">
                <ElRadio
                  v-for="item in menuIconTypeOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="$t(item.label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.icon')" prop="icon">
              <template v-if="model.iconType === '1'">
                <ElInput v-model="model.icon" :placeholder="$t('page.manage.menu.form.icon')" class="flex-1">
                  <template #suffix>
                    <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
                  </template>
                </ElInput>
              </template>
              <template v-if="model.iconType === '2'">
                <ElSelect
                  v-model="model.icon"
                  :placeholder="$t('page.manage.menu.form.localIcon')"
                  :options="localIconOptions"
                />
              </template>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuStatus')" prop="status">
              <ElRadioGroup v-model="model.status">
                <ElRadio
                  v-for="{ label, value } in enableStatusOptions"
                  :key="value"
                  :value="value"
                  :label="$t(label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.keepAlive')" prop="keepAlive">
              <ElRadioGroup v-model="model.keepAlive">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.constant')" prop="constant">
              <ElRadioGroup v-model="model.constant">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.href')" prop="href">
              <ElInput v-model="model.href" :placeholder="$t('page.manage.menu.form.href')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.hideInMenu')" prop="hideInMenu">
              <ElRadioGroup v-model="model.hideInMenu">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="model.hideInMenu" :span="12">
            <ElFormItem :label="$t('page.manage.menu.activeMenu')" prop="activeMenu">
              <ElSelect
                v-model="model.activeMenu"
                :options="pageOptions"
                clearable
                :placeholder="$t('page.manage.menu.form.activeMenu')"
              >
                <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value"></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.multiTab')" prop="multiTab">
              <ElRadioGroup v-model="model.multiTab">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.fixedIndexInTab')" prop="fixedIndexInTab">
              <ElInputNumber
                v-model="model.fixedIndexInTab"
                class="w-full"
                clearable
                :placeholder="$t('page.manage.menu.form.fixedIndexInTab')"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem :label="$t('page.manage.menu.query')" prop="query">
              <ElButton v-if="model.query.length === 0" class="w-full border-dashed" @click="addQuery(-1)">
                <template #icon>
                  <icon-carbon-add class="align-sub text-icon" />
                </template>
                <span class="ml-8px">{{ $t('common.add') }}</span>
              </ElButton>
              <template v-else>
                <div v-for="(item, index) in model.query" :key="index" class="flex gap-3">
                  <ElCol :span="10">
                    <ElFormItem :prop="['query', index.toString(), 'key']">
                      <ElInput v-model="item.key" :placeholder="$t('page.manage.menu.form.queryKey')" class="flex-1" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="10">
                    <ElFormItem :prop="['query', index.toString(), 'value']">
                      <ElInput
                        v-model="item.value"
                        :placeholder="$t('page.manage.menu.form.queryValue')"
                        class="flex-1"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="4">
                    <ElSpace class="ml-12px">
                      <ElButton @click="addQuery(index)">
                        <template #icon>
                          <icon-ic:round-plus class="align-sub text-icon" />
                        </template>
                      </ElButton>
                      <ElButton @click="removeQuery(index)">
                        <template #icon>
                          <icon-ic-round-remove class="align-sub text-icon" />
                        </template>
                      </ElButton>
                    </ElSpace>
                  </ElCol>
                </div>
              </template>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem :label-col="{ span: 4 }" :label="$t('page.manage.menu.button')" prop="buttons">
              <ElButton v-if="model.buttons.length === 0" class="w-full border-dashed" @click="addButton(-1)">
                <template #icon>
                  <icon-carbon-add class="align-sub text-icon" />
                </template>
                <span class="ml-8px">{{ $t('common.add') }}</span>
              </ElButton>
              <template v-else>
                <div v-for="(item, index) in model.buttons" :key="index" class="flex flex-wrap gap-3">
                  <ElCol :span="5">
                    <ElFormItem :prop="['buttons', index.toString(), 'desc']">
                      <ElInput
                        v-model="item.desc"
                        :placeholder="$t('page.manage.menu.form.buttonDesc')"
                        class="flex-1"
                      ></ElInput>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="6">
                    <ElFormItem :prop="['buttons', index.toString(), 'permissionCode']">
                      <ElInput
                        v-model="item.permissionCode"
                        :placeholder="$t('page.manage.menu.form.buttonPermissionCode')"
                        class="flex-1"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="3">
                    <ElFormItem :prop="['buttons', index.toString(), 'httpMethod']">
                      <ElSelect
                        v-model="item.httpMethod"
                        clearable
                        :placeholder="$t('page.manage.menu.form.buttonHttpMethod')"
                      >
                        <ElOption
                          v-for="{ label, value } in httpMethodOptions"
                          :key="value"
                          :label="label"
                          :value="value"
                        />
                      </ElSelect>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="6">
                    <ElFormItem :prop="['buttons', index.toString(), 'api']">
                      <ElInput
                        v-model="item.api"
                        :placeholder="$t('page.manage.menu.form.buttonApi')"
                        class="flex-1"
                        @blur="validateSingleButtonApi(item, index)"
                      >
                        <template #suffix>
                          <ElTooltip :content="$t('page.manage.menu.security.apiFormatTip')" placement="top">
                            <span class="text-xs text-gray-400 cursor-help">?</span>
                          </ElTooltip>
                        </template>
                      </ElInput>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="2">
                    <ElSpace class="ml-12px">
                      <ElButton @click="addButton(index)">
                        <template #icon>
                          <icon-ic:round-plus class="align-sub text-icon" />
                        </template>
                      </ElButton>
                      <ElButton @click="removeButton(index)">
                        <template #icon>
                          <icon-ic-round-remove class="align-sub text-icon" />
                        </template>
                      </ElButton>
                    </ElSpace>
                  </ElCol>
                </div>
              </template>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElScrollbar>
    <template #footer>
      <ElSpace :size="16" class="float-right">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped></style>
