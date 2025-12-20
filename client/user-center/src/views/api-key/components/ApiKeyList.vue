<template>
  <div class="page-container api-key-list">
    <PageHeader :title="$t('user.apiKey.apiKeyList')">
      <el-button type="primary" @click="handleCreate" class="create-btn">
        <el-icon><Plus /></el-icon>
        {{ $t('user.apiKey.createApiKey') }}
      </el-button>
    </PageHeader>
    <div class="page-box-content">
      <div class="api-key-list">
        <base-table
          v-loading="loading"
          :data="apiKeys"
          :total="total"
          :show-pagination="true"
          :default-page-size="10"
          @page-change="handleCurrentChange"
          @size-change="handleSizeChange"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" :label="$t('user.apiKey.name')" />
          <el-table-column prop="status" :label="$t('user.apiKey.status')">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? $t('user.apiKey.active') : $t('user.apiKey.inactive') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" :label="$t('user.apiKey.createdAt')" />
          <el-table-column prop="lastUsedAt" :label="$t('user.apiKey.lastUsedAt')" />
          <el-table-column :label="$t('content.actions')" width="300" fixed="right">
            <template #default="{ row }">
              <el-space>
                <el-button link type="primary" @click="handleView(row)">
                  {{ $t('user.apiKey.actions.view') }}
                </el-button>
                <el-button link type="primary" @click="handleEdit(row)">
                  {{ $t('user.apiKey.actions.edit') }}
                </el-button>
                <el-button link :type="row.status === 'active' ? 'danger' : 'success'" @click="handleToggleStatus(row)">
                  {{ row.status === 'active' ? $t('user.apiKey.actions.disable') : $t('user.apiKey.actions.enable') }}
                </el-button>
                <el-button link type="primary" @click="handleRotate(row)">
                  {{ $t('user.apiKey.actions.rotate') }}
                </el-button>
                <el-popconfirm :title="$t('user.apiKey.confirm.deleteTitle')" @confirm="handleDelete(row)">
                  <template #reference>
                    <el-button link type="danger">{{ $t('user.apiKey.actions.delete') }}</el-button>
                  </template>
                </el-popconfirm>
              </el-space>
            </template>
          </el-table-column>
        </base-table>
      </div>
    </div>

    <api-key-form v-model="formVisible" :record="currentRecord" @success="handleSuccess" />

    <api-key-detail v-model="detailVisible" :record="currentRecord" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import BaseTable from '@/components/common/BaseTable.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ApiKeyForm from './ApiKeyForm.vue';
import ApiKeyDetail from './ApiKeyDetail.vue';
import { apiKeyApi } from '@/api/apikey';

const { t } = useI18n();
const apiKeys = ref([]);
const total = ref(0);
const loading = ref(false);
// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);

// 排序参数
const sortBy = ref('');
const sortOrder = ref('');

const formVisible = ref(false);
const detailVisible = ref(false);
const currentRecord = ref(null);

const fetchData = async (params = {}) => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    // 添加排序参数
    if (sortBy.value) {
      params.sort = sortBy.value;
      params.order = sortOrder.value;
    }
    const res = await apiKeyApi.list(params);
    if (res && res.data) {
      apiKeys.value = res.data.docs || [];
      total.value = res.data?.pageInfo?.totalItems || 0;
    }
  } catch (error) {
    ElMessage.error(t('user.apiKey.messages.fetchFailed'));
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = size => {
  pageSize.value = size;
  fetchData();
};

const handleCurrentChange = page => {
  currentPage.value = page;
  fetchData();
};

const handleCreate = () => {
  currentRecord.value = null;
  formVisible.value = true;
};

const handleEdit = record => {
  currentRecord.value = record;
  formVisible.value = true;
};

const handleView = record => {
  currentRecord.value = record;
  detailVisible.value = true;
};

const handleToggleStatus = async record => {
  try {
    const action = record.status === 'active' ? 'disable' : 'enable';
    await apiKeyApi[action](record.id);
    const message =
      record.status === 'active' ? t('user.apiKey.messages.disableSuccess') : t('user.apiKey.messages.enableSuccess');
    ElMessage.success(message);
    fetchData();
  } catch (error) {
    const message =
      record.status === 'active' ? t('user.apiKey.messages.disableFailed') : t('user.apiKey.messages.enableFailed');
    ElMessage.error(message);
  }
};

const handleRotate = async record => {
  try {
    await apiKeyApi.rotate(record.id);
    ElMessage.success(t('user.apiKey.messages.rotateSuccess'));
    fetchData();
  } catch (error) {
    ElMessage.error(t('user.apiKey.messages.rotateFailed'));
  }
};

const handleDelete = async record => {
  try {
    await apiKeyApi.delete(record.id);
    ElMessage.success(t('user.apiKey.messages.deleteSuccess'));
    fetchData();
  } catch (error) {
    ElMessage.error(t('user.apiKey.messages.deleteFailed'));
  }
};

const handleSuccess = () => {
  formVisible.value = false;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.api-key-list {
  .box-card {
    // margin-bottom: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .create-btn {
    float: right;
    margin-top: -5px;
  }
}
</style>
