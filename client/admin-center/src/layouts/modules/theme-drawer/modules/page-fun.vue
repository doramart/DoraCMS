<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useThemeStore } from '@/store/modules/theme';
import {
  resetCacheStrategyOptions,
  themePageAnimationModeOptions,
  themeScrollModeOptions,
  themeTabModeOptions
} from '@/constants/app';
import { translateOptions } from '@/utils/common';
import SettingItem from '../components/setting-item.vue';

defineOptions({ name: 'PageFun' });

const themeStore = useThemeStore();

const layoutMode = computed(() => themeStore.layout.mode);

const isMixLayoutMode = computed(() => layoutMode.value.includes('mix'));

const isWrapperScrollMode = computed(() => themeStore.layout.scrollMode === 'wrapper');
</script>

<template>
  <ElDivider>{{ $t('theme.pageFunTitle') }}</ElDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem key="1" :label="$t('theme.resetCacheStrategy.title')">
      <ElSelect v-model="themeStore.resetCacheStrategy" size="small" class="w-120px">
        <ElOption
          v-for="{ label, value } in translateOptions(resetCacheStrategyOptions)"
          :key="value"
          :label="label"
          :value="value"
        />
      </ElSelect>
    </SettingItem>
    <SettingItem key="1" :label="$t('theme.scrollMode.title')">
      <ElSelect v-model="themeStore.layout.scrollMode" size="small" class="w-120px">
        <ElOption
          v-for="{ label, value } in translateOptions(themeScrollModeOptions)"
          :key="value"
          :label="label"
          :value="value"
        />
      </ElSelect>
    </SettingItem>
    <SettingItem key="1-1" :label="$t('theme.page.animate')">
      <ElSwitch v-model="themeStore.page.animate" />
    </SettingItem>
    <SettingItem v-if="themeStore.page.animate" key="1-2" :label="$t('theme.page.mode.title')">
      <ElSelect v-model="themeStore.page.animateMode" size="small" class="w-120px">
        <ElOption
          v-for="{ label, value } in translateOptions(themePageAnimationModeOptions)"
          :key="value"
          :label="label"
          :value="value"
        />
      </ElSelect>
    </SettingItem>
    <SettingItem v-if="isWrapperScrollMode" key="2" :label="$t('theme.fixedHeaderAndTab')">
      <ElSwitch v-model="themeStore.fixedHeaderAndTab" />
    </SettingItem>
    <SettingItem key="3" :label="$t('theme.header.height')">
      <ElInputNumber v-model="themeStore.header.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem key="4" :label="$t('theme.header.breadcrumb.visible')">
      <ElSwitch v-model="themeStore.header.breadcrumb.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.header.breadcrumb.visible" key="4-1" :label="$t('theme.header.breadcrumb.showIcon')">
      <ElSwitch v-model="themeStore.header.breadcrumb.showIcon" />
    </SettingItem>
    <SettingItem key="5" :label="$t('theme.tab.visible')">
      <ElSwitch v-model="themeStore.tab.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-1" :label="$t('theme.tab.cache')">
      <ElSwitch v-model="themeStore.tab.cache" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-2" :label="$t('theme.tab.height')">
      <ElInputNumber v-model="themeStore.tab.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5-3" :label="$t('theme.tab.mode.title')">
      <ElSelect v-model="themeStore.tab.mode" size="small" class="w-120px">
        <ElOption
          v-for="{ label, value } in translateOptions(themeTabModeOptions)"
          :key="value"
          :label="label"
          :value="value"
        />
      </ElSelect>
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical'" key="6-1" :label="$t('theme.sider.width')">
      <ElInputNumber v-model="themeStore.sider.width" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical'" key="6-2" :label="$t('theme.sider.collapsedWidth')">
      <ElInputNumber v-model="themeStore.sider.collapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="6-3" :label="$t('theme.sider.mixWidth')">
      <ElInputNumber v-model="themeStore.sider.mixWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="6-4" :label="$t('theme.sider.mixCollapsedWidth')">
      <ElInputNumber v-model="themeStore.sider.mixCollapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical-mix'" key="6-5" :label="$t('theme.sider.mixChildMenuWidth')">
      <ElInputNumber v-model="themeStore.sider.mixChildMenuWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem key="7" :label="$t('theme.footer.visible')">
      <ElSwitch v-model="themeStore.footer.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.footer.visible && isWrapperScrollMode" key="7-1" :label="$t('theme.footer.fixed')">
      <ElSwitch v-model="themeStore.footer.fixed" />
    </SettingItem>
    <SettingItem v-if="themeStore.footer.visible" key="7-2" :label="$t('theme.footer.height')">
      <ElInputNumber v-model="themeStore.footer.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem
      v-if="themeStore.footer.visible && layoutMode === 'horizontal-mix'"
      key="7-3"
      :label="$t('theme.footer.right')"
    >
      <ElSwitch v-model="themeStore.footer.right" />
    </SettingItem>
    <SettingItem key="8" :label="$t('theme.watermark.visible')">
      <ElSwitch v-model="themeStore.watermark.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.watermark.visible" key="8-1" :label="$t('theme.watermark.text')">
      <ElInput
        v-model="themeStore.watermark.text"
        autosize
        type="text"
        size="small"
        class="w-120px"
        placeholder="DoraCMS"
      />
    </SettingItem>
    <SettingItem key="9" :label="$t('theme.header.multilingual.visible')">
      <ElSwitch v-model="themeStore.header.multilingual.visible" />
    </SettingItem>
  </TransitionGroup>
</template>

<style scoped>
.setting-list-move,
.setting-list-enter-active,
.setting-list-leave-active {
  --uno: transition-all-300;
}

.setting-list-enter-from,
.setting-list-leave-to {
  --uno: opacity-0 -translate-x-30px;
}

.setting-list-leave-active {
  --uno: absolute;
}
</style>
