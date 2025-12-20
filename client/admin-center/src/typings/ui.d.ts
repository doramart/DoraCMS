declare namespace UI {
  type ThemeColor = 'danger' | 'primary' | 'info' | 'success' | 'warning';

  type TableColumnCheck = import('@sa/hooks').TableColumnCheck;
  type TableDataWithIndex<T> = import('@sa/hooks').TableDataWithIndex<T>;
  type FlatResponseData<T> = import('@sa/axios').FlatResponseData<T>;

  /**
   * the custom column key
   *
   * if you want to add a custom column, you should add a key to this type
   */
  type CustomColumnKey = 'operate';

  type SetTableColumnKey<C, T> = Omit<C, 'key'> & { key: keyof T | `CustomColumnKey` };

  type TableData = Api.Common.CommonRecord<object>;

  type TableColumnWithKey<T> = Partial<import('element-plus').TableColumnCtx<T>>;

  type TableColumn<T> = TableColumnWithKey<T>;

  type TableApiFn<T = any, R = Api.Common.CommonSearchParams> = (
    params: R
  ) => Promise<FlatResponseData<Api.Common.PaginatingQueryRecord<T>>>;

  /**
   * the type of table operation
   *
   * - add: add table item
   * - edit: edit table item
   */
  type TableOperateType = 'add' | 'edit';

  type GetTableData<A extends TableApiFn> = A extends TableApiFn<infer T> ? T : never;

  type NaiveTableConfig<A extends TableApiFn> = Pick<
    import('@sa/hooks').TableConfig<A, GetTableData<A>, TableColumn<TableDataWithIndex<GetTableData<A>>>>,
    'apiFn' | 'apiParams' | 'columns' | 'immediate'
  > & {
    /**
     * whether to display the total items count
     *
     * @default false
     */
    showTotal?: boolean;
  };
}

// ======================================== element-plus ========================================

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const locale: any;
  export default locale;
}

declare module 'element-plus/dist/locale/en.mjs' {
  const locale: any;
  export default locale;
}
