<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import DarkMode from './modules/dark-mode.vue';
import LayoutMode from './modules/layout-mode.vue';
import ThemeColor from './modules/theme-color.vue';
import PageFun from './modules/page-fun.vue';
import ConfigOperation from './modules/config-operation.vue';

defineOptions({ name: 'ThemeDrawer' });

const appStore = useAppStore();
</script>

<template>
  <ElDrawer v-model="appStore.themeDrawerVisible" :title="$t('theme.themeDrawerTitle')" :size="360">
    <DarkMode />
    <LayoutMode />
    <ThemeColor />
    <PageFun />
    <template #footer>
      <ConfigOperation />
    </template>
  </ElDrawer>
</template>

<style scoped></style>
