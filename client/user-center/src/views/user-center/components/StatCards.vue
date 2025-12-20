<template>
  <div class="stat-cards">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8" v-for="(item, index) in stats" :key="index">
        <div class="stat-card" @click="handleNavigate(item.path)">
          <div class="stat-icon" :style="{ background: item.color }">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Document, ChatDotRound, Key } from '@element-plus/icons-vue';
import { getUserContents, getUserComments } from '@/api/content';
import { apiKeyApi } from '@/api/apikey';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();
const userInfo = ref(userStore.userInfo);

const stats = ref([
  {
    label: t('user.center.myDocument'),
    value: 0,
    icon: markRaw(Document),
    color: 'rgba(24, 144, 255, 0.1)',
    iconColor: '#1890ff',
    path: '/my-articles',
  },
  {
    label: t('user.center.joinComments'),
    value: 0,
    icon: markRaw(ChatDotRound),
    color: 'rgba(82, 196, 26, 0.1)',
    iconColor: '#52c41a',
    path: '/join-comments',
  },
  {
    label: t('system.menu.apiKey'),
    value: 0,
    icon: markRaw(Key),
    color: 'rgba(250, 84, 28, 0.1)',
    iconColor: '#fa541c',
    path: '/api-key',
  },
]);

const fetchData = async () => {
  try {
    // Fetch document count
    const contentRes = await getUserContents({ pageSize: 1, listState: 'all' });
    if (contentRes.status === 200) {
      stats.value[0].value = contentRes.data.pageInfo.totalItems;
    }

    // Fetch comments count
    const commentRes = await getUserComments({ pageSize: 1, userId: userInfo.value.id });
    if (commentRes.status === 200) {
      stats.value[1].value = commentRes.data.pageInfo.totalItems;
    }

    // Fetch API key count
    const apiKeyRes = await apiKeyApi.list({ page: 1, limit: 1 });
    if (apiKeyRes?.data) {
      stats.value[2].value = apiKeyRes.data?.pageInfo?.totalItems || 0;
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

const handleNavigate = path => {
  router.push(path);
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  margin-bottom: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: transparent;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    font-size: 24px;

    :deep(.el-icon) {
      color: inherit;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

// Custom colors for icons based on index
.stat-card:nth-child(1) .stat-icon {
  color: #1890ff;
}
.stat-card:nth-child(2) .stat-icon {
  color: #52c41a;
}
.stat-card:nth-child(3) .stat-icon {
  color: #fa541c;
}
</style>
