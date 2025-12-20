<script setup lang="ts">
import { computed } from 'vue';
import { ElTag } from 'element-plus';
import { $t } from '@/locales';

defineOptions({ name: 'LogDetailDrawer' });

interface Props {
  /** Drawer visible */
  visible: boolean;
  /** Log data */
  logData?: Api.SystemManage.SystemOptionLog | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();

const drawerVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const typeTagMap: Record<string, UI.ThemeColor> = {
  login: 'success',
  logout: 'info',
  exception: 'danger',
  operation: 'primary',
  access: '',
  error: 'danger',
  warning: 'warning',
  info: 'info',
  debug: 'info'
};

const severityTagMap: Record<string, UI.ThemeColor> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger'
};

function formatJson(value: any) {
  if (!value) return '-';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

function formatResponseTime(ms: number | undefined) {
  if (!ms) return '-';
  return `${ms}ms`;
}

function formatResponseSize(bytes: number | undefined) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    :title="$t('page.manage.systemOptionLog.logDetail')"
    size="60%"
    destroy-on-close
  >
    <div v-if="logData" class="flex-col gap-16px">
      <!-- Basic Info -->
      <ElCard :header="$t('page.manage.systemOptionLog.basicInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.type')">
            <ElTag :type="typeTagMap[logData.type]">
              {{ $t(`page.manage.systemOptionLog.typeOptions.${logData.type}`) }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.createdAt')">
            {{ logData.createdAt }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.module" :label="$t('page.manage.systemOptionLog.module')">
            <ElTag>{{ logData.module }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.action" :label="$t('page.manage.systemOptionLog.action')">
            <ElTag type="primary">{{ logData.action }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem
            v-if="logData.severity"
            :label="$t('page.manage.systemOptionLog.severity')"
            :span="2"
          >
            <ElTag :type="severityTagMap[logData.severity]">
              {{ $t(`page.manage.systemOptionLog.severityOptions.${logData.severity}`) }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.logs')" :span="2">
            <div class="whitespace-pre-wrap">{{ logData.logs }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- User Info -->
      <ElCard v-if="logData.user_id || logData.user_name" :header="$t('page.manage.systemOptionLog.userInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem v-if="logData.user_name" :label="$t('page.manage.systemOptionLog.user_name')">
            {{ logData.user_name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.user_type" :label="$t('page.manage.systemOptionLog.user_type')">
            {{ $t(`page.manage.systemOptionLog.userTypeOptions.${logData.user_type}`) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.ip_address" :label="$t('page.manage.systemOptionLog.ip_address')">
            {{ logData.ip_address }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.session_id" :label="$t('page.manage.systemOptionLog.session_id')">
            <code class="text-xs">{{ logData.session_id }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.user_agent" :label="$t('page.manage.systemOptionLog.user_agent')" :span="2">
            <div class="text-xs break-all">{{ logData.user_agent }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Request Info -->
      <ElCard v-if="logData.request_path" :header="$t('page.manage.systemOptionLog.requestInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.request_method')">
            <ElTag :type="logData.request_method === 'POST' ? 'success' : 'info'">
              {{ logData.request_method }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.request_path')">
            <code class="text-sm">{{ logData.request_path }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.request_params" :label="$t('page.manage.systemOptionLog.request_params')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.request_params) }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.request_query" :label="$t('page.manage.systemOptionLog.request_query')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.request_query) }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.request_body" :label="$t('page.manage.systemOptionLog.request_body')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.request_body) }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Response Info -->
      <ElCard v-if="logData.response_status" :header="$t('page.manage.systemOptionLog.responseInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.response_status')">
            <ElTag :type="logData.response_status < 400 ? 'success' : 'danger'">
              {{ logData.response_status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.response_time')">
            {{ formatResponseTime(logData.response_time) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.response_size" :label="$t('page.manage.systemOptionLog.response_size')">
            {{ formatResponseSize(logData.response_size) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Operation Info -->
      <ElCard v-if="logData.resource_type" :header="$t('page.manage.systemOptionLog.operationInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.resource_type')">
            {{ logData.resource_type }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.resource_id')">
            {{ logData.resource_id || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.old_value" :label="$t('page.manage.systemOptionLog.old_value')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.old_value) }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.new_value" :label="$t('page.manage.systemOptionLog.new_value')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.new_value) }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Error Info -->
      <ElCard v-if="logData.error_message" :header="$t('page.manage.systemOptionLog.errorInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem :label="$t('page.manage.systemOptionLog.error_message')" :span="2">
            <div class="text-red-600">{{ logData.error_message }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.error_code" :label="$t('page.manage.systemOptionLog.error_code')">
            <code>{{ logData.error_code }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.is_handled !== undefined" :label="$t('page.manage.systemOptionLog.is_handled')">
            <ElTag :type="logData.is_handled ? 'success' : 'warning'">
              {{ logData.is_handled ? '✓' : '✗' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.error_stack" :label="$t('page.manage.systemOptionLog.error_stack')" :span="2">
            <pre class="text-xs bg-red-50 p-2 rounded overflow-auto max-h-300px text-red-800">{{ logData.error_stack }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Additional Info -->
      <ElCard v-if="logData.trace_id || logData.tags || logData.environment" :header="$t('page.manage.systemOptionLog.additionalInfo')" shadow="never">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem v-if="logData.environment" :label="$t('page.manage.systemOptionLog.environment')">
            <ElTag>{{ $t(`page.manage.systemOptionLog.environmentOptions.${logData.environment}`) }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.trace_id" :label="$t('page.manage.systemOptionLog.trace_id')">
            <code class="text-xs">{{ logData.trace_id }}</code>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.client_platform" :label="$t('page.manage.systemOptionLog.client_platform')">
            {{ logData.client_platform }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.client_version" :label="$t('page.manage.systemOptionLog.client_version')">
            {{ logData.client_version }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.tags && logData.tags.length > 0" :label="$t('page.manage.systemOptionLog.tags')" :span="2">
            <ElSpace wrap>
              <ElTag v-for="tag in logData.tags" :key="tag" size="small">{{ tag }}</ElTag>
            </ElSpace>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="logData.extra_data" :label="$t('page.manage.systemOptionLog.extra_data')" :span="2">
            <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-200px">{{ formatJson(logData.extra_data) }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
    </div>
  </ElDrawer>
</template>

<style scoped>
code {
  @apply bg-gray-100 px-2 py-1 rounded text-sm;
}
</style>

