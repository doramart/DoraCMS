<script setup lang="tsx">
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { deleteSystemConfigItem, fetchGetSystemConfigList } from '@/service/api';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import SystemConfigOperateDrawer from './modules/system-config-operate-drawer.vue';

defineOptions({ name: 'SystemConfigManage' });

const { columns, columnChecks, data, getData, loading, mobilePagination } = useTable({
  apiFn: fetchGetSystemConfigList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    { prop: 'key', label: $t('page.manage.systemConfig.key'), minWidth: 120 },
    { prop: 'value', label: $t('page.manage.systemConfig.value'), minWidth: 200 },
    {
      prop: 'type',
      label: $t('page.manage.systemConfig.type'),
      width: 100,
      formatter: (row: any) => {
        const tagMap: Record<string, UI.ThemeColor> = {
          string: 'primary',
          number: 'success',
          boolean: 'warning',
          password: 'danger',
        };
        return <ElTag type={tagMap[row.type]}>{row.type}</ElTag>;
      },
    },
    {
      prop: 'public',
      label: $t('page.manage.systemConfig.public'),
      width: 100,
      formatter: (row: any) => (
        <ElTag type={row.public ? 'success' : 'info'}>
          {row.public ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')}
        </ElTag>
      ),
    },
    { prop: 'updatedAt', label: $t('common.updatedAt'), width: 164 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      formatter: (row: any) => (
        <div class="flex-center">
          <ElButton type="primary" plain size="small" onClick={() => edit(row.id)}>
            {$t('common.edit')}
          </ElButton>
          <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id)}>
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
  const { error } = await deleteSystemConfigItem(checkedRowKeys.value?.map(item => item.id).join(','));
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  const { error } = await deleteSystemConfigItem(id);
  if (!error) {
    onDeleted();
  }
}

function edit(id: string) {
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.systemConfig.title') }}</p>
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
      <SystemConfigOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
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
