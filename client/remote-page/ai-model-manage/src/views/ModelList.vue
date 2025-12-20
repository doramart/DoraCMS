<template>
  <div class="model-list-container">
    <!-- 页面头部 -->
    <el-card shadow="never" class="header-card">
      <div class="header-content">
        <div>
          <h2 style="margin: 0 0 8px 0; font-size: 20px">{{ $t('model.title') }}</h2>
          <p style="margin: 0; color: #909399; font-size: 14px">
            {{ $t('model.subtitle') }}
          </p>
        </div>
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('model.add') }}</el-button>
      </div>
    </el-card>

    <!-- 筛选栏 -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="$t('model.provider')">
          <el-select
            v-model="queryParams.provider"
            :placeholder="$t('model.all')"
            clearable
            @change="handleQuery"
            style="width: 150px"
          >
            <el-option :label="$t('model.all')" value="" />
            <el-option label="OpenAI" value="openai" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="Anthropic" value="anthropic" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('model.status')">
          <el-select
            v-model="queryParams.isEnabled"
            :placeholder="$t('model.all')"
            clearable
            @change="handleQuery"
            style="width: 120px"
          >
            <el-option :label="$t('model.all')" value="" />
            <el-option :label="$t('model.enabled')" value="true" />
            <el-option :label="$t('model.disabled')" value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">{{ $t('model.query') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ $t('model.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模型列表 -->
    <el-card shadow="never" style="margin-top: 16px">
      <el-table v-loading="loading" :data="modelList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column :label="$t('model.provider')" width="120">
          <template #default="{ row }">
            <el-tag :type="getProviderTagType(row.provider)" size="small">
              {{ getProviderName(row.provider) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="displayName" :label="$t('model.modelName')" min-width="180" show-overflow-tooltip />

        <el-table-column prop="modelName" :label="$t('model.modelIdentifier')" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text type="info" size="small">{{ row.modelName }}</el-text>
          </template>
        </el-table-column>

        <el-table-column label="API Key" width="140">
          <template #default="{ row }">
            <span v-if="row.config?.apiKey" style="font-family: monospace; font-size: 12px; color: #909399">
              {{ maskApiKey(row.config.apiKey) }}
            </span>
            <el-text v-else type="info" size="small">{{ $t('model.localModel') }}</el-text>
          </template>
        </el-table-column>

        <el-table-column :label="$t('model.priority')" width="100" align="center" sortable prop="priority">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('model.status')" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" @change="handleToggle(row)" :loading="row._toggling" />
          </template>
        </el-table-column>

        <el-table-column :label="$t('model.statistics')" width="140">
          <template #default="{ row }">
            <div style="font-size: 12px; line-height: 1.6">
              <div>{{ $t('model.calls') }}: {{ row.statistics?.totalCalls || 0 }}</div>
              <div v-if="row.statistics?.successRate !== undefined">
                {{ $t('model.successRate') }}: {{ (row.statistics.successRate * 100).toFixed(1) }}%
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('model.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :icon="Edit" @click="handleEdit(row)">{{ $t('model.edit') }}</el-button>
            <el-button link type="primary" size="small" :icon="Connection" @click="handleTest(row)">{{ $t('model.test') }}</el-button>
            <el-popconfirm
              :title="$t('model.confirmDelete')"
              :confirm-button-text="$t('system.button.confirm')"
              :cancel-button-text="$t('system.button.cancel')"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger" size="small" :icon="Delete">{{ $t('model.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作栏 -->
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <div>
          {{ $t('model.selected') }} <span style="color: var(--el-color-primary); font-weight: bold">{{ selectedRows.length }}</span> {{ $t('model.items') }}
        </div>
        <div>
          <el-button size="small" @click="handleBatchEnable">{{ $t('model.batchEnable') }}</el-button>
          <el-button size="small" @click="handleBatchDisable">{{ $t('model.batchDisable') }}</el-button>
          <el-popconfirm
            :title="$t('model.confirmBatchDelete')"
            :confirm-button-text="$t('system.button.confirm')"
            :cancel-button-text="$t('system.button.cancel')"
            @confirm="handleBatchDelete"
          >
            <template #reference>
              <el-button size="small" type="danger" :icon="Delete">{{ $t('model.batchDelete') }}</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 编辑对话框 -->
    <ModelEditDialog
      v-model:visible="dialogVisible"
      :model-data="currentModel"
      :providers="providers"
      @success="handleSaveModel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Plus, Search, Refresh, Edit, Delete, Connection } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  getModels,
  createModel,
  updateModel,
  deleteModel,
  toggleModel,
  batchDelete,
  getProviders,
  testApiKey,
} from '@/api/aiModel';
import ModelEditDialog from '@/components/ModelEditDialog.vue';

const { t } = useI18n();

const loading = ref(false);
const modelList = ref([]);
const total = ref(0);
const selectedRows = ref([]);
const dialogVisible = ref(false);
const currentModel = ref(null);
const providers = ref([]);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  provider: '',
  isEnabled: '',
});

