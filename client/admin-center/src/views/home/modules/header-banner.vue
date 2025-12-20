<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'HeaderBanner' });

interface StatisticData {
  id: string | number;
  title: string;
  value: number | string;
  formatter?: (value: number | string) => string;
  suffix?: string;
}

const props = withDefaults(
  defineProps<{
    statistics?: StatisticData[];
    description?: string;
  }>(),
  {
    statistics: () => [],
    description: ''
  }
);

const appStore = useAppStore();
const authStore = useAuthStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));

const statisticData = computed<StatisticData[]>(() => {
  if (!props.statistics?.length) {
    return [
      { id: 0, title: $t('page.home.projectCount'), value: 0 },
      { id: 1, title: $t('page.home.todo'), value: 0 },
      { id: 2, title: $t('page.home.message'), value: 0 }
    ];
  }
  return props.statistics;
});

const desc = computed(() => props.description || $t('page.home.weatherDesc'));

const greeting = computed(() => {
  const hour = new Date().getHours();
  const timeKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
  return $t(`page.home.greeting.${timeKey}`, { userName: authStore.userInfo.userName });
});
</script>

<template>
  <ElCard class="card-wrapper">
    <ElRow :gutter="gap" class="px-8px">
      <ElCol :md="18" :sm="24">
        <div class="flex-y-center">
          <div class="size-72px shrink-0 overflow-hidden rd-1/2">
            <img src="@/assets/imgs/soybean.jpg" class="size-full" />
          </div>
          <div class="pl-12px">
            <h3 class="text-18px font-semibold">
              {{ greeting }}
            </h3>
            <p class="text-#999 leading-30px">
              {{ desc }}
            </p>
          </div>
        </div>
      </ElCol>
      <ElCol :md="6" :sm="24">
        <ElSpace direction="horizontal" class="w-full justify-end" :size="24">
          <ElStatistic v-for="item in statisticData" :key="item.id" class="whitespace-nowrap" v-bind="item" />
        </ElSpace>
      </ElCol>
    </ElRow>
  </ElCard>
</template>

<style scoped></style>
