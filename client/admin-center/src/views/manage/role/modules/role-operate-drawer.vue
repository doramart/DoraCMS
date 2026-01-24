<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions } from '@/constants/business';
import { createRoleItem as addRole, updateRoleItem as updateRole } from '@/service/api';
import { executeRequestCompat } from '@/utils/request-helper';
import { $t } from '@/locales';
import MenuAuthModal from './menu-auth-modal.vue';

defineOptions({ name: 'RoleOperateDrawer' });

interface Props {
  visible: boolean;
  operateType: 'add' | 'edit';
  rowData?: Record<string, any>;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'submitted'): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const isVisible = ref(props.visible);

watch(
  () => props.visible,
  val => {
    isVisible.value = val;
  }
);

watch(isVisible, val => {
  emits('update:visible', val);
});

const title = computed(() => {
  const type = props.operateType === 'add' ? 'add' : 'edit';
  return $t(`common.${type}`) + $t('page.manage.role.title');
});

interface RoleModel {
  roleName: string;
  roleCode: string;
  roleDesc: string;
  status: string;
  menus: string[];
  buttons: string[];
}

const model = ref<RoleModel>({
  roleName: '',
  roleCode: '',
  roleDesc: '',
  status: '1',
  menus: [],
  buttons: [],
});

const menuAuthVisible = ref(false);

/** 初始化表单数据 */
function initFormData() {
  if (props.operateType === 'edit' && props.rowData) {
    const { roleName, roleCode, roleDesc, status, menus = [], buttons = [] } = props.rowData;
    model.value = {
      roleName,
      roleCode,
      roleDesc,
      status: status || '1',
      menus,
      buttons,
    };
  } else {
    model.value = {
      roleName: '',
      roleCode: '',
      roleDesc: '',
      status: '1',
      menus: [],
      buttons: [],
    };
  }
}

/** 打开菜单权限弹窗 */
function openMenuAuth() {
  menuAuthVisible.value = true;
}

/** 处理菜单权限提交 */
function handleMenuAuthSubmit(data: { menus: string[]; buttons: string[] }) {
  model.value.menus = data.menus;
  model.value.buttons = data.buttons;
}

/** 处理表单提交 */
async function handleSubmit() {
  const submitData = {
    ...model.value,
    id: props.operateType === 'add' ? undefined : props.rowData?.id,
    createBy: props.rowData?.createBy || '',
    createdAt: props.rowData?.createdAt || '',
    updateBy: props.rowData?.updateBy || '',
    updatedAt: props.rowData?.updatedAt || '',
    status: model.value.status as Api.Common.EnableStatus,
  };

  const requestObj = props.operateType === 'add' ? addRole : updateRole;
  const success = await executeRequestCompat(() => requestObj(submitData as Api.SystemManage.Role));

  if (success) {
    window.$message?.success($t('common.modifySuccess'));
    emits('submitted');
    closeDrawer();
  }
}

/** 关闭抽屉 */
function closeDrawer() {
  isVisible.value = false;
}

watch(
  () => props.visible,
  val => {
    if (val) {
      initFormData();
    }
  }
);
</script>

<template>
  <ElDrawer v-model="isVisible" :title="title" size="500px" destroy-on-close>
    <ElForm :model="model" label-width="100px">
      <ElFormItem :label="$t('page.manage.role.roleName')" required>
        <ElInput v-model="model.roleName" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleCode')" required>
        <ElInput v-model="model.roleCode" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleDesc')">
        <ElInput v-model="model.roleDesc" type="textarea" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleStatus')" prop="status">
        <ElRadioGroup v-model="model.status">
          <ElRadio v-for="{ label, value } in enableStatusOptions" :key="value" :value="value" :label="$t(label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.menuAuth')">
        <ElButton type="primary" @click="openMenuAuth">
          {{ $t('common.config') }}
        </ElButton>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace>
        <ElButton @click="closeDrawer">
          {{ $t('common.cancel') }}
        </ElButton>
        <ElButton type="primary" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </ElButton>
      </ElSpace>
    </template>

    <MenuAuthModal
      v-model:visible="menuAuthVisible"
      :default-menu-ids="model.menus"
      :default-button-codes="model.buttons"
      @submit="handleMenuAuthSubmit"
    />
  </ElDrawer>
</template>

<style scoped></style>
