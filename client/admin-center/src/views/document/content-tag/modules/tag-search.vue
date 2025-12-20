<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { computed } from 'vue';
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { $t } from '@/locales';

interface Props {
  loading?: boolean;
  model: Record<string, any>;
}

interface Emits {
  (e: 'update:model', model: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'search'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchModel = computed({
  get: () => props.model,
  set: value => {
    emit('update:model', value);
  },
});

function handleSearch() {
  emit('search');
}

function handleReset() {
  emit('reset');
}

defineOptions({
  name: 'TagSearch',
});
</script>

<template>
  <ElCard class="card-wrapper">
    <ElForm :model="searchModel" inline class="flex-y-center">
      <ElFormItem prop="searchkey">
        <ElInput
          v-model="searchModel.searchkey"
          :placeholder="$t('common.keywordSearch')"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
      </ElFormItem>
      <ElFormItem>
        <ElButton @click="handleReset">
          <template #icon>
            <icon-ic-round-refresh class="text-icon" />
          </template>
          {{ $t('common.reset') }}
        </ElButton>
        <ElButton type="primary" plain :loading="loading" @click="handleSearch">
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
          {{ $t('common.search') }}
        </ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>
