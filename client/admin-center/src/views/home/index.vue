<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import HeaderBanner from './modules/header-banner.vue';
import CardData, { type CardDataItem } from './modules/card-data.vue';
import LineChart from './modules/line-chart.vue';
import PieChart, { type PieChartDataItem } from './modules/pie-chart.vue';
import ProjectNews, { type ProjectNewsItem } from './modules/project-news.vue';
import CreativityBanner from './modules/creativity-banner.vue';
import { fetchGetContentList } from '@/service/api/content';
import { fetchContentMessageStats } from '@/service/api/content-message';
import { fetchTemplateStats, fetchActiveTemplate } from '@/service/api/template-config';
import { fetchCacheStats, fetchSitemapStatus } from '@/service/api/ops-monitor';
import { fetchClientNoticeList } from '@/service/api/client-notice';

interface StatisticItem {
  id: string;
  title: string;
  value: number;
  formatter?: (value: number) => string;
}

interface LineChartSeries {
  name: string;
  data: number[];
  color?: string;
}

interface LineChartData {
  labels: string[];
  series: LineChartSeries[];
}

const appStore = useAppStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));

const loading = reactive({
  cards: false,
  chart: false,
  timeline: false,
  health: false,
});

const headerStatistics = ref<StatisticItem[]>([]);
const cardData = ref<CardDataItem[]>([]);
const pieData = ref<PieChartDataItem[]>([]);
const lineChartData = ref<LineChartData>({
  labels: [],
  series: [],
});
const systemTimeline = ref<ProjectNewsItem[]>([]);
const cacheStats = ref<Api.Ops.CacheStats | null>(null);
const sitemapStatus = ref<Api.Ops.SitemapStatus | null>(null);
const templateStats = ref<Api.PluginManage.TemplateStats | null>(null);
const activeTemplate = ref<Api.PluginManage.Template | null>(null);
const headerDesc = ref('');
const lineSeriesData = ref<number[]>([]);
const overviewCounts = reactive({
  totalContents: 0,
  pendingContents: 0,
  publishedContents: 0,
  draftContents: 0,
  todayCount: 0,
  messageTotal: 0,
  messageReported: 0,
});

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

function getLast7Days() {
  const today = dayjs().endOf('day');
  const start = today.subtract(6, 'day');
  const days: dayjs.Dayjs[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(start.add(i, 'day'));
  }
  return days;
}

async function loadOverview() {
  loading.cards = true;
  loading.timeline = true;
  try {
    const [contentRes, pendingRes, publishedRes, draftRes, messageStatsRes, noticeRes] = await Promise.all([
      fetchGetContentList({ current: 1, size: 6 }),
      fetchGetContentList({ current: 1, size: 1, state: '1' }),
      fetchGetContentList({ current: 1, size: 1, state: '2' }),
      fetchGetContentList({ current: 1, size: 1, draft: '1' }),
      fetchContentMessageStats(),
      fetchClientNoticeList({ current: 1, pageSize: 6 }),
    ]);

    overviewCounts.totalContents = contentRes?.data?.pageInfo?.totalItems || 0;
    overviewCounts.pendingContents = pendingRes?.data?.pageInfo?.totalItems || 0;
    overviewCounts.publishedContents = publishedRes?.data?.pageInfo?.totalItems || 0;
    overviewCounts.draftContents = draftRes?.data?.pageInfo?.totalItems || 0;
    overviewCounts.todayCount =
      contentRes?.data?.docs?.filter(item => dayjs(item.createdAt).isSame(dayjs(), 'day')).length || 0;
    overviewCounts.messageTotal = messageStatsRes?.data?.total || 0;
    overviewCounts.messageReported = messageStatsRes?.data?.reported || 0;

    applyOverviewLocalization();

    systemTimeline.value =
      noticeRes?.data?.docs?.map(notice => {
        const fallbackId = notice.id || notice.createTime || notice.title || `${Date.now()}-${Math.random()}`;
        return {
          id: fallbackId,
          title: notice.title,
          content: notice.content,
          time: formatDate(notice.createTime),
        };
      }) || [];

    headerDesc.value = $t('page.home.headerDesc', {
      todayCount: overviewCounts.todayCount,
      pendingContents: overviewCounts.pendingContents,
      pendingMessages: overviewCounts.messageReported,
    });
  } catch (error) {
    console.error(error);
    window.$message?.error($t('page.home.overviewLoadError'));
  } finally {
    loading.cards = false;
    loading.timeline = false;
  }
}

async function loadChart() {
  loading.chart = true;
  try {
    const days = getLast7Days();
    const startDate = days[0].format('YYYY-MM-DD');
    const endDate = days[days.length - 1].format('YYYY-MM-DD');
    const contentRangeRes = await fetchGetContentList({
      current: 1,
      size: 200,
      startTime: startDate,
      endTime: endDate,
    });

    const contentMap = new Map<string, number>();
    contentRangeRes?.data?.docs?.forEach((item: any) => {
      const key = dayjs(item.createdAt).format('YYYY-MM-DD');
      contentMap.set(key, (contentMap.get(key) || 0) + 1);
    });

    const labels = days.map(day => day.format('MM-DD'));
    const dateKeys = days.map(day => day.format('YYYY-MM-DD'));
    const seriesData = dateKeys.map(key => contentMap.get(key) || 0);

    lineChartData.value = {
      labels,
      series: [
        {
          name: $t('page.home.contentPublish'),
          data: seriesData,
          color: '#8e9dff',
        },
      ],
    };
    lineSeriesData.value = seriesData;
  } catch (error) {
    console.error(error);
    window.$message?.error($t('page.home.trendLoadError'));
  } finally {
    loading.chart = false;
  }
}

