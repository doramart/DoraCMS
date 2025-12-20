<script setup lang="ts">
import { watch, watchEffect } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({ name: 'LineChart' });

interface LineChartSeries {
  name: string;
  data: number[];
  color?: string;
}

interface LineChartData {
  labels: string[];
  series: LineChartSeries[];
}

const props = withDefaults(
  defineProps<{
    chartData?: LineChartData;
    loading?: boolean;
  }>(),
  {
    chartData: () => ({
      labels: [],
      series: [],
    }),
    loading: false,
  }
);

const appStore = useAppStore();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [$t('page.home.downloadCount'), $t('page.home.registerCount')]
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [] as string[]
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      color: '#8e9dff',
      name: $t('page.home.downloadCount'),
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#8e9dff'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    },
    {
      color: '#26deca',
      name: $t('page.home.registerCount'),
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#26deca'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
}));

function updateChart() {
  const labels = props.chartData?.labels || [];
  const series = props.chartData?.series || [];
  updateOptions(opts => {
    opts.xAxis.data = labels;

    series.forEach((serie, index) => {
      if (!opts.series[index]) {
        return;
      }
      opts.series[index].name = serie.name;
      opts.series[index].data = serie.data;
      if (serie.color) {
        opts.series[index].color = serie.color;
        opts.series[index].areaStyle = {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0.25, color: serie.color },
              { offset: 1, color: '#fff' }
            ]
          }
        };
      }
    });

    opts.legend.data = series.map(item => item.name);

    return opts;
  });
}

function updateLocale() {
  updateOptions((opts, factory) => {
    const originOpts = factory();
    if (!props.chartData?.series?.length) {
      opts.legend.data = originOpts.legend.data;
      opts.series[0].name = originOpts.series[0].name;
      opts.series[1].name = originOpts.series[1].name;
    } else {
      opts.legend.data = props.chartData.series.map(item => item.name);
      props.chartData.series.forEach((serie, index) => {
        if (opts.series[index]) {
          opts.series[index].name = serie.name;
        }
      });
    }

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
</script>

<template>
  <ElCard class="card-wrapper" v-loading="loading">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </ElCard>
</template>

<style scoped></style>
