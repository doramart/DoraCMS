<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>{{ $t('system.error.notFound') }}</h2>
      <p>{{ $t('system.error.notFoundMessage') }}</p>
      <el-button type="primary" @click="goToHome">{{ $t('system.button.backToHome') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const goToHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  
  .not-found-content {
    text-align: center;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    h1 {
      font-size: 80px;
      color: var(--primary-color);
      margin: 0;
      line-height: 1.2;
    }
    
    h2 {
      font-size: 24px;
      color: var(--text-color-primary);
      margin: 10px 0;
    }
    
    p {
      color: var(--text-color-secondary);
      margin-bottom: 20px;
    }
  }
}
</style> 