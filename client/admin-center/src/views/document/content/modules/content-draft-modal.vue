<script setup lang="tsx">
import { ref, watch } from 'vue';
import { ElButton, ElDialog, ElMessage, ElPagination, ElPopconfirm, ElTable, ElTableColumn } from 'element-plus';
import { fetchGetContentList, updateManyContent } from '@/service/api/content';
import { useTable } from '@/hooks/common/table';
import { $t } from '@/locales';

defineOptions({ name: 'ContentDraftModal' });

const visible = defineModel<boolean>('visible', {
  default: false,
});

const emit = defineEmits(['submitted']);

const { columns, data, getData, loading, mobilePagination } = useTable({
  apiFn: fetchGetContentList,
  apiParams: { draft: '1' }, // Only get draft documents
  columns: () => [
    { type: 'selection', width: 50 },
    { type: 'index', width: 50, label: '#' },
    {
      prop: 'title',
      label: $t('page.document.content.mainTitle'),
      minWidth: 200,
      showOverflowTooltip: true,
      align: 'left',
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
      minWidth: 140,
      showOverflowTooltip: true,
      align: 'left',
      formatter: (row: any) => {
        if (!row.tags || !Array.isArray(row.tags) || row.tags.length === 0) {
          return '';
        }
        return row.tags.map((tag: any) => tag.name).join(', ');
      },
    },
    { prop: 'createdAt', label: $t('page.document.content.publishDate'), width: 160 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      width: 100,
      align: 'center',
      formatter: (row: any) => (
        <div class="flex-center">
          <ElPopconfirm title={$t('page.document.content.confirmRestore')} onConfirm={() => restoreContent(row.id)}>
            {{
              reference: () => (
                <ElButton type="success" plain size="small">
                  {$t('page.document.content.restore')}
                </ElButton>
              ),
            }}
          </ElPopconfirm>
        </div>
      ),
    },
  ],
});

// 选中的行
const selectedRows = ref<any[]>([]);

function handleSelectionChange(selection: any[]) {
  selectedRows.value = selection;
}

async function restoreContent(id: string) {
  try {
    const { error } = await updateManyContent({
      ids: id,
      updates: { draft: '0' },
    });

    if (!error) {
      ElMessage.success($t('common.operateSuccess'));
      getData();
      emit('submitted');
    }
  } catch (error) {
    console.error('Error restoring content:', error);
  }
}

async function batchRestore() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning($t('page.document.content.selectContentFirst'));
    return;
  }

  try {
    const result: any = await updateManyContent({
      ids: selectedRows.value.map(row => row.id).join(','),
      updates: { draft: '0' },
    });
    if (!result?.error) {
      ElMessage.success($t('common.operateSuccess'));
      getData();
      emit('submitted');
    }
  } catch (error) {
    console.error('Error batch restoring contents:', error);
  }
}

function closeModal() {
  visible.value = false;
}

watch(visible, newVal => {
  if (newVal) {
    getData();
  }
});
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('page.document.content.recyclebin')"
    width="900px"
    :close-on-click-modal="false"
  >
    <div class="flex flex-col gap-16px">
      <div class="flex justify-end">
        <ElButton type="primary" :disabled="selectedRows.length === 0" @click="batchRestore">
          {{ $t('page.document.content.batchRestore') }}
        </ElButton>
      </div>

      <div class="h-[calc(100%-50px)]">
        <ElTable
          v-loading="loading"
          :data="data"
          border
          stripe
          height="400px"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col" />
        </ElTable>
      </div>

      <div class="mt-20px flex justify-end">
        <ElPagination
          v-if="mobilePagination.total"
          layout="total, sizes, prev, pager, next"
          v-bind="mobilePagination"
          @current-change="mobilePagination['current-change']"
          @size-change="mobilePagination['size-change']"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="closeModal">{{ $t('common.close') }}</ElButton>
    </template>
  </ElDialog>
</template>
