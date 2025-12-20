<template>
  <el-card class="quick-actions-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>{{ $t('user.center.quickNav') }}</span>
      </div>
    </template>
    <div class="quick-actions-grid">
      <div v-for="(action, index) in actions" :key="index" class="action-item" @click="handleNavigate(action.path)">
        <div class="action-icon" :style="{ background: action.bgColor, color: action.color }">
          <el-icon><component :is="action.icon" /></el-icon>
        </div>
        <span class="action-label">{{ action.label }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { User, Lock, Document, ChatDotRound, Key, Edit } from '@element-plus/icons-vue';

const router = useRouter();
const { t } = useI18n();

const actions = [
  {
    label: t('user.center.basicInfo'),
    path: '/personal-info',
    icon: User,
    color: '#1890ff',
    bgColor: '#e6f7ff',
  },
  {
    label: t('content.action.addContent'),
    path: '/ai-content-publish',
    icon: Edit,
    color: '#722ed1',
    bgColor: '#f9f0ff',
  },
  {
    label: t('user.action.modifyPassword'),
    path: '/set-password',
    icon: Lock,
    color: '#faad14',
    bgColor: '#fff7e6',
  },
  {
    label: t('user.center.myDocument'),
    path: '/my-articles',
    icon: Document,
    color: '#52c41a',
    bgColor: '#f6ffed',
  },
  {
    label: t('user.center.joinComments'),
    path: '/join-comments',
    icon: ChatDotRound,
    color: '#13c2c2',
    bgColor: '#e6fffb',
  },
  {
    label: t('system.menu.apiKey'),
    path: '/api-key',
    icon: Key,
    color: '#fa541c',
    bgColor: '#fff2e8',
  },
];

const handleNavigate = path => {
  router.push(path);
};
</script>

<style lang="scss" scoped>
.quick-actions-card {
  height: 100%;
  border-radius: 12px;
  border: none;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    font-size: 16px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: #f5f7fa;
      transform: translateY(-2px);
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 8px;
    }

    .action-label {
      font-size: 13px;
      color: #606266;
      text-align: center;
      line-height: 1.4;
    }
  }
}

@media screen and (max-width: 1200px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 480px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
