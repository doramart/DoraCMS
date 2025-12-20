<script setup lang="ts">
import { reactive } from 'vue';
import { useEventBus } from '@vueuse/core';

interface SearchForm {
  name: string;
  type: string;
  state: boolean | null;
}

const form = reactive<SearchForm>({
  name: '',
  type: '',
  state: null
});

const bus = useEventBus('ads-search');

function search() {
  bus.emit(form);
}

function reset() {
  form.name = '';
  form.type = '';
  form.state = null;
  search();
}
</script>

<template>
  <ElForm :model="form" class="mb-16px" inline>
    <ElFormItem :label="$t('page.document.ads.name')">
      <ElInput v-model="form.name" clearable @keyup.enter="search" />
    </ElFormItem>
    <ElFormItem :label="$t('page.document.ads.type')">
      <ElSelect v-model="form.type" clearable>
        <ElOption :label="$t('page.document.ads.type_image')" value="1" />
        <ElOption :label="$t('page.document.ads.type_text')" value="0" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem :label="$t('page.document.ads.state')">
      <ElSelect v-model="form.state" clearable>
        <ElOption :label="$t('common.yes')" :value="true" />
        <ElOption :label="$t('common.no')" :value="false" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem>
      <ElButton type="primary" @click="search">{{ $t('common.search') }}</ElButton>
      <ElButton @click="reset">{{ $t('common.reset') }}</ElButton>
    </ElFormItem>
  </ElForm>
</template>
