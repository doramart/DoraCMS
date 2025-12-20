<script setup lang="ts" name="TemplateSearch">
import { useForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'TemplateSearch' });

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useForm();

const model = defineModel<Api.Email.MailTemplateSearchParams>('model', { required: true });

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
        <ElCol :lg="6" :md="6" :sm="6">
          <ElFormItem :label="$t('page.email.mailTemplate.templateTitle')" prop="searchkey">
            <ElInput v-model="model.searchkey" clearable :placeholder="$t('page.email.mailTemplate.form.title')" />
          </ElFormItem>
        </ElCol>
        <ElCol :lg="4" :md="4" :sm="4">
          <ElSpace class="w-full justify-start" alignment="end">
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