onMounted(() => {
  loadProviders();
  loadModelList();
});

async function loadProviders() {
  try {
    const res = await getProviders();
    providers.value = res.data || [];
  } catch (error) {
    console.error('加载提供商列表失败:', error);
  }
}

async function loadModelList() {
  loading.value = true;
  try {
    const res = await getModels(queryParams);

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '获取数据失败');
    }

    // 解析数据结构（根据实际返回的数据结构）
    const data = res.data;
    if (!data) {
      throw new Error('返回数据格式错误');
    }

    // 获取模型列表（支持多种数据结构）
    modelList.value = data.docs || data.list || data.data || [];

    // 获取分页信息（支持多种数据结构）
    const pageInfo = data.pageInfo;
    if (pageInfo) {
      total.value = pageInfo.totalItems || pageInfo.total || 0;
      // 同步当前页码（如果服务端返回的页码与前端不一致）
      if (pageInfo.current && pageInfo.current !== queryParams.page) {
        queryParams.page = pageInfo.current;
      }
    } else {
      total.value = data.total || 0;
    }

    // 如果没有数据且不是第一页，尝试加载前一页
    if (modelList.value.length === 0 && queryParams.page > 1) {
      queryParams.page--;
      await loadModelList();
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
    // ElMessage.error('加载模型列表失败：' + (error.message || '未知错误'));
    modelList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.page = 1;
  loadModelList();
}

function handleReset() {
  queryParams.page = 1;
  queryParams.pageSize = 20;
  queryParams.provider = '';
  queryParams.isEnabled = '';
  loadModelList();
}

function handleAdd() {
  currentModel.value = null;
  dialogVisible.value = true;
}

function handleEdit(row) {
  currentModel.value = row;
  dialogVisible.value = true;
}

async function handleSaveModel(data) {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: data.id ? t('model.messages.updating') : t('model.messages.creating'),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    let res;
    if (data.id) {
      res = await updateModel(data.id, data);
    } else {
      res = await createModel(data);
    }

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '操作失败');
    }

    ElMessage.success(data.id ? t('model.messages.updateSuccess') : t('model.messages.createSuccess'));

    // 重新加载列表
    await loadModelList();
  } catch (error) {
    console.error('保存模型失败:', error);
    // ElMessage.error((data.id ? '更新' : '创建') + '失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

async function handleDelete(row) {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: t('model.messages.deleting'),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const res = await deleteModel(row.id || row._id);

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '删除失败');
    }

    ElMessage.success(t('model.messages.deleteSuccess'));

    // 重新加载列表
    await loadModelList();
  } catch (error) {
    console.error('删除模型失败:', error);
    // ElMessage.error('删除失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

async function handleToggle(row) {
  row._toggling = true;
  const previousState = row.isEnabled;

  try {
    const res = await toggleModel(row.id || row._id, row.isEnabled);

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '操作失败');
    }

    ElMessage.success(row.isEnabled ? t('model.messages.enabledSuccess') : t('model.messages.disabledSuccess'));
  } catch (error) {
    // 回滚状态
    row.isEnabled = previousState;
    console.error('切换模型状态失败:', error);
    // ElMessage.error('操作失败：' + (error.message || '未知错误'));
  } finally {
    row._toggling = false;
  }
}

