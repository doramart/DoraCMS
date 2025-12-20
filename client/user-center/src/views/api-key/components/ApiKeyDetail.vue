<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('user.apiKey.apiKeyDetails')"
    width="600px"
    @close="handleClose"
  >
    <template v-if="record">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="$t('user.apiKey.name')">
          {{ record.name }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.status')">
          <el-tag :type="record.status === 'active' ? 'success' : 'danger'">
            {{ record.status === 'active' ? $t('user.apiKey.active') : $t('user.apiKey.inactive') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.apiKey')">
          <div class="api-key-value">
            <el-input v-model="record.key" readonly :show-password="!showKey">
              <template #append>
                <el-button @click="copyToClipboard(record.key)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.secret')">
          <div class="api-key-value">
            <el-input v-model="record.secret" readonly :show-password="!showSecret">
              <template #append>
                <el-button @click="copyToClipboard(record.secret)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.permissions')">
          <el-table :data="record.permissions" style="width: 100%">
            <el-table-column prop="url" :label="$t('user.apiKey.url')" />
            <el-table-column prop="method" :label="$t('user.apiKey.method')" width="100" />
            <el-table-column prop="enabled" :label="$t('user.apiKey.enabled')" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">
                  {{ row.enabled ? $t('user.apiKey.yes') : $t('user.apiKey.no') }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.ipWhitelist')">
          <el-tag v-for="ip in record.ipWhitelist" :key="ip" class="ip-tag">
            {{ ip }}
          </el-tag>
          <el-tag v-if="!record.ipWhitelist?.length" type="info">
            {{ $t('user.apiKey.noIpRestrictions') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.rateLimit')">
          {{ record.rateLimit.requests }} {{ $t('user.apiKey.requests') }}
          {{ $t('user.apiKey.per') }} {{ record.rateLimit.period }} {{ $t('user.apiKey.period') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.createdAt')">
          {{ formatDate(record.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.lastUsedAt')">
          {{ record.lastUsedAt ? formatDate(record.lastUsedAt) : $t('user.apiKey.never') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('user.apiKey.expiresAt')">
          {{ record.expiresAt ? formatDate(record.expiresAt) : $t('user.apiKey.never') }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="api-key-usage">
        <h3>{{ $t('user.apiKey.usageInstructions') }}</h3>
        <el-alert :title="$t('user.apiKey.includeHeaders')" type="info" :closable="false">
          <template #default>
            <pre class="code-block">
X-API-Key: {{ record.key }}
X-API-Secret: {{ record.secret }}</pre
            >
          </template>
        </el-alert>
      </div>
    </template>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ $t('user.apiKey.actions.close') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Hide, CopyDocument } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  record: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(false);
const showKey = ref(false);
const showSecret = ref(false);

watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
  }
);

watch(
  () => dialogVisible.value,
  val => {
    emit('update:modelValue', val);
  }
);

const handleClose = () => {
  dialogVisible.value = false;
  showKey.value = false;
  showSecret.value = false;
};

const toggleKeyVisibility = () => {
  showKey.value = !showKey.value;
};

const toggleSecretVisibility = () => {
  showSecret.value = !showSecret.value;
};

const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(t('user.apiKey.messages.copySuccess'));
  } catch (err) {
    ElMessage.error(t('user.apiKey.messages.copyFailed'));
  }
};

const formatDate = date => {
  return new Date(date).toLocaleString();
};
</script>

<style lang="scss" scoped>
.api-key-value {
  display: flex;
  gap: 8px;

  :deep(.el-input-group__append) {
    padding: 0;
    display: flex;
    gap: 4px;
    width: 35px;
  }
}

.ip-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.api-key-usage {
  margin-top: 24px;

  h3 {
    margin-bottom: 16px;
  }

  .code-block {
    margin: 0;
    padding: 8px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-family: monospace;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
