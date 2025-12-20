<script setup lang="ts">
import { watch, watchEffect } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({ name: 'PieChart' });

interface PieChartItem {
  name: string;
  value: number;
}

const props = withDefaults(
  defineProps<{
    data?: PieChartItem[];
    loading?: boolean;
    title?: string;
  }>(),
  {
    data: () => [],
    loading: false,
    title: ''
  }
);

const appStore = useAppStore();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  series: [
    {
      color: ['#5da8ff', '#8e9dff', '#fedc69', '#26deca'],
      name: $t('page.home.schedule'),
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '12'
        }
      },
      labelLine: {
        show: false
      },
      data: [] as PieChartItem[]
    }
  ]
}));

function updateChart() {
  updateOptions(opts => {
    opts.series[0].data = props.data;
    opts.series[0].name = props.title || $t('page.home.schedule');
    opts.legend.data = props.data.map(item => item.name);
    return opts;
  });
}

function updateLocale() {
  updateOptions(opts => {
    opts.series[0].name = props.title || $t('page.home.schedule');
    return opts;
  });
}

watchEffect(() => {
  updateChart();
});

watch(
  () => appStore.locale,
  () => {
    updateLocale();
  }
);

export type PieChartDataItem = PieChartItem;
</script>

<template>
  <ElCard class="card-wrapper" v-loading="loading">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </ElCard>
</template>

<style scoped></style>
