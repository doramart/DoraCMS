<script setup lang="tsx">
import { ref, onActivated, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { useTabStore } from '@/store/modules/tab';
// import { enableStatusRecord } from '@/constants/business';
import { deleteContent, fetchGetContentList } from '@/service/api/content';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
import ContentOperateModal from './modules/content-operate-modal.vue';
import ContentSearch from './modules/content-search.vue';
import ContentMoveCateModal from './modules/content-move-cate-modal.vue';
import ContentDraftModal from './modules/content-draft-modal.vue';

defineOptions({ name: 'ContentManage' });

const route = useRoute();
const tabStore = useTabStore();

// 监听 tab 激活状态，当回到列表页时刷新数据
watch(
  () => tabStore.activeTabId,
  newTabId => {
    const currentTabId = tabStore.getTabIdByRoute(route);
    if (newTabId === currentTabId) {
      getData();
    }
  }
);

const {
  columns,
  // columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams,
} = useTable({
  apiFn: fetchGetContentList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    state: undefined,
    title: undefined,
    categories: undefined,
    tags: undefined,
    type: undefined,
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    {
      prop: 'title',
      label: $t('page.document.content.mainTitle'),
      minWidth: 200,
      align: 'left',
      showOverflowTooltip: true,
    },
    {
      prop: 'categories',
      label: $t('page.document.content.category'),
      minWidth: 100,
      formatter: (row: any) => {
        if (!row.categories || !Array.isArray(row.categories) || row.categories.length === 0) {
          return '';
        }
        const lastCategory = row.categories[row.categories.length - 1];
        return lastCategory?.name || '';
      },
    },
    {
      prop: 'tags',
      label: $t('page.document.content.tags'),
      minWidth: 100,
      showOverflowTooltip: true,
      formatter: (row: any) => {
        if (!row.tags || !Array.isArray(row.tags) || row.tags.length === 0) {
          return '';
        }
        return row.tags.map((tag: any) => tag.name).join(', ');
      },
    },
    { prop: 'clickNum', label: $t('page.document.content.clickNum'), width: 100 },
    { prop: 'commentNum', label: $t('page.document.content.commentNum'), width: 100 },
    {
      prop: 'author',
      label: $t('page.document.content.author'),
      width: 150,
      formatter: (row: any) => {
        if (row.uAuthor) {
          return row.uAuthor.userName;
        }
        if (row.author) {
          return row.author.userName;
        }
        return '';
      },
    },
    { prop: 'createdAt', label: $t('page.document.content.publishDate'), width: 160 },
    {
      prop: 'state',
      label: $t('page.document.content.state'),
      align: 'center',
      width: 100,
      formatter: (row: any) => {
        if (row.state === undefined) {
          return '';
        }

        const tagMap: Record<string, UI.ThemeColor> = {
          '0': 'info', // 草稿
          '1': 'warning', // 待审核
          '2': 'success', // 审核通过
          '3': 'danger', // 下架
        };

        const stateTextMap: Record<string, string> = {
          '0': $t('page.document.content.draft'),
          '1': $t('page.document.content.pendingReview'),
          '2': $t('page.document.content.approved'),
          '3': $t('page.document.content.offline'),
        };

        return <ElTag type={tagMap[String(row.state)]}>{stateTextMap[String(row.state)]}</ElTag>;
      },
    },
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

const {
  drawerVisible: operateModalVisible,
  operateType,
  editingData,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
} = useTableOperate(data, getData);

const { routerPushByKey } = useRouterPush();

const moveCateModalVisible = ref(false);
const selectCoverModalVisible = ref(false);
const draftModalVisible = ref(false);

function openMoveCateModal() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning($t('page.document.content.selectContentFirst'));
    return;
  }
  moveCateModalVisible.value = true;
}

function openDraftModal() {
  draftModalVisible.value = true;
}

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.warning($t('page.document.content.selectContentFirst'));
    return;
  }

  const ids = checkedRowKeys.value.map((item: any) => item.id).join(',');
  const { error } = await deleteContent({
    ids,
    draft: '1',
  });
  if (!error) {
    onBatchDeleted();
  }
  // window.$message?.success($t('common.deleteSuccess'));
}

async function handleDelete(id: string) {
  const { error } = await deleteContent({
    ids: id,
    draft: '1',
  });
  if (!error) {
    onDeleted();
  }
  // window.$message?.success($t('common.deleteSuccess'));
}

function edit(id: string) {
  // 跳转到 AI 内容发布页面进行编辑
  routerPushByKey('remote-page_ai-content-publish', { query: { id } });
}

// 打开 AI 内容发布页面（新标签页）
function handleAddWithAI() {
  routerPushByKey('remote-page_ai-content-publish');
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ContentSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.document.content.title') }}</p>
          <div class="flex items-center gap-8px">
            <ElButton type="primary" @click="handleAddWithAI">
              {{ $t('common.add') }}
            </ElButton>
            <ElButton type="warning" @click="openMoveCateModal">
              {{ $t('page.document.content.batchChangeCategory') }}
            </ElButton>
            <!--
 <ElButton type="info" @click="openSelectCoverModal">
              {{ $t('page.document.content.selectCover') }}
            </ElButton>
-->
            <ElButton type="success" @click="openDraftModal">
              {{ $t('page.document.content.recyclebin') }}
            </ElButton>
            <ElPopconfirm
              :disabled="checkedRowKeys.length === 0"
              :title="$t('common.confirmDelete')"
              @confirm="handleBatchDelete"
            >
              <template #reference>
                <ElButton type="danger" :disabled="checkedRowKeys.length === 0">
                  {{ $t('common.batchDelete') }}
                </ElButton>
              </template>
            </ElPopconfirm>
            <ElButton @click="getData">
              {{ $t('common.refresh') }}
            </ElButton>
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
      <ContentOperateModal
        v-model:visible="operateModalVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <ContentMoveCateModal
        v-model:visible="moveCateModalVisible"
        :selected-ids="checkedRowKeys.map((item:any) => item.id)"
        @submitted="getDataByPage"
      />
      <ContentDraftModal v-model:visible="draftModalVisible" @submitted="getDataByPage" />
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
