<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { computed } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { enableStatusOptions } from '@/constants/business';
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
  }
});

const statusOptions = enableStatusOptions;

function handleSearch() {
  emit('search');
}

function handleReset() {
  emit('reset');
}

defineOptions({
  name: 'UserSearch'
});
</script>

<template>
  <ElCard class="card-wrapper">
    <ElForm :model="searchModel" inline class="flex-y-center">
      <ElFormItem :label="$t('page.member.regUser.userName')" prop="userName">
        <ElInput
          v-model="searchModel.userName"
          :placeholder="$t('common.input.placeholder')"
          clearable
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.member.regUser.phone')" prop="phoneNum">
        <ElInput
          v-model="searchModel.phoneNum"
          :placeholder="$t('common.input.placeholder')"
          clearable
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.member.regUser.email')" prop="email">
        <ElInput
          v-model="searchModel.email"
          :placeholder="$t('common.input.placeholder')"
          clearable
          @keyup.enter="handleSearch"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.member.regUser.status')" prop="status">
        <ElSelect v-model="searchModel.enable" class="w-200px">
          <ElOption v-for="item in statusOptions" :key="item.value" :label="$t(item.label)" :value="item.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" :loading="loading" @click="handleSearch">
          {{ $t('common.search') }}
        </ElButton>
        <ElButton @click="handleReset">
          {{ $t('common.reset') }}
        </ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>
