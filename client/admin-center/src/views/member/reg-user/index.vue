<script setup lang="tsx">
// import { ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { deleteRegUser, getRegUserList } from '@/service/api/reg-user';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import UserSearch from './modules/user-search.vue';
import UserOperateDrawer from './modules/user-operate-drawer.vue';

defineOptions({ name: 'RegUserManage' });

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
  apiFn: getRegUserList,
  showTotal: true,
  apiParams: {
    current: 1,
    pageSize: 10,
    searchkey: undefined,
    enable: undefined,
    userName: undefined,
    phoneNum: undefined,
    email: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'userName', label: $t('page.member.regUser.userName'), minWidth: 120 },
    { prop: 'phoneNum', label: $t('page.member.regUser.phone'), minWidth: 120 },
    // { prop: 'group', label: $t('page.member.regUser.role'), width: 100 },
    {
      prop: 'enable',
      label: $t('page.member.regUser.status'),
      width: 100,
      formatter: (row: any) => (
        <ElTag type={row.enable ? 'success' : 'danger'}>
          {row.enable ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable')}
        </ElTag>
      ),
    },
    { prop: 'email', label: $t('page.member.regUser.email'), minWidth: 180 },
    { prop: 'createdAt', label: $t('page.member.regUser.registerTime'), width: 180 },

    {
      prop: 'operate',
      label: $t('common.action'),
      width: 160,
      fixed: 'right',
      formatter: (row: any) => (
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

const { drawerVisible, operateType, editingData, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, getData);

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) return;

  const ids = checkedRowKeys.value?.map(item => item.id).join(',');
  const { error } = await deleteRegUser(ids);
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  const { error } = await deleteRegUser(id);
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
    <UserSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.member.regUser.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="false"
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
      <UserOperateDrawer
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
