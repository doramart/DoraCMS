<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="tsx">
import { nextTick, ref } from 'vue';
import { ElButton, ElMessage, ElMessageBox, ElPopconfirm, ElTag } from 'element-plus';
import { deleteContentTag, getContentTag, getContentTagList } from '@/service/api/content-tag';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TagSearch from './modules/tag-search.vue';
import TagOperateDrawer from './modules/tag-operate-drawer.vue';

defineOptions({ name: 'ContentTagManage' });

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
  apiFn: getContentTagList,
  showTotal: true,
  apiParams: {
    current: 1,
    pageSize: 10,
    searchkey: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    { prop: 'name', label: $t('common.name'), minWidth: 120 },
    { prop: 'comments', label: $t('common.description'), minWidth: 200 },
    { prop: 'createdAt', label: $t('common.createdAt'), width: 180 },
    {
      prop: 'operate',
      label: $t('common.action'),
      width: 160,
      fixed: 'right',
      formatter: row => (
        <div class="flex-center">
          <ElButton type="primary" link onClick={() => edit(row.id!)}>
            {$t('common.edit')}
          </ElButton>
          <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id!)}>
            {{
              reference: () => (
                <ElButton type="danger" link>
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

  const ids = checkedRowKeys.value?.map(item => item.id).join(',');
  const { error } = await deleteContentTag(ids);
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  const { error } = await deleteContentTag(id);
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
    <TagSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('common.contentTag') }}</p>
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
      <TagOperateDrawer
        ref="drawerRef"
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
