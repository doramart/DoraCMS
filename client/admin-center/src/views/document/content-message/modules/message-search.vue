<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus';
import { useForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'MessageSearch' });

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useForm();

const model = defineModel<Api.DocumentManage.ContentMessageSearchParams>('model', {
  required: true,
});

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
        <ElCol :lg="8" :md="12" :sm="24">
          <ElFormItem :label="$t('page.document.contentMessage.content')" prop="searchkey">
            <ElInput v-model="model.searchkey" :placeholder="$t('page.document.contentMessage.form.searchContent')" />
          </ElFormItem>
        </ElCol>
        <ElCol :lg="8" :md="12" :sm="24">
          <ElFormItem :label="$t('page.document.contentMessage.auditStatus')" prop="auditStatus">
            <ElSelect v-model="model.auditStatus" :placeholder="$t('page.document.contentMessage.form.selectAuditStatus')" clearable>
              <ElOption :label="$t('page.document.contentMessage.auditStatusOptions.pending')" value="pending" />
              <ElOption :label="$t('page.document.contentMessage.auditStatusOptions.approved')" value="approved" />
              <ElOption :label="$t('page.document.contentMessage.auditStatusOptions.rejected')" value="rejected" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :lg="8" :md="24" :sm="24">
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
