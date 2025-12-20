<!-- Content Category Management -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Icon } from '@iconify/vue';
import { deleteContentCategory, getContentCategoryList } from '@/service/api/content-category';
import { $t } from '@/locales';
import CategoryOperateModal from './modules/category-operate-modal.vue';

const modalRef = ref();
const treeData = ref<any[]>([]);

async function getList() {
  const res: any = await getContentCategoryList({});
  if (res?.response?.status === 200) {
    // treeData.value = transformToTree(res.data);
    treeData.value = res.data;
  }
}

function transformToTree(data: any[]) {
  const tree: any[] = [];
  const map = new Map();

  // First pass: create map of all items
  data.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  // Second pass: build tree structure
  data.forEach(item => {
    const node = map.get(item.id);
    if (item.parentId === '0') {
      tree.push(node);
    } else {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return tree;
}

function handleAdd() {
  modalRef.value?.open({
    type: 'add',
    parentId: '0',
  });
}

function handleAddSub(row: any) {
  modalRef.value?.open({
    type: 'add',
    parentId: row.id,
    parentData: row,
  });
}

function handleEdit(row: any) {
  modalRef.value?.open({
    type: 'edit',
    id: row.id,
  });
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.warning'), {
      type: 'warning',
    });

    const { error } = await deleteContentCategory(row.id);
    if (!error) {
      window.$message?.success($t('common.deleteSuccess'));
      await getList();
    }
  } catch {
    // User canceled or error occurred
  }
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="content-category">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.document.contentCategory.title') }}</p>
          <div class="flex items-center gap-2">
            <ElButton type="primary" @click="handleAdd">
              <icon-ic-round-plus class="mr-2" />
              {{ $t('common.add') }}
            </ElButton>
          </div>
        </div>
      </template>
      <div class="h-[calc(100%-50px)]">
        <ElTable :data="treeData" row-key="id" default-expand-all>
          <ElTableColumn align="left" :label="$t('page.document.contentCategory.name')" min-width="300">
            <template #default="{ row }">
              <div class="inline-flex items-center gap-2">
                <Icon v-if="row.icon" :icon="row.icon" class="flex-shrink-0 text-icon" />
                <span>{{ row.name }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" :label="$t('page.document.contentCategory.type')" width="120">
            <template #default="{ row }">
              {{
                row.type === '1'
                  ? $t('page.document.contentCategory.typeNormal')
                  : $t('page.document.contentCategory.typeSinger')
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="enable" :label="$t('page.document.contentCategory.enable')" width="100">
            <template #default="{ row }">
              <ElTag :type="row.enable ? 'success' : 'danger'">
                {{ row.enable ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable') }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="sortId" :label="$t('page.document.contentCategory.sort')" width="100" />
          <ElTableColumn :label="$t('common.action')" align="right" width="350" fixed="right">
            <template #default="{ row }">
              <ElButton type="primary" link @click="handleAddSub(row)">
                <icon-ic-round-plus class="mr-1" />
                {{ $t('page.document.contentCategory.addSub') }}
              </ElButton>
              <ElButton type="primary" link @click="handleEdit(row)">
                <icon-ic-round-edit class="mr-1" />
                {{ $t('common.edit') }}
              </ElButton>
              <ElButton type="danger" link @click="handleDelete(row)">
                <icon-ic-round-delete class="mr-1" />
                {{ $t('common.delete') }}
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </ElCard>

    <CategoryOperateModal ref="modalRef" @success="getList" />
  </div>
</template>

<style lang="scss" scoped>
.content-category {
  height: 100%;
  padding: 16px;
}

.text-icon {
  font-size: 16px;
  color: var(--el-text-color-primary);
}
</style>
