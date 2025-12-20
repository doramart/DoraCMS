<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';
import SettingItem from '../components/setting-item.vue';

defineOptions({ name: 'ThemeColor' });

const themeStore = useThemeStore();

function handleUpdateColor(color: string | null, key: App.Theme.ThemeColorKey) {
  if (color !== null) {
    themeStore.updateThemeColors(key, color);
  }
}

const swatches: string[] = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#0ea5e9',
  '#06b6d4',
  '#f43f5e',
  '#ef4444',
  '#ec4899',
  '#d946ef',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981'
];
</script>

<template>
  <ElDivider>{{ $t('theme.themeColor.title') }}</ElDivider>
  <div class="flex-col-stretch gap-12px">
    <ElTooltip placement="top-start">
      <template #content>
        <p>
          <span class="pr-12px">{{ $t('theme.recommendColorDesc') }}</span>
          <br />
          <ElButton
            text
            tag="a"
            href="https://uicolors.app/create"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray"
          >
            https://uicolors.app/create
          </ElButton>
        </p>
      </template>
      <SettingItem key="recommend-color" :label="$t('theme.recommendColor')">
        <ElSwitch v-model="themeStore.recommendColor" />
      </SettingItem>
    </ElTooltip>
    <SettingItem v-for="(_, key) in themeStore.themeColors" :key="key" :label="$t(`theme.themeColor.${key}`)">
      <template v-if="key === 'info'" #suffix>
        <ElCheckbox v-model="themeStore.isInfoFollowPrimary">
          {{ $t('theme.themeColor.followPrimary') }}
        </ElCheckbox>
      </template>
      <ElColorPicker
        v-model="themeStore.themeColors[key]"
        class="w-40px"
        :disabled="key === 'info' && themeStore.isInfoFollowPrimary"
        :show-alpha="false"
        :predefine="swatches"
        @change="handleUpdateColor($event, key)"
      />
    </SettingItem>
  </div>
</template>

<style scoped></style>
