<script setup lang="tsx">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { ElButton, ElPopconfirm, ElSwitch, ElTabPane, ElTabs, ElTag } from 'element-plus';
import { useBoolean } from '@sa/hooks';
import {
  enablePlugin,
  fetchGetPluginList,
  fetchGetPluginShopList,
  installPlugin,
  pluginHeartBeat,
  unInstallPlugin,
  updatePlugin,
} from '@/service/api/plugin';
import { useTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import PluginOperateModal, { type OperateType } from './modules/plugin-operate-modal.vue';
import PluginSearch from './modules/plugin-search.vue';
import PluginShopSearch from './modules/plugin-shop-search.vue';

defineOptions({ name: 'PluginManage' });

const activeTab = ref('shop');

// Installed plugin list table
const {
  columns: installedColumns,
  columnChecks: installedColumnChecks,
  data: installedData,
  getData: getInstalledData,
  getDataByPage: getInstalledDataByPage,
  loading: installedLoading,
  mobilePagination: installedMobilePagination,
  searchParams: installedSearchParams,
  resetSearchParams: resetInstalledSearchParams,
} = useTable({
  apiFn: fetchGetPluginList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    name: undefined,
    description: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    { prop: 'name', label: $t('page.extend.plugin.name'), minWidth: 120 },
    { prop: 'description', label: $t('page.extend.plugin.description'), minWidth: 200 },
    {
      prop: 'version',
      label: $t('page.extend.plugin.version'),
      width: 100,
      formatter: (row: any) => {
        if (row.shouldUpdate) {
          return (
            <div>
              <ElTag type="info" class="update-badge">
                {row.version}
              </ElTag>
            </div>
          );
        }
        return <ElTag type="info">{row.version}</ElTag>;
      },
    },
    {
      prop: 'hooks',
      label: $t('page.extend.plugin.hooks'),
      width: 180,
      formatter: (row: any) => {
        if (row.hooks) {
          return row.hooks.join(', ');
        }
        return '';
      },
    },
    {
      prop: 'state',
      label: $t('page.extend.plugin.enable'),
      width: 100,
      formatter: (row: any) => (
        <ElSwitch
          v-model={row.state}
          active-value={true}
          inactive-value={false}
          onChange={() => handleStateChange(row)}
        />
      ),
    },
    { prop: 'createdAt', label: $t('page.extend.plugin.createdAt'), width: 180 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      width: 180,
      formatter: (row: any) => (
        <div class="flex-center">
          <ElButton type="primary" size="small" plain onClick={() => viewInstalledPlugin(row.id)}>
            {$t('page.extend.plugin.pluginDetail')}
          </ElButton>
          <ElPopconfirm title={$t('page.extend.plugin.uninstallNotice')} onConfirm={() => handleUninstall(row.id)}>
            {{
              reference: () => (
                <ElButton type="danger" size="small" plain>
                  {$t('page.extend.plugin.uninstall')}
                </ElButton>
              ),
            }}
          </ElPopconfirm>
          {row.shouldUpdate && (
            <ElPopconfirm title={$t('page.extend.plugin.updateNotice')} onConfirm={() => handleUpdate(row.id)}>
              {{
                reference: () => (
                  <ElButton type="warning" size="small" plain>
                    {$t('page.extend.plugin.update')}
                  </ElButton>
                ),
              }}
            </ElPopconfirm>
          )}
        </div>
      ),
    },
  ],
});

