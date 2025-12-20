<template>
  <el-card class="recent-activity-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>{{ $t('user.center.recentActivity') }}</span>
        <el-button link type="primary" @click="handleViewAll">{{ $t('user.center.viewAll') }}</el-button>
      </div>
    </template>

    <div class="activity-list" v-loading="loading">
      <div v-if="activities.length === 0" class="empty-state">
        <el-empty :description="$t('user.center.noDocument')" :image-size="80" />
      </div>

      <div v-else v-for="item in activities" :key="item._id" class="activity-item" @click="handleEdit(item)">
        <div class="activity-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="activity-content">
          <div class="activity-title">{{ item.title }}</div>
          <div class="activity-meta">
            <span class="activity-date">{{ formatDate(item.date) }}</span>
            <el-tag size="small" :type="getStatusType(item.state)">{{ getStatusLabel(item.state) }}</el-tag>
          </div>
        </div>
        <div class="activity-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Document, ArrowRight } from '@element-plus/icons-vue';
import { getUserContents } from '@/api/content';
import dayjs from 'dayjs';

const router = useRouter();
const { t } = useI18n();
const loading = ref(false);
const activities = ref([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getUserContents({ pageSize: 5, current: 1, listState: 'all' });
    if (res.status === 200) {
      activities.value = res.data.docs;
    }
  } catch (error) {
    console.error('Failed to fetch activities:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = date => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const getStatusType = state => {
  const map = {
    0: 'info', // Draft
    1: 'warning', // Pending
    2: 'success', // Published
    3: 'danger', // Failed
  };
  return map[state] || 'info';
};

const getStatusLabel = state => {
  const map = {
    0: t('content.state.draft'),
    1: t('content.state.wait'),
    2: t('content.state.publish'),
    3: t('content.state.failed'),
  };
  return map[state] || t('content.state.draft');
};

const handleViewAll = () => {
  router.push('/my-articles');
};

const handleEdit = item => {
  const { id, state } = item;
  if (state === '3') {
    router.push(`/ai-content-publish?id=${id}`);
  } else if (state === '2') {
    // window.open('')
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.recent-activity-card {
  height: 100%;
  border-radius: 12px;
  border: none;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.activity-list {
  .activity-item {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f5f7fa;
    cursor: pointer;
    transition: background-color 0.3s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f9f9f9;

      .activity-arrow {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      background-color: #e6f7ff;
      color: #1890ff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
      min-width: 0;

      .activity-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .activity-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .activity-date {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .activity-arrow {
      color: #c0c4cc;
      opacity: 0;
      transform: translateX(-5px);
      transition: all 0.3s;
    }
  }
}

.empty-state {
  padding: 40px 0;
}
</style>
