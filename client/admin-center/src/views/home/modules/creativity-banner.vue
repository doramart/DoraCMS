<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'CreativityBanner' });

const props = withDefaults(
  defineProps<{
    cacheStats?: Api.Ops.CacheStats | null;
    sitemapStatus?: Api.Ops.SitemapStatus | null;
    templateStats?: Api.PluginManage.TemplateStats | null;
    activeTemplate?: Api.PluginManage.Template | null;
    loading?: boolean;
  }>(),
  {
    cacheStats: null,
    sitemapStatus: null,
    templateStats: null,
    activeTemplate: null,
    loading: false,
  }
);

const cacheSummary = computed(() => {
  if (!props.cacheStats) {
    return {
      hitRate: '0%',
      totalRequests: 0,
      errors: 0,
      score: 0,
      status: 'unknown',
      recommendations: [] as Api.Ops.CacheHealthRecommendation[],
    };
  }
  return {
    hitRate: props.cacheStats?.template?.hitRate,
    totalRequests: props.cacheStats?.template?.totalRequests,
    errors: props.cacheStats?.template?.errors,
    score: props.cacheStats?.health?.score,
    status: props.cacheStats?.health?.status,
    recommendations: props.cacheStats?.health?.recommendations || [],
  };
});

const sitemapSummary = computed(() => {
  if (!props.sitemapStatus) {
    return {
      totalUrls: 0,
      contents: 0,
      categories: 0,
      lastGenerated: '-',
      domain: '',
    };
  }
  return {
    totalUrls: props.sitemapStatus.statistics?.totalUrls,
    contents: props.sitemapStatus.statistics?.contents,
    categories: props.sitemapStatus.statistics?.categories,
    lastGenerated: props.sitemapStatus.statistics?.lastGenerated,
    domain: props.sitemapStatus.config?.siteDomain,
  };
});
</script>

<template>
  <ElCard header="站点运行总览" class="h-full card-wrapper" v-loading="loading">
    <ElRow :gutter="16">
      <ElCol :lg="12" :sm="24" class="mb-12px">
        <div class="p-16px rd-8px bg-#f5f7ff dark:bg-dark">
          <div class="text-14px text-#666 mb-4px">缓存命中率</div>
          <div class="text-32px font-semibold text-primary">{{ cacheSummary.hitRate }}</div>
          <ElSpace wrap size="small" class="mt-8px text-13px text-#666">
            <span>请求数：{{ cacheSummary.totalRequests }}</span>
            <ElDivider direction="vertical" />
            <span>错误：{{ cacheSummary.errors }}</span>
            <ElDivider direction="vertical" />
            <span>健康分：{{ cacheSummary.score }}</span>
          </ElSpace>
          <div class="mt-8px">
            <ElTag size="small" type="success" v-if="cacheSummary.status === 'excellent'">运行良好</ElTag>
            <ElTag size="small" type="warning" v-else-if="cacheSummary.status === 'good'">轻微波动</ElTag>
            <ElTag size="small" type="danger" v-else>需关注</ElTag>
          </div>
        </div>
      </ElCol>
      <ElCol :lg="12" :sm="24" class="mb-12px">
        <div class="p-16px rd-8px bg-#f6ffed dark:bg-dark">
          <div class="text-14px text-#666 mb-4px">Sitemap 覆盖</div>
          <div class="text-24px font-semibold text-success">{{ sitemapSummary.totalUrls }} 个 URL</div>
          <ElSpace wrap size="small" class="mt-8px text-13px text-#666">
            <span>文档：{{ sitemapSummary.contents }}</span>
            <ElDivider direction="vertical" />
            <span>栏目：{{ sitemapSummary.categories }}</span>
            <ElDivider direction="vertical" />
            <span>域名：{{ sitemapSummary.domain || '未配置' }}</span>
          </ElSpace>
          <p class="text-12px text-#999 mt-8px">最近生成：{{ sitemapSummary.lastGenerated }}</p>
        </div>
      </ElCol>
    </ElRow>
    <ElDivider />
    <ElRow :gutter="16">
      <ElCol :lg="12" :sm="24" class="mb-12px">
        <div class="text-14px font-medium mb-8px">模板使用情况</div>
        <p class="text-32px font-semibold mb-4px">{{ templateStats?.active || 0 }}/{{ templateStats?.total || 0 }}</p>
        <p class="text-13px text-#666">
          当前主题：{{ activeTemplate?.name || '未激活'
          }}{{ activeTemplate?.version ? ` · v${activeTemplate.version[0] || ''}` : '' }}
        </p>
        <ElSpace wrap size="small" class="mt-8px">
          <ElTag v-if="templateStats?.installed">已安装 {{ templateStats.installed }} 套</ElTag>
          <ElTag v-if="templateStats?.totalDownloads" type="warning">累计下载 {{ templateStats.totalDownloads }}</ElTag>
        </ElSpace>
      </ElCol>
      <ElCol :lg="12" :sm="24" class="mb-12px">
        <div class="text-14px font-medium mb-8px">智能建议</div>
        <ElEmpty v-if="!cacheSummary.recommendations.length" description="暂无优化建议" />
        <ElTimeline v-else>
          <ElTimelineItem
            v-for="item in cacheSummary.recommendations.slice(0, 3)"
            :key="item.action"
            :type="item.type === 'critical' ? 'danger' : item.type === 'warning' ? 'warning' : 'success'"
          >
            <div class="text-13px font-medium">{{ item.message }}</div>
            <p class="text-12px text-#999 mt-4px">建议动作：{{ item.action }}</p>
          </ElTimelineItem>
        </ElTimeline>
      </ElCol>
    </ElRow>
  </ElCard>
</template>

<style scoped></style>
