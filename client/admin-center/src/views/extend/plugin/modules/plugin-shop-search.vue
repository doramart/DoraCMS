<script setup lang="ts">
import { useForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'PluginShopSearch' });

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useForm();

const model = defineModel<Api.PluginManage.PluginSearchParams>('model', { required: true });

async function reset() {
  await restoreValidation();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}
</script>

<template>
  <ElCard class="card-wrapper">
    <ElForm ref="formRef" :model="model" label-position="right" :label-width="80">
      <ElRow :gutter="24">
        <ElCol :lg="6" :md="8" :sm="12">
          <ElFormItem :label="$t('page.extend.plugin.name')" prop="name">
            <ElInput v-model="model.name" :placeholder="$t('page.extend.plugin.form.name')" />
          </ElFormItem>
        </ElCol>
        <ElCol :lg="6" :md="8" :sm="12">
          <ElFormItem :label="$t('page.extend.plugin.description')" prop="description">
            <ElInput v-model="model.description" :placeholder="$t('page.extend.plugin.form.description')" />
          </ElFormItem>
        </ElCol>
        <ElCol :lg="12" :md="24" :sm="24">
          <ElSpace class="w-full justify-end" alignment="end">
            <ElButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </ElButton>
            <ElButton type="primary" plain @click="search">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </ElButton>
          </ElSpace>
        </ElCol>
      </ElRow>
    </ElForm>
  </ElCard>
</template>

<style scoped></style>
