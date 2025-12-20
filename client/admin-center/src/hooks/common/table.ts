import { computed, effectScope, onScopeDispose, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { PaginationEmits, PaginationProps } from 'element-plus';
import { jsonClone } from '@sa/utils';
import { useBoolean, useHookTable } from '@sa/hooks';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';

type RemoveReadonly<T> = {
  -readonly [key in keyof T]: T[key];
};

type TableData = UI.TableData;
type GetTableData<A extends UI.TableApiFn> = UI.GetTableData<A>;
type TableColumn<T> = UI.TableColumn<T>;

export function useTable<A extends UI.TableApiFn>(config: UI.NaiveTableConfig<A>) {
  const scope = effectScope();
  const appStore = useAppStore();

  const isMobile = computed(() => appStore.isMobile);

  const { apiFn, apiParams, immediate } = config;

  const SELECTION_KEY = '__selection__';

  const EXPAND_KEY = '__expand__';

  const INDEX_KEY = '__index__';

  const {
    loading,
    empty,
    data,
    columns,
    columnChecks,
    reloadColumns,
    getData,
    searchParams,
    updateSearchParams,
    resetSearchParams
  } = useHookTable<A, GetTableData<A>, TableColumn<UI.TableDataWithIndex<GetTableData<A>>>>({
    apiFn,
    apiParams,
    columns: config.columns,
    transformer: res => {
      const {
        docs: records = [],
        pageInfo: { current = 1, pageSize: size = 10, totalItems: total = 0 }
      } = res.data || {};
      // const { records = [], current = 1, size = 10, total = 0 } = res.data || {};
      // Ensure that the size is greater than 0, If it is less than 0, it will cause paging calculation errors.
      const pageSize = size <= 0 ? 10 : size;

      const recordsWithIndex = records.map((item, index) => {
        return {
          ...item,
          index: (current - 1) * pageSize + index + 1
        };
      });

      return {
        data: recordsWithIndex,
        pageNum: current,
        pageSize,
        total
      };
    },
    getColumnChecks: cols => {
      const checks: UI.TableColumnCheck[] = [];
      cols.forEach(column => {
        if (column.type === 'selection') {
          checks.push({
            prop: SELECTION_KEY,
            label: $t('common.check'),
            checked: true
          });
        } else if (column.type === 'expand') {
          checks.push({
            prop: EXPAND_KEY,
            label: $t('common.expandColumn'),
            checked: true
          });
        } else if (column.type === 'index') {
          checks.push({
            prop: INDEX_KEY,
            label: $t('common.index'),
            checked: true
          });
        } else {
          checks.push({
            prop: column.prop as string,
            label: column.label as string,
            checked: true
          });
        }
      });

      return checks;
    },
    getColumns: (cols, checks) => {
      const columnMap = new Map<string, TableColumn<GetTableData<A>>>();

      cols.forEach(column => {
        if (column.type === 'selection') {
          columnMap.set(SELECTION_KEY, column);
        } else if (column.type === 'expand') {
          columnMap.set(EXPAND_KEY, column);
        } else if (column.type === 'index') {
          columnMap.set(INDEX_KEY, column);
        } else {
          columnMap.set(column.prop as string, column);
        }
      });

      const filteredColumns = checks
        .filter(item => item.checked)
        .map(check => columnMap.get(check.prop) as TableColumn<GetTableData<A>>);

      return filteredColumns;
    },
    onFetched: async transformed => {
      const { pageNum, pageSize, total } = transformed;

      updatePagination({
        currentPage: pageNum,
        pageSize,
        total
      });
    },
    immediate
  });

  const pagination: Partial<RemoveReadonly<PaginationProps & PaginationEmits>> = reactive({
    currentPage: 1,
    pageSize: 10,
    pageSizes: [10, 20, 40, 60, 100],
    'current-change': (page: number) => {
      pagination.currentPage = page;

      updateSearchParams({ current: page, pageSize: pagination.pageSize! });

      getData();

      return true;
    },
    'size-change': (pageSize: number) => {
      pagination.currentPage = 1;
      pagination.pageSize = pageSize;

      updateSearchParams({ current: pagination.currentPage, pageSize: pageSize });

      getData();
      return true;
    }
  });

  // this is for mobile, if the system does not support mobile, you can use `pagination` directly
  const mobilePagination = computed(() => {
    const p: Partial<RemoveReadonly<PaginationProps & PaginationEmits>> = {
      ...pagination,
      pagerCount: isMobile.value ? 3 : 9
    };

    return p;
  });

  function updatePagination(update: Partial<PaginationProps>) {
    Object.assign(pagination, update);
  }

  /**
   * get data by page number
   *
   * @param pageNum the page number. default is 1
   */
  async function getDataByPage(pageNum: number = 1) {
    updatePagination({
      currentPage: pageNum
    });

    updateSearchParams({
      current: pageNum,
      pageSize: pagination.pageSize!
    });

    await getData();
  }

  scope.run(() => {
    watch(
      () => appStore.locale,
      () => {
        reloadColumns();
      }
    );
  });

  onScopeDispose(() => {
    scope.stop();
  });

  return {
    loading,
    empty,
    data,
    columns,
    columnChecks,
    reloadColumns,
    pagination,
    mobilePagination,
    updatePagination,
    getData,
    getDataByPage,
    searchParams,
    updateSearchParams,
    resetSearchParams
  };
}

export function useTableOperate<T extends TableData = TableData>(data: Ref<T[]>, getData: () => Promise<void>) {
  const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();

  const operateType = ref<UI.TableOperateType>('add');

  function handleAdd() {
    operateType.value = 'add';
    openDrawer();
  }

  /** the editing row data */
  const editingData: Ref<T | null> = ref(null);

  function handleEdit(id: T['id']) {
    operateType.value = 'edit';
    const findItem = data.value.find(item => item.id === id) || null;
    editingData.value = jsonClone(findItem);

    openDrawer();
  }

  /** the checked row keys of table */
  const checkedRowKeys = ref<string[]>([]);

  /** the hook after the batch delete operation is completed */
  async function onBatchDeleted() {
    window.$message?.success($t('common.deleteSuccess'));

    checkedRowKeys.value = [];

    await getData();
  }

  /** the hook after the delete operation is completed */
  async function onDeleted() {
    window.$message?.success($t('common.deleteSuccess'));

    await getData();
  }

  return {
    drawerVisible,
    openDrawer,
    closeDrawer,
    operateType,
    handleAdd,
    editingData,
    handleEdit,
    checkedRowKeys,
    onBatchDeleted,
    onDeleted
  };
}
