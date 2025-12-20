<script setup lang="tsx">
import { useClipboard } from '@vueuse/core';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
// import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { deleteAd, getAdList } from '@/service/api/ads';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
// import AdsSearch from './modules/ads-search.vue';
import AdsOperateDrawer from './modules/ads-operate-drawer.vue';

defineOptions({ name: 'AdsManage' });
const { copy, isSupported } = useClipboard();
const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  // searchParams,
  // resetSearchParams
} = useTable({
  apiFn: getAdList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    status: undefined,
    userName: undefined,
    userGender: undefined,
    nickName: undefined,
  },
  columns: () => [
    { type: 'selection', width: 50, align: 'center' },
    { prop: 'name', label: $t('page.document.ads.name'), minWidth: 120, showOverflowTooltip: true },
    {
      prop: 'type',
      label: $t('page.document.ads.type'),
      width: 120,
      align: 'center',
      formatter: (row: any) => (
        <ElTag>{row.type === '1' ? $t('page.document.ads.type_image') : $t('page.document.ads.type_text')}</ElTag>
      ),
    },
    {
      prop: 'state',
      label: $t('page.document.ads.state'),
      width: 120,
      align: 'center',
      formatter: (row: any) => (
        <ElTag type={row.state ? 'success' : 'danger'}>
          {row.state ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable')}
        </ElTag>
      ),
    },
    {
      prop: 'comments',
      label: $t('page.document.ads.comments'),
      minWidth: 160,
      showOverflowTooltip: true,
    },
    { prop: 'createdAt', label: $t('common.createdAt'), width: 180, align: 'center' },
    {
      prop: 'operate',
      label: $t('common.action'),
      width: 250,
      align: 'center',
      fixed: 'right',
      formatter: (row: any) => (
        <div class="flex-center">
          <ElButton type="warning" plain size="small" onClick={() => handleCopy(row)}>
            {$t('page.document.ads.copyCode')}
          </ElButton>
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

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
  // closeDrawer
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  // eslint-disable-next-line no-console
  console.log(checkedRowKeys.value);
  // request
  const { error } = await deleteAd(checkedRowKeys.value?.map(item => item.id).join(','));
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  // eslint-disable-next-line no-console
  console.log(id);
  // request
  const { error } = await deleteAd(id);
  if (!error) {
    onDeleted();
  }
}

function edit(id: number) {
  console.log('🚀 ~ edit ~ id:', id);
  handleEdit(id);
}

// 广告代码复制
async function handleCopy(targetRow: any) {
  if (!isSupported) {
    window.$message?.error($t('common.browserNotSupport'));
    return;
  }
  const adsStr = `
      {% ads name="${targetRow.name}" %}
      {{adsPannel.slider(${targetRow.name})}}
      `;
  if (!adsStr) {
    window.$message?.error($t('common.pleaseInputContent'));
    return;
  }
  if (adsStr) {
    await copy(adsStr);
    window.$message?.success($t('common.copySuccess') + adsStr);
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- <AdsSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" /> -->
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.user.title') }}</p>
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
      <AdsOperateDrawer
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
