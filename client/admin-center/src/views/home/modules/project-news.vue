<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'ProjectNews' });

interface NewsItem {
  id: string | number;
  title?: string;
  content: string;
  time: string;
  icon?: string;
}

const props = withDefaults(
  defineProps<{
    items?: NewsItem[];
    loading?: boolean;
  }>(),
  {
    items: () => [],
    loading: false,
  }
);

const newses = computed<NewsItem[]>(() => {
  if (!props.items.length) {
    return [
      {
        id: 1,
        title: $t('page.home.projectNews.desc1'),
        content: $t('page.home.projectNews.desc1'),
        time: '2021-05-28 22:22:22',
      },
      {
        id: 2,
        title: $t('page.home.projectNews.desc2'),
        content: $t('page.home.projectNews.desc2'),
        time: '2021-10-27 10:24:54',
      },
    ];
  }
  return props.items;
});

export type ProjectNewsItem = NewsItem;
</script>

<template>
  <ElCard class="card-wrapper" v-loading="loading">
    <template #header>
      <ElRow>
        <ElCol :span="18">{{ $t('page.home.projectNews.title') }}</ElCol>
        <ElCol :span="6" class="text-right">
          <a class="text-primary" href="javascript:;">{{ $t('page.home.projectNews.moreNews') }}</a>
        </ElCol>
      </ElRow>
    </template>
    <ElTimeline>
      <ElTimelineItem v-for="item in newses" :key="item.id" :timestamp="item.time" placement="top">
        <ElSpace alignment="start">
          <SoybeanAvatar class="size-48px!" />
          <div class="news-text">
            <p v-if="item.title" class="news-title">
              {{ item.title }}
            </p>
            <p class="news-content">
              {{ item.content }}
            </p>
          </div>
        </ElSpace>
      </ElTimelineItem>
    </ElTimeline>
  </ElCard>
</template>

<style scoped>
.news-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.news-title {
  font-weight: 600;
  line-height: 1.4;
}

.news-content {
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
