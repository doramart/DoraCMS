<template>
  <el-dialog
    v-model="dialogVisible"
    :title="record ? $t('user.apiKey.editApiKey') : $t('user.apiKey.createApiKey')"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="right">
      <el-form-item :label="$t('user.apiKey.name')" prop="name">
        <el-input v-model="form.name" :placeholder="$t('user.apiKey.form.namePlaceholder')" />
      </el-form-item>

      <el-form-item :label="$t('user.apiKey.permissions')" prop="permissions">
        <el-table :data="form.permissions" style="width: 100%">
          <el-table-column :label="$t('user.apiKey.url')" prop="url">
            <template #default="{ row }">
              <el-input v-model="row.url" :placeholder="$t('user.apiKey.form.urlPlaceholder')" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('user.apiKey.method')" prop="method" width="120">
            <template #default="{ row }">
              <el-select v-model="row.method" :placeholder="$t('user.apiKey.form.selectMethod')">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="$t('user.apiKey.enabled')" prop="enabled" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" />
            </template>
          </el-table-column>
          <el-table-column width="80">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removePermission($index)">
                {{ $t('user.apiKey.actions.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="permission-actions">
          <el-button type="primary" link @click="addPermission">
            {{ $t('user.apiKey.addPermission') }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item :label="$t('user.apiKey.ipWhitelist')" prop="ipWhitelist">
        <el-select
          v-model="form.ipWhitelist"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="$t('user.apiKey.form.ipPlaceholder')"
        >
          <el-option v-for="ip in form.ipWhitelist" :key="ip" :label="ip" :value="ip" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('user.apiKey.rateLimit')">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item prop="rateLimit.requests">
              <el-input-number
                v-model="form.rateLimit.requests"
                :min="1"
                :max="1000"
                :placeholder="$t('user.apiKey.form.requestsPlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="rateLimit.period">
              <el-input-number
                v-model="form.rateLimit.period"
                :min="1"
                :max="86400"
                :placeholder="$t('user.apiKey.form.periodPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>

      <el-form-item :label="$t('user.apiKey.expiresAt')" prop="expiresAt">
        <el-date-picker
          v-model="form.expiresAt"
          type="datetime"
          :placeholder="$t('user.apiKey.form.expirationPlaceholder')"
          :disabled-date="disabledDate"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ $t('user.apiKey.actions.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ record ? $t('user.apiKey.actions.update') : $t('user.apiKey.actions.create') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { apiKeyApi } from '@/api/apikey';
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

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = ref(false);
const formRef = ref(null);
const loading = ref(false);

const form = ref({
  name: '',
  permissions: [],
  ipWhitelist: [],
  rateLimit: {
    requests: 100,
    period: 3600,
  },
  expiresAt: null,
});

const rules = {
  name: [
    { required: true, message: t('user.apiKey.validation.nameRequired'), trigger: 'blur' },
    { min: 3, max: 50, message: t('user.apiKey.validation.nameLength'), trigger: 'blur' },
  ],
  permissions: [
    { required: true, message: t('user.apiKey.validation.permissionsRequired'), trigger: 'change' },
  ],
};

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

const resetForm = () => {
  form.value = {
    name: '',
    permissions: [],
    ipWhitelist: [],
    rateLimit: {
      requests: 100,
      period: 3600,
    },
    expiresAt: null,
  };
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

watch(
  () => props.record,
  val => {
    if (val) {
      form.value = {
        name: val.name,
        permissions: val.permissions || [],
        ipWhitelist: val.ipWhitelist || [],
        rateLimit: val.rateLimit || { requests: 100, period: 3600 },
        expiresAt: val.expiresAt ? new Date(val.expiresAt) : null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

const addPermission = () => {
  form.value.permissions.push({
    url: '',
    method: 'GET',
    enabled: true,
  });
};

const removePermission = index => {
  form.value.permissions.splice(index, 1);
};

const disabledDate = time => {
  return time.getTime() < Date.now() - 8.64e7; // Disable dates before today
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const data = {
      ...form.value,
      expiresAt: form.value.expiresAt ? form.value.expiresAt.toISOString() : null,
    };

    if (props.record) {
      await apiKeyApi.update(props.record.id, data);
      ElMessage.success(t('user.apiKey.messages.updateSuccess'));
    } else {
      await apiKeyApi.create(data);
      ElMessage.success(t('user.apiKey.messages.createSuccess'));
    }

    emit('success');
    handleClose();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.permission-actions {
  margin-top: 10px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