async function loadHealth() {
  loading.health = true;
  try {
    const [templateStatsRes, activeTemplateRes, cacheStatsRes, sitemapStatusRes] = await Promise.all([
      fetchTemplateStats(),
      fetchActiveTemplate(),
      fetchCacheStats(),
      fetchSitemapStatus(),
    ]);

    templateStats.value = templateStatsRes?.data || null;
    activeTemplate.value = activeTemplateRes?.data || null;
    cacheStats.value = cacheStatsRes?.data || null;
    sitemapStatus.value = sitemapStatusRes?.data || null;
  } catch (error) {
    console.error(error);
    window.$message?.error($t('page.home.healthLoadError'));
  } finally {
    loading.health = false;
  }
}

function applyOverviewLocalization() {
  headerStatistics.value = [
    {
      id: 'contentTotal',
      title: $t('page.home.contentTotal'),
      value: overviewCounts.totalContents,
    },
    {
      id: 'pendingContent',
      title: $t('page.home.pendingContent'),
      value: overviewCounts.pendingContents,
      formatter: val => `${val}/${overviewCounts.totalContents || 1}`,
    },
    {
      id: 'reportedMessage',
      title: $t('page.home.pendingMessage'),
      value: overviewCounts.messageReported,
    },
  ];

  cardData.value = [
    {
      key: 'articleTotal',
      title: $t('page.home.todayNewContent'),
      value: overviewCounts.todayCount,
      unit: '',
      color: { start: '#8e9dff', end: '#5da8ff' },
      icon: 'mdi:file-document-outline',
    },
    {
      key: 'messageTotal',
      title: $t('page.home.messageTotal'),
      value: overviewCounts.messageTotal,
      unit: '',
      color: { start: '#f9cf58', end: '#f68057' },
      icon: 'mdi:email-multiple-outline',
    },
    {
      key: 'publishedContent',
      title: $t('page.home.publishedContent'),
      value: overviewCounts.publishedContents,
      color: { start: '#5da8ff', end: '#26deca' },
      icon: 'mdi:check-decagram-outline',
    },
    {
      key: 'draftContent',
      title: $t('page.home.draftContent'),
      value: overviewCounts.draftContents,
      unit: '',
      color: { start: '#ff9f7f', end: '#ff6f61' },
      icon: 'mdi:note-outline',
    },
  ];

  pieData.value = [
    { name: $t('page.home.todayNewContent'), value: overviewCounts.todayCount },
    { name: $t('page.home.pendingContent'), value: overviewCounts.pendingContents },
    { name: $t('page.home.publishedContent'), value: overviewCounts.publishedContents },
    { name: $t('page.home.draftContent'), value: overviewCounts.draftContents },
  ];

  headerDesc.value = $t('page.home.headerDesc', {
    todayCount: overviewCounts.todayCount,
    pendingContents: overviewCounts.pendingContents,
    pendingMessages: overviewCounts.messageReported,
  });
}

function applyChartLocalization() {
  if (!lineSeriesData.value?.length && !lineChartData.value.labels.length) return;
  lineChartData.value = {
    labels: lineChartData.value.labels,
    series: [
      {
        name: $t('page.home.contentPublish'),
        data: lineSeriesData.value.length ? lineSeriesData.value : lineChartData.value.series[0]?.data || [],
        color: '#8e9dff',
      },
    ],
  };
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadChart(), loadHealth()]);
});

watch(
  () => appStore.locale,
  () => {
    applyOverviewLocalization();
    applyChartLocalization();
  }
);
</script>

<template>
  <ElSpace direction="vertical" fill class="pb-0" :size="0">
    <HeaderBanner class="mb-16px" :statistics="headerStatistics" :description="headerDesc" />

    <CardData :card-data="cardData" :loading="loading.cards" class="mb-16px" />

    <ElRow :gutter="gap" class="mb-16px">
      <ElCol :lg="16" :sm="24" class="mb-16px">
        <LineChart :chart-data="lineChartData" :loading="loading.chart" />
      </ElCol>
      <ElCol :lg="8" :sm="24" class="mb-16px">
        <PieChart :data="pieData" :loading="loading.cards" :title="$t('page.home.contentDistribution')" />
      </ElCol>
    </ElRow>

    <ElRow :gutter="gap">
      <ElCol :lg="8" :sm="24" class="mb-16px">
        <ProjectNews :items="systemTimeline" :loading="loading.timeline" />
      </ElCol>
      <ElCol :lg="16" :sm="24" class="mb-16px">
        <CreativityBanner
          :cache-stats="cacheStats"
          :sitemap-status="sitemapStatus"
          :template-stats="templateStats"
          :active-template="activeTemplate"
          :loading="loading.health"
        />
      </ElCol>
    </ElRow>
  </ElSpace>
</template>

<style scoped></style>
