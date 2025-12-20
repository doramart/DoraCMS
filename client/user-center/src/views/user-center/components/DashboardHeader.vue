<template>
  <div class="dashboard-header">
    <div class="header-content">
      <div class="user-welcome">
        <el-avatar :size="64" :src="userInfo.logo || defaultAvatar" class="user-avatar">
          {{ userInfo.userName ? userInfo.userName.substring(0, 1).toUpperCase() : 'U' }}
        </el-avatar>
        <div class="welcome-text">
          <h1 class="greeting">{{ greeting }}, {{ userInfo.userName || $t('user.center.user') }}</h1>
          <p class="sub-text">{{ $t('user.center.welcomeMessage') }}</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="date-time">
          <span class="time">{{ currentTime }}</span>
          <span class="date">{{ currentDate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';

const { t } = useI18n();
const userStore = useUserStore();
const defaultAvatar = '';

const userInfo = computed(() => userStore.userInfo || {});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('user.center.goodMorning');
  if (hour < 18) return t('user.center.goodAfternoon');
  return t('user.center.goodEvening');
});

const currentTime = ref('');
const currentDate = ref('');
let timer = null;

const updateTime = () => {
  const now = dayjs();
  currentTime.value = now.format('HH:mm');
  currentDate.value = now.format('YYYY-MM-DD dddd');
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.dashboard-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;

    .user-welcome {
      display: flex;
      align-items: center;
      gap: 20px;

      .user-avatar {
        border: 4px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .welcome-text {
        color: #333;

        .greeting {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #2c3e50;
        }

        .sub-text {
          margin: 0;
          font-size: 14px;
          color: #505050;
          opacity: 0.9;
        }
      }
    }

    .header-actions {
      .date-time {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        color: #2c3e50;

        .time {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .date {
          font-size: 14px;
          opacity: 0.8;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .dashboard-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;

      .header-actions {
        width: 100%;
        .date-time {
          align-items: flex-start;
          flex-direction: row;
          gap: 10px;
          align-items: baseline;
        }
      }
    }
  }
}
</style>
