<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { useRouteStore } from '@/store/modules/route';
import { useTabStore } from '@/store/modules/tab';

defineOptions({ name: 'GlobalContent' });

interface Props {
  /** Show padding for content */
  showPadding?: boolean;
}

withDefaults(defineProps<Props>(), {
  showPadding: true,
});

const appStore = useAppStore();
const themeStore = useThemeStore();
const routeStore = useRouteStore();
const tabStore = useTabStore();
const route = useRoute();

const transitionName = computed(() => (themeStore.page.animate ? themeStore.page.animateMode : ''));

function resetScroll() {
  const el = document.querySelector(`#${LAYOUT_SCROLL_EL_ID}`);

  el?.scrollTo({ left: 0, top: 0 });
}

const isMicroPluginPath = computed(() => {
  return route.name && (route.name as string).startsWith('remote-page');
});
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition
      :name="transitionName"
      mode="out-in"
      @before-leave="appStore.setContentXScrollable(true)"
      @after-leave="resetScroll"
      @after-enter="appStore.setContentXScrollable(false)"
    >
      <div class="view-container">
        <div v-if="isMicroPluginPath" id="subapp-container" class="micro-app-container"></div>
        <KeepAlive :include="routeStore.cacheRoutes" :exclude="routeStore.excludeCacheRoutes">
          <component
            :is="Component"
            v-if="!isMicroPluginPath && appStore.reloadFlag"
            :key="tabStore.getTabIdByRoute(route)"
            :class="{ 'p-16px': showPadding }"
            class="flex-grow bg-layout transition-300"
          />
        </KeepAlive>
      </div>
    </Transition>
  </RouterView>
</template>

<style lang="scss" scoped>
.view-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.micro-app-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
