<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'LogSearch' });

const activeName = ref([]);

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.SystemOptionLogSearchParams>('model', { required: true });

// 日期范围联动
const dateRange = computed({
  get() {
    if (model.value.start_date && model.value.end_date) {
      return [model.value.start_date, model.value.end_date];
    }
    return null;
  },
  set(value: [string, string] | null) {
    if (value && value.length === 2) {
      model.value.start_date = value[0];
      model.value.end_date = value[1];
    } else {
      model.value.start_date = undefined;
      model.value.end_date = undefined;
    }
  },
});

const logTypeOptions = [
  { label: $t('page.manage.systemOptionLog.typeOptions.login'), value: 'login' },
  { label: $t('page.manage.systemOptionLog.typeOptions.logout'), value: 'logout' },
  { label: $t('page.manage.systemOptionLog.typeOptions.exception'), value: 'exception' },
  { label: $t('page.manage.systemOptionLog.typeOptions.operation'), value: 'operation' },
  { label: $t('page.manage.systemOptionLog.typeOptions.access'), value: 'access' },
  { label: $t('page.manage.systemOptionLog.typeOptions.error'), value: 'error' },
  { label: $t('page.manage.systemOptionLog.typeOptions.warning'), value: 'warning' },
  { label: $t('page.manage.systemOptionLog.typeOptions.info'), value: 'info' },
  { label: $t('page.manage.systemOptionLog.typeOptions.debug'), value: 'debug' },
];

const userTypeOptions = [
  { label: $t('page.manage.systemOptionLog.userTypeOptions.admin'), value: 'admin' },
  { label: $t('page.manage.systemOptionLog.userTypeOptions.user'), value: 'user' },
  { label: $t('page.manage.systemOptionLog.userTypeOptions.guest'), value: 'guest' },
  { label: $t('page.manage.systemOptionLog.userTypeOptions.system'), value: 'system' },
];

const severityOptions = [
  { label: $t('page.manage.systemOptionLog.severityOptions.low'), value: 'low' },
  { label: $t('page.manage.systemOptionLog.severityOptions.medium'), value: 'medium' },
  { label: $t('page.manage.systemOptionLog.severityOptions.high'), value: 'high' },
  { label: $t('page.manage.systemOptionLog.severityOptions.critical'), value: 'critical' },
];

const environmentOptions = [
  { label: $t('page.manage.systemOptionLog.environmentOptions.local'), value: 'local' },
  { label: $t('page.manage.systemOptionLog.environmentOptions.development'), value: 'development' },
  { label: $t('page.manage.systemOptionLog.environmentOptions.staging'), value: 'staging' },
  { label: $t('page.manage.systemOptionLog.environmentOptions.production'), value: 'production' },
];

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 1);
      return [start, end];
    },
  },
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return [start, end];
    },
  },
  {
    text: '最近3天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 3);
      return [start, end];
    },
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
];

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <ElCard class="card-wrapper">
    <ElCollapse v-model="activeName">
      <ElCollapseItem :title="$t('common.search')" name="log-search">
        <ElForm :model="model" label-position="right" :label-width="100">
          <ElRow :gutter="24">
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.type')" prop="type">
                <ElSelect v-model="model.type" :placeholder="$t('page.manage.systemOptionLog.form.type')" clearable>
                  <ElOption
                    v-for="item in logTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.module')" prop="module">
                <ElInput
                  v-model="model.module"
                  :placeholder="$t('page.manage.systemOptionLog.form.module')"
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.action')" prop="action">
                <ElInput
                  v-model="model.action"
                  :placeholder="$t('page.manage.systemOptionLog.form.action')"
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.user_name')" prop="user_name">
                <ElInput
                  v-model="model.user_name"
                  :placeholder="$t('page.manage.systemOptionLog.form.user_name')"
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.user_type')" prop="user_type">
                <ElSelect
                  v-model="model.user_type"
                  :placeholder="$t('page.manage.systemOptionLog.form.user_type')"
                  clearable
                >
                  <ElOption
                    v-for="item in userTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.severity')" prop="severity">
                <ElSelect
                  v-model="model.severity"
                  :placeholder="$t('page.manage.systemOptionLog.form.severity')"
                  clearable
                >
                  <ElOption
                    v-for="item in severityOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.environment')" prop="environment">
                <ElSelect
                  v-model="model.environment"
                  :placeholder="$t('page.manage.systemOptionLog.form.environment')"
                  clearable
                >
                  <ElOption
                    v-for="item in environmentOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :lg="6" :md="8" :sm="12">
              <ElFormItem :label="$t('page.manage.systemOptionLog.ip_address')" prop="ip_address">
                <ElInput
                  v-model="model.ip_address"
                  :placeholder="$t('page.manage.systemOptionLog.form.ip_address')"
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('page.manage.systemOptionLog.dateRange')" prop="dateRange">
                <ElDatePicker
                  v-model="dateRange"
                  type="datetimerange"
                  :start-placeholder="$t('page.manage.systemOptionLog.form.start_date')"
                  :end-placeholder="$t('page.manage.systemOptionLog.form.end_date')"
                  style="width: 100%"
                  clearable
                  :shortcuts="dateShortcuts"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('page.manage.systemOptionLog.keyword')" prop="keyword">
                <ElInput
                  v-model="model.keyword"
                  :placeholder="$t('page.manage.systemOptionLog.form.keyword')"
                  clearable
                >
                  <template #prefix>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                </ElInput>
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElSpace class="w-full justify-end" alignment="end">
                <ElButton @click="reset">
                  <template #icon>
                    <icon-ic-round-refresh class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </ElButton>
                <ElButton type="primary" plain @click="search">
                  <template #icon>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                  {{ $t('common.search') }}
                </ElButton>
              </ElSpace>
            </ElCol>
          </ElRow>
        </ElForm>
      </ElCollapseItem>
    </ElCollapse>
  </ElCard>
</template>

<style scoped></style>
