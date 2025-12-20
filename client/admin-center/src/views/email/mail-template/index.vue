<script setup lang="tsx" name="MailTemplateManage">
import { ref } from 'vue';
import { ElButton, ElPopconfirm } from 'element-plus';
import {
  deleteMailTemplate,
  fetchGetMailTemplateList,
  fetchGetMailTemplateTypeList,
} from '@/service/api/mail-template';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TemplateOperateDrawer from './modules/template-operate-drawer.vue';
import TemplateSearch from './modules/template-search.vue';

defineOptions({ name: 'MailTemplateManage' });

const templateTypeOptions = ref<Record<string, string>>({});

async function getMailTemplateTypeList() {
  try {
    const { data } = await fetchGetMailTemplateTypeList();
    if (data) {
      templateTypeOptions.value = data;
    }
  } catch (error) {
    console.error('Failed to get mail template types:', error);
  }
}

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetchGetMailTemplateList,
  showTotal: true,
  apiParams: {
    current: 1,
    pageSize: 10,
    searchkey: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    {
      prop: 'type',
      label: $t('page.email.mailTemplate.type'),
      width: 150,
      formatter: row => templateTypeOptions.value[row.type] || row.type,
    },
    { prop: 'comment', label: $t('page.email.mailTemplate.comment'), minWidth: 120 },
    { prop: 'title', label: $t('page.email.mailTemplate.templateTitle'), minWidth: 180 },
    { prop: 'createdAt', label: $t('page.email.mailTemplate.createdAt'), minWidth: 150 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      formatter: row => (
        <div class="flex-center">
          <ElButton type="primary" plain size="small" onClick={() => edit(row.id || '')}>
            {$t('common.edit')}
          </ElButton>
          <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id || '')}>
            {{
              reference: () => (
                <ElButton type="danger" plain size="small">
                  {$t('common.delete')}
                </ElButton>
              ),
            }}
          </ElPopconfirm>
        </div>
      ),
    },
  ],
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, getData);

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) return;

  const ids = checkedRowKeys.value
    .filter(item => item && typeof item === 'object' && 'id' in item)
    .map((item: any) => String(item.id))
    .join(',');

  if (!ids) return;

  const { error } = await deleteMailTemplate(ids);
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  if (!id) return;
  const { error } = await deleteMailTemplate(id);
  if (!error) {
    onDeleted();
  }
}

function edit(id: string) {
  console.log('🚀 ~ edit ~ id:', id);
  if (!id) return;
  handleEdit(id);
}

// Fetch template types on mounted
getMailTemplateTypeList();
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <TemplateSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.email.mailTemplate.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </div>
      </template>
      <div class="h-[calc(100%-50px)]">
        <ElTable
          v-loading="loading"
          height="100%"
          border
          class="sm:h-full"
          :data="data"
          row-key="id"
          @selection-change="checkedRowKeys = $event"
        >
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col" />
        </ElTable>
      </div>
      <div class="mt-20px flex justify-end">
        <ElPagination
          v-if="mobilePagination.total"
          layout="total,prev,pager,next,sizes"
          v-bind="mobilePagination"
          @current-change="mobilePagination['current-change']"
          @size-change="mobilePagination['size-change']"
        />
      </div>
      <TemplateOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}
</style>