// Plugin shop list table
const {
  columns: shopColumns,
  columnChecks: shopColumnChecks,
  data: shopData,
  getData: getShopData,
  getDataByPage: getShopDataByPage,
  loading: shopLoading,
  mobilePagination: shopMobilePagination,
  searchParams: shopSearchParams,
  resetSearchParams: resetShopSearchParams,
} = useTable({
  apiFn: fetchGetPluginShopList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    name: undefined,
    description: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    { prop: 'name', label: $t('page.extend.plugin.name'), minWidth: 120 },
    { prop: 'description', label: $t('page.extend.plugin.description'), minWidth: 200 },
    {
      prop: 'version',
      label: $t('page.extend.plugin.version'),
      width: 100,
      formatter: (row: any) => <ElTag type="info">{row.version}</ElTag>,
    },
    {
      prop: 'hooks',
      label: $t('page.extend.plugin.hooks'),
      width: 180,
      formatter: (row: any) => {
        if (row.hooks) {
          return row.hooks.join(', ');
        }
        return '';
      },
    },
    {
      prop: 'amount',
      label: $t('page.extend.plugin.amount'),
      width: 100,
      formatter: (row: any) => {
        if (row.amount === 0) {
          return (
            <ElTag type="info" effect="plain">
              {$t('page.extend.plugin.free')}
            </ElTag>
          );
        }
        return (
          <ElTag type="info" effect="plain">
            {row.amount}
          </ElTag>
        );
      },
    },
    {
      prop: 'installed',
      label: $t('page.extend.plugin.state'),
      width: 120,
      formatter: (row: any) => {
        if (row.installed) {
          return <ElTag type="success">{$t('page.extend.plugin.installed')}</ElTag>;
        }
        return <ElTag type="warning">{$t('page.extend.plugin.notInstalled')}</ElTag>;
      },
    },
    { prop: 'createdAt', label: $t('page.extend.plugin.createdAt'), width: 180 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      width: 180,
      formatter: (row: any) => (
        <div class="flex-center">
          {Number(row.amount) > 0 && (
            <ElButton type="primary" size="small" plain onClick={() => handleBuyPlugin(row.id)}>
              {$t('page.extend.plugin.install')}
            </ElButton>
          )}
          <ElButton type="info" size="small" plain onClick={() => viewShopPlugin(row.id)}>
            {$t('page.extend.plugin.pluginDetail')}
          </ElButton>
          {!row.installed && (
            <ElPopconfirm title={$t('page.extend.plugin.installNotice')} onConfirm={() => handleInstall(row.id)}>
              {{
                reference: () => (
                  <ElButton type="warning" size="small" plain>
                    {$t('page.extend.plugin.install')}
                  </ElButton>
                ),
              }}
            </ElPopconfirm>
          )}
        </div>
      ),
    },
  ],
});
const editingData: Ref<Api.PluginManage.Plugin | null> = ref(null);
const operateType = ref<OperateType>('add');
const { bool: visible, setTrue: openModal } = useBoolean();
// const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(installedData, getInstalledData);

// Handle tab change
function handleTabChange(tab: any) {
  if (tab.props.name === 'installed') {
    getInstalledData();
  } else if (tab.props.name === 'shop') {
    getShopData();
  }
}

// View installed plugin details
function viewInstalledPlugin(id: string) {
  const plugin: any = installedData.value.find((item: any) => item.id === id);
  if (plugin) {
    // setModal(true, 'view', plugin);
    operateType.value = 'view';
    editingData.value = { ...plugin };
    openModal();
  }
}

// View shop plugin details
function viewShopPlugin(id: string) {
  const plugin: any = shopData.value.find((item: any) => item.id === id);
  if (plugin) {
    // setModal(true, 'view', plugin);
    operateType.value = 'view';
    editingData.value = { ...plugin };
    openModal();
    console.log('🚀 ~ viewShopPlugin ~ editingData.value:', editingData.value);
  }
}

// Handle plugin state change
async function handleStateChange(row: any) {
  console.log('Plugin state changed:', row.id, row.state);
  // You would implement enablePlugin API call here
  try {
    await enablePlugin(row.id);
  } catch (error) {
    console.error('Failed to enable plugin:', error);
  }
}

// Handle uninstallation
async function handleUninstall(id: string) {
  try {
    await unInstallPlugin(id);
    await startHeartbeat();
  } catch (error) {
    console.error('Failed to uninstall plugin:', error);
  }
}

