<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'ButtonAuthModal' });

interface Props {
  /** the roleId */
  roleId: number;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false
});

function closeModal() {
  visible.value = false;
}

const title = computed(() => $t('common.edit') + $t('page.manage.role.buttonAuth'));

type ButtonConfig = {
  id: number;
  label: string;
  code: string;
};

const tree = shallowRef<ButtonConfig[]>([]);

async function getAllButtons() {
  // request
  tree.value = [
    { id: 1, label: 'button1', code: 'code1' },
    { id: 2, label: 'button2', code: 'code2' },
    { id: 3, label: 'button3', code: 'code3' },
    { id: 4, label: 'button4', code: 'code4' },
    { id: 5, label: 'button5', code: 'code5' },
    { id: 6, label: 'button6', code: 'code6' },
    { id: 7, label: 'button7', code: 'code7' },
    { id: 8, label: 'button8', code: 'code8' },
    { id: 9, label: 'button9', code: 'code9' },
    { id: 10, label: 'button10', code: 'code10' }
  ];
}

const checks = shallowRef<number[]>([]);

async function getChecks() {
  // eslint-disable-next-line no-console
  console.log(props.roleId);
  // request
  checks.value = [1, 2, 3, 4, 5];
}

function checkChange(val: ButtonConfig) {
  const idx = checks.value.indexOf(val.id);
  if (idx === -1) {
    checks.value.push(val.id);
  } else {
    checks.value.splice(idx, 1);
  }
}

function handleSubmit() {
  // eslint-disable-next-line no-console
  console.log(checks.value, props.roleId);
  // request

  window.$message?.success?.($t('common.modifySuccess'));

  closeModal();
}

function init() {
  getAllButtons();
  getChecks();
}

// init
init();
</script>

<template>
  <ElDialog v-model="visible" :title="title" preset="card" class="w-480px">
    <ElTree
      v-model:checked-keys="checks"
      :data="tree"
      node-key="id"
      show-checkbox
      class="h-280px"
      :default-checked-keys="checks"
      @check-change="checkChange"
    />
    <template #footer>
      <ElSpace class="w-full justify-end">
        <ElButton size="small" class="mt-16px" @click="closeModal">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" size="small" class="mt-16px" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped></style>
