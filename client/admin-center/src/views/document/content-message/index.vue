<script setup lang="tsx">
import { ElButton, ElPopconfirm, ElTag, ElMessage, ElMessageBox } from 'element-plus';
import { deleteContentMessage, fetchGetContentMessageList } from '@/service/api/content-message';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import MessageSearch from './modules/message-search.vue';
import MessageOperateModal from './modules/message-operate-modal.vue';

defineOptions({ name: 'ContentMessageManage' });

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
  apiFn: fetchGetContentMessageList as any,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    searchkey: undefined,
  } as any,
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    {
      prop: 'contentId.stitle',
      label: $t('page.document.contentMessage.stitle'),
      width: 200,
      align: 'left',
    },
    {
      prop: 'content',
      label: $t('page.document.contentMessage.content'),
      minWidth: 280,
      align: 'left',
    },
    {
      prop: 'author.userName',
      label: $t('page.document.contentMessage.author'),
      width: 140,
    },
    {
      prop: 'replyAuthor.userName',
      label: $t('page.document.contentMessage.replyAuthor'),
      width: 140,
    },
    {
      prop: 'auditStatus',
      label: $t('page.document.contentMessage.auditStatus'),
      width: 100,
    },
    // {
    //   prop: 'praise_num',
    //   label: $t('page.document.contentMessage.praiseNum'),
    //   width: 80,
    // },
    // {
    //   prop: 'despise_num',
    //   label: $t('page.document.contentMessage.despiseNum'),
    //   width: 80,
    // },
    { prop: 'createdAt', label: $t('page.document.contentMessage.createdAt'), width: 180 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      width: 150,
    },
  ],
});

const {
  drawerVisible: dialogVisible,
  operateType,
  editingData,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted,
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) return;

  const ids = checkedRowKeys.value.join(',');
  const { error } = await deleteContentMessage(ids);
  if (!error) {
    onBatchDeleted();
  }
}

async function handleDelete(id: string) {
  const { error } = await deleteContentMessage(id);
  if (!error) {
    onDeleted();
  }
}

function handleReply(id: string) {
  editingData.value = data.value.find((item: any) => item.id === id) || null;
  operateType.value = 'edit';
  dialogVisible.value = true;
}

async function handleAudit(id: string, auditStatus: 'approved' | 'rejected') {
  try {
    let auditReason = '';

    if (auditStatus === 'rejected') {
      const result = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入拒绝原因',
      });
      auditReason = result.value;
    }

    // 调用审核API
    const response = await fetch('/manage/contentMessage/auditMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        messageId: id,
        auditStatus,
        auditReason,
      }),
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success(result.message || '审核成功');
      getData();
    } else {
      ElMessage.error(result.message || '审核失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败，请稍后重试');
    }
  }
}

function getAuditStatusType(status: string) {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return typeMap[status] || 'info';
}

function getAuditStatusText(status: string) {
  const textMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return textMap[status] || '未知';
}
</script>

<!--
 <script lang="ts">
export default {
  name: 'ContentMessageManage'
};
</script> 
-->

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <MessageSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.document.contentMessage.title') }}</p>
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
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col">
            <template v-if="col.prop === 'operate'" #default="{ row }">
              <div class="flex-center gap-2">
                <ElButton type="primary" plain size="small" @click="handleReply((row as any).id)">
                  {{ $t('page.document.contentMessage.reply') }}
                </ElButton>
                <ElButton
                  v-if="(row as any).auditStatus === 'pending'"
                  type="success"
                  plain
                  size="small"
                  @click="handleAudit((row as any).id, 'approved')"
                >
                  通过
                </ElButton>
                <ElButton
                  v-if="(row as any).auditStatus === 'pending'"
                  type="warning"
                  plain
                  size="small"
                  @click="handleAudit((row as any).id, 'rejected')"
                >
                  拒绝
                </ElButton>
                <ElPopconfirm :title="$t('common.confirmDelete')" @confirm="handleDelete((row as any).id)">
                  <template #reference>
                    <ElButton type="danger" plain size="small">
                      {{ $t('common.delete') }}
                    </ElButton>
                  </template>
                </ElPopconfirm>
              </div>
            </template>
            <template v-else-if="col.prop === 'contentId.stitle'" #default="{ row }">
              <template v-if="(row as any).contentId">
                <a :href="(row as any).contentId.url" target="_blank" rel="noopener noreferrer">
                  {{ (row as any).contentId.stitle }}
                </a>
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </template>
            <template v-else-if="col.prop === 'content'" #default="{ row }">
              {{
                (row as any).content.length > 20 ? `${(row as any).content.substring(0, 20)}...` : (row as any).content
              }}
            </template>
            <template v-else-if="col.prop === 'author.userName'" #default="{ row }">
              {{
                (row as any).utype === '0'
                  ? (row as any).author
                    ? (row as any).author.userName
                    : ''
                  : (row as any).adminAuthor
                    ? (row as any).adminAuthor.userName
                    : ''
              }}
            </template>
            <template v-else-if="col.prop === 'replyAuthor.userName'" #default="{ row }">
              {{
                (row as any).replyAuthor
                  ? (row as any).replyAuthor.userName
                  : (row as any).adminReplyAuthor
                    ? (row as any).adminReplyAuthor.userName
                    : ''
              }}
            </template>
            <template v-else-if="col.prop === 'auditStatus'" #default="{ row }">
              <ElTag :type="getAuditStatusType((row as any).auditStatus)" size="small">
                {{ getAuditStatusText((row as any).auditStatus) }}
              </ElTag>
            </template>
            <template v-else-if="col.prop === 'praise_num'" #default="{ row }">
              <span class="text-red-500">👍 {{ (row as any).praise_num || 0 }}</span>
            </template>
            <template v-else-if="col.prop === 'despise_num'" #default="{ row }">
              <span class="text-gray-500">👎 {{ (row as any).despise_num || 0 }}</span>
            </template>
          </ElTableColumn>
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
      <MessageOperateModal
        v-model:visible="dialogVisible"
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
