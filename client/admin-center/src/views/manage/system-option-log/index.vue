<script setup lang="tsx">
import { ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import {
  deleteAllSystemOptionLogs,
  deleteSystemOptionLog,
  fetchSystemOptionLogList,
} from '@/service/api/system-option-log';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import LogSearch from './modules/log-search.vue';
import LogDetailDrawer from './modules/log-detail-drawer.vue';

defineOptions({ name: 'SystemOptionLogManage' });

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
  apiFn: fetchSystemOptionLogList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    type: undefined,
    module: undefined,
    action: undefined,
    user_name: undefined,
    user_type: undefined,
    severity: undefined,
    environment: undefined,
    ip_address: undefined,
    start_date: undefined,
    end_date: undefined,
    keyword: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    {
      prop: 'type',
      label: $t('page.manage.systemOptionLog.type'),
      width: 120,
      formatter: row => {
        const typeTagMap: Record<string, UI.ThemeColor> = {
          login: 'success',
          logout: 'info',
          exception: 'danger',
          operation: 'primary',
          access: '',
          error: 'danger',
          warning: 'warning',
          info: 'info',
          debug: 'info',
        };
        return <ElTag type={typeTagMap[row.type]}>{$t(`page.manage.systemOptionLog.typeOptions.${row.type}`)}</ElTag>;
      },
    },
    {
      prop: 'module',
      label: $t('page.manage.systemOptionLog.module'),
      width: 120,
      formatter: row => (row.module ? <ElTag size="small">{row.module}</ElTag> : '-'),
    },
    {
      prop: 'action',
      label: $t('page.manage.systemOptionLog.action'),
      width: 120,
      formatter: row =>
        row.action ? (
          <ElTag type="primary" size="small">
            {row.action}
          </ElTag>
        ) : (
          '-'
        ),
    },
    {
      prop: 'user_name',
      label: $t('page.manage.systemOptionLog.user_name'),
      width: 120,
      formatter: row => row.user_name || '-',
    },
    {
      prop: 'ip_address',
      label: $t('page.manage.systemOptionLog.ip_address'),
      width: 140,
      formatter: row => <code class="text-xs">{row.ip_address || '-'}</code>,
    },
    { prop: 'logs', label: $t('page.manage.systemOptionLog.logs'), minWidth: 300 },
    {
      prop: 'severity',
      label: $t('page.manage.systemOptionLog.severity'),
      width: 100,
      formatter: row => {
        if (!row.severity) return '-';
        const severityTagMap: Record<string, UI.ThemeColor> = {
          low: 'info',
          medium: 'warning',
          high: 'danger',
          critical: 'danger',
        };
        return (
          <ElTag type={severityTagMap[row.severity]} size="small">
            {$t(`page.manage.systemOptionLog.severityOptions.${row.severity}`)}
          </ElTag>
        );
      },
    },
    {
      prop: 'response_time',
      label: $t('page.manage.systemOptionLog.response_time'),
      width: 120,
      formatter: row => (row.response_time ? `${row.response_time}ms` : '-'),
    },
    { prop: 'createdAt', label: $t('page.manage.systemOptionLog.createdAt'), width: 180 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      width: 180,
      formatter: (row: Api.SystemManage.SystemOptionLog) => (
        <div class="flex-center gap-8px">
          <ElButton type="primary" plain size="small" onClick={() => viewDetail(row)}>
            {$t('page.manage.systemOptionLog.viewDetail')}
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

const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate<Api.SystemManage.SystemOptionLog>(data, getData);

// Detail drawer
const detailDrawerVisible = ref(false);
const selectedLog = ref<Api.SystemManage.SystemOptionLog | null>(null);

function viewDetail(log: Api.SystemManage.SystemOptionLog) {
  selectedLog.value = log;
  detailDrawerVisible.value = true;
}

async function handleBatchDelete() {
  const ids = checkedRowKeys.value.join(',');
  const { error } = await deleteSystemOptionLog(ids);
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  const { error } = await deleteSystemOptionLog(id);
  if (!error) {
    onDeleted();
  }
}

async function handleClearAll() {
  const { error } = await deleteAllSystemOptionLogs();
  if (!error) {
    getData();
  }
}

function handleSelectionChange(val: Api.SystemManage.SystemOptionLog[]) {
  checkedRowKeys.value = val.map(item => item.id);
}

function handleReset() {
  Object.assign(searchParams, {
    type: undefined,
    module: undefined,
    action: undefined,
    user_name: undefined,
    user_type: undefined,
    severity: undefined,
    environment: undefined,
    ip_address: undefined,
    start_date: undefined,
    end_date: undefined,
    keyword: undefined,
  });
  getData();
}

function handleSearch() {
  getDataByPage(1);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Search -->
    <LogSearch v-model:model="searchParams" @reset="handleReset" @search="handleSearch" />

    <!-- Table -->
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.systemOptionLog.title') }}</p>
          <div class="flex items-center gap-12px">
            <TableHeaderOperation
              v-model:columns="columnChecks"
              :disabled-delete="checkedRowKeys.length === 0"
              :loading="loading"
              :show-add="false"
              @delete="handleBatchDelete"
              @refresh="getData"
            />
            <ElPopconfirm
              :title="$t('common.confirm')"
              :confirm-button-text="$t('common.confirm')"
              :cancel-button-text="$t('common.cancel')"
              @confirm="handleClearAll"
            >
              <template #reference>
                <ElButton type="danger" :loading="loading">
                  {{ $t('page.manage.systemOptionLog.clearAll') }}
                </ElButton>
              </template>
            </ElPopconfirm>
          </div>
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
          @selection-change="handleSelectionChange"
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
    </ElCard>

    <!-- Detail Drawer -->
    <LogDetailDrawer v-model:visible="detailDrawerVisible" :log-data="selectedLog" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}
</style>
