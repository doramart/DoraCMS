<template>
  <div class="base-table-container">
    <el-table
      v-bind="$attrs"
      :data="tableData"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="55" align="center" />
      <el-table-column
        v-if="showIndex"
        type="index"
        :label="indexLabel"
        width="60"
        align="center"
      />
      <slot></slot>
    </el-table>

    <div v-if="showPagination" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :background="background"
        :layout="paginationLayout"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    required: true,
    default: () => [],
  },
  // 分页相关
  showPagination: {
    type: Boolean,
    default: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  defaultPageSize: {
    type: Number,
    default: 10,
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper',
  },
  background: {
    type: Boolean,
    default: true,
  },
  // 索引列
  showIndex: {
    type: Boolean,
    default: false,
  },
  indexLabel: {
    type: String,
    default: '#',
  },
  // 选择列
  showSelection: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:page',
  'update:pageSize',
  'selection-change',
  'sort-change',
  'page-change',
  'size-change',
]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(props.defaultPageSize);

// 当前表格数据
const tableData = computed(() => {
  if (!props.showPagination) return props.data;

  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return props.data.slice(startIndex, endIndex);
});

// 分页处理
const handleSizeChange = size => {
  pageSize.value = size;
  emit('size-change', size);
  emit('update:pageSize', size);
};

const handleCurrentChange = page => {
  currentPage.value = page;
  emit('page-change', page);
  emit('update:page', page);
};

// 选择行处理
const handleSelectionChange = selection => {
  emit('selection-change', selection);
};

// 排序处理
const handleSortChange = sort => {
  emit('sort-change', sort);
};

// 监听数据总数变化，重置页码
watch(
  () => props.total,
  newVal => {
    if (newVal === 0) {
      currentPage.value = 1;
    } else if (currentPage.value > Math.ceil(newVal / pageSize.value)) {
      currentPage.value = Math.ceil(newVal / pageSize.value);
    }
  }
);
</script>

<style scoped>
.base-table-container {
  width: 100%;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