async function handleTest(row) {
  // 验证 API Key（Ollama 不需要）
  if (!row.config?.apiKey && row.provider !== 'ollama') {
    ElMessage.warning(t('model.messages.pleaseConfigApiKey'));
    return;
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: t('model.messages.testing'),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    // 使用模型 ID 测试（后端会从数据库获取真实的 API Key）
    const res = await testApiKey({
      modelId: row.id || row._id,
    });

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '测试失败');
    }

    // 检查测试结果
    if (res.data?.valid) {
      ElMessage.success(t('model.messages.testSuccess'));
    } else {
      ElMessage.warning(res.data?.message || t('model.messages.testFailed'));
    }
  } catch (error) {
    console.error('测试 API Key 失败:', error);
    // ElMessage.error('测试失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

async function handleBatchEnable() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('model.messages.pleaseSelectModel'));
    return;
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: t('model.messages.enablingBatch', { count: selectedRows.value.length }),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const promises = selectedRows.value.map(row => toggleModel(row.id || row._id, true));
    const results = await Promise.allSettled(promises);

    // 统计成功和失败数量
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    if (failCount === 0) {
      ElMessage.success(`${t('model.messages.batchEnableSuccess')}（${successCount} 个）`);
    } else {
      ElMessage.warning(t('model.messages.batchEnablePartial', { success: successCount, fail: failCount }));
    }

    // 重新加载列表
    await loadModelList();
  } catch (error) {
    console.error('批量启用失败:', error);
    // ElMessage.error('批量启用失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

async function handleBatchDisable() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('model.messages.pleaseSelectModel'));
    return;
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: t('model.messages.disablingBatch', { count: selectedRows.value.length }),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const promises = selectedRows.value.map(row => toggleModel(row.id || row._id, false));
    const results = await Promise.allSettled(promises);

    // 统计成功和失败数量
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    if (failCount === 0) {
      ElMessage.success(`${t('model.messages.batchDisableSuccess')}（${successCount} 个）`);
    } else {
      ElMessage.warning(t('model.messages.batchDisablePartial', { success: successCount, fail: failCount }));
    }

    // 重新加载列表
    await loadModelList();
  } catch (error) {
    console.error('批量禁用失败:', error);
    // ElMessage.error('批量禁用失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('model.messages.pleaseSelectModel'));
    return;
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: t('model.messages.deletingBatch', { count: selectedRows.value.length }),
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    const ids = selectedRows.value.map(row => row.id || row._id);
    const res = await batchDelete(ids);

    // 检查响应状态
    if (res.status !== 200 && res.status !== 0) {
      throw new Error(res.message || '批量删除失败');
    }

    ElMessage.success(`${t('model.messages.batchDeleteSuccess')}（${ids.length} 个）`);

    // 重新加载列表
    await loadModelList();
  } catch (error) {
    console.error('批量删除失败:', error);
    // ElMessage.error('批量删除失败：' + (error.message || '未知错误'));
  } finally {
    loadingInstance.close();
  }
}

function getProviderName(provider) {
  const names = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    ollama: 'Ollama',
    anthropic: 'Anthropic',
    claude: 'Claude',
  };
  return names[provider] || provider;
}

function getProviderTagType(provider) {
  const types = {
    openai: 'primary',
    deepseek: 'success',
    ollama: 'warning',
    anthropic: 'info',
  };
  return types[provider] || 'info';
}

function getPriorityType(priority) {
  if (priority >= 15) return 'danger';
  if (priority >= 10) return 'warning';
  return 'info';
}

function maskApiKey(apiKey) {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '***';
  return apiKey.substring(0, 7) + '***' + apiKey.substring(apiKey.length - 4);
}
</script>

<style scoped lang="scss">
.model-list-container {
  padding: 20px;
}

.header-card {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.filter-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-top: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

:deep(.el-pagination) {
  display: flex;
}
</style>
