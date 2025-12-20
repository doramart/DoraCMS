<template>
  <el-card class="announcement-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="card-title">
          <span>{{ $t('user.center.announcements') }}</span>
          <el-tag v-if="total" size="small" type="info" effect="plain">{{ total }}</el-tag>
        </div>
      </div>
    </template>

    <div class="announcement-list" v-loading="loading">
      <div v-if="announcements.length === 0" class="empty-state">
        <el-empty :description="$t('user.center.noAnnouncement')" :image-size="80" />
      </div>

      <div v-else v-for="item in announcements" :key="item._id || item.id" class="announcement-item">
        <div class="announcement-icon">
          <el-icon><Bell /></el-icon>
        </div>
        <div class="announcement-content">
          <div class="announcement-title">{{ item.title }}</div>
          <div class="announcement-meta">
            <span class="sender">{{ item.sender }}</span>
            <span class="dot">•</span>
            <span class="announcement-time">{{ formatDate(item.createTime || item.updateTime) }}</span>
          </div>
          <div class="announcement-text">{{ item.content }}</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bell } from '@element-plus/icons-vue';
import { getUserNotices } from '@/api/notification';
import dayjs from 'dayjs';

const { t } = useI18n();
const loading = ref(false);
const announcements = ref([]);
const total = ref(0);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getUserNotices({ pageSize: 2, current: 1 });
    if (res?.data) {
      announcements.value = res.data.docs || [];
      total.value = res.data.pageInfo?.totalItems || announcements.value.length;
    }
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = date => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '--';
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.announcement-card {
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
    font-size: 16px;

    .card-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.announcement-list {
  .announcement-item {
    display: flex;
    align-items: flex-start;
    padding: 16px 20px;
    border-bottom: 1px solid #f5f7fa;

    &:last-child {
      border-bottom: none;
    }

    .announcement-icon {
      color: #faad14;
      margin-right: 12px;
      margin-top: 2px;
      font-size: 16px;
    }

    .announcement-content {
      flex: 1;

      .announcement-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .announcement-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;

        .dot {
          font-size: 14px;
          line-height: 1;
        }
      }

      .announcement-text {
        font-size: 14px;
        color: #606266;
        margin-bottom: 2px;
        line-height: 1.5;
      }
    }
  }
}

.empty-state {
  padding: 40px 0;
}
</style>
