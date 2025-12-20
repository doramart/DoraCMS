<template>
  <div class="ai-content-publish-container">
    <!-- 微应用容器 -->
    <div id="subapp-container" class="micro-app-container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { startQiankun } from '@/utils/qiankun';

// 在组件挂载时启动 qiankun
onMounted(() => {
  // 延迟启动 qiankun，确保 DOM 已经完全初始化
  setTimeout(() => {
    startQiankun();
  }, 100);
});
</script>

<style scoped>
.ai-content-publish-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 180px);
}

.micro-app-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 180px);
}
</style>