// Handle installation
async function handleInstall(id: string) {
  try {
    await installPlugin(id);
    await startHeartbeat();
  } catch (error) {
    console.error('Failed to install plugin:', error);
  }
}

// Handle update
async function handleUpdate(id: string) {
  try {
    await updatePlugin(id);
    await startHeartbeat();
  } catch (error) {
    console.error('Failed to update plugin:', error);
  }
}

// Handle plugin purchase
function handleBuyPlugin(id: string) {
  // Implement purchase logic
  console.log('Buy plugin:', id);
}

// Heartbeat check
let heartbeatTimer: any = null;
async function startHeartbeat() {
  try {
    const result: any = await pluginHeartBeat();
    if (!result?.error) {
      clearTimeout(heartbeatTimer);
      window.location.reload();
    } else {
      heartbeatTimer = setTimeout(startHeartbeat, 2000);
    }
  } catch (error) {
    console.error('Failed to start heartbeat:', error);
    heartbeatTimer = setTimeout(startHeartbeat, 2000);
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ElTabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <ElTabPane name="shop" :label="$t('page.extend.plugin.shopTitle')">
        <PluginShopSearch v-model:model="shopSearchParams" @reset="resetShopSearchParams" @search="getShopDataByPage" />
        <ElCard class="mt-10px sm:flex-1-hidden card-wrapper" body-class="ht50 ">
          <template #header>
            <div class="flex items-center justify-between">
              <p>{{ $t('page.extend.plugin.shopTitle') }}</p>
              <TableHeaderOperation
                v-model:columns="shopColumnChecks"
                :show-add="false"
                :show-delete="false"
                :loading="shopLoading"
                @refresh="getShopData"
              />
            </div>
          </template>
          <div class="h-[calc(100%-50px)]">
            <ElTable v-loading="shopLoading" height="100%" border class="sm:h-full" :data="shopData" row-key="id">
              <ElTableColumn v-for="col in shopColumns" :key="col.prop" v-bind="col" />
            </ElTable>
          </div>
          <div class="mt-20px flex justify-end">
            <ElPagination
              v-if="shopMobilePagination.total"
              layout="total,prev,pager,next,sizes"
              v-bind="shopMobilePagination"
              @current-change="shopMobilePagination['current-change']"
              @size-change="shopMobilePagination['size-change']"
            />
          </div>
        </ElCard>
      </ElTabPane>
      <ElTabPane name="installed" :label="$t('page.extend.plugin.installedTitle')">
        <PluginSearch
          v-model:model="installedSearchParams"
          @reset="resetInstalledSearchParams"
          @search="getInstalledDataByPage"
        />
        <ElCard class="mt-10px sm:flex-1-hidden card-wrapper" body-class="ht50">
          <template #header>
            <div class="flex items-center justify-between">
              <p>{{ $t('page.extend.plugin.installedTitle') }}</p>
              <TableHeaderOperation
                v-model:columns="installedColumnChecks"
                :show-add="false"
                :show-delete="false"
                :loading="installedLoading"
                @refresh="getInstalledData"
              />
            </div>
          </template>
          <div class="h-[calc(100%-50px)]">
            <ElTable
              v-loading="installedLoading"
              height="100%"
              border
              class="sm:h-full"
              :data="installedData"
              row-key="id"
            >
              <ElTableColumn v-for="col in installedColumns" :key="col.prop" v-bind="col" />
            </ElTable>
          </div>
          <div class="mt-20px flex justify-end">
            <ElPagination
              v-if="installedMobilePagination.total"
              layout="total,prev,pager,next,sizes"
              v-bind="installedMobilePagination"
              @current-change="installedMobilePagination['current-change']"
              @size-change="installedMobilePagination['size-change']"
            />
          </div>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <PluginOperateModal v-model:visible="visible" :operate-type="operateType" :row-data="editingData" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}

.update-badge {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--el-color-danger);
  }
}
</style>
