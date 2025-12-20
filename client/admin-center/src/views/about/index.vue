<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import pkg from '~/package.json';

defineOptions({ name: 'AboutPage' });

const appStore = useAppStore();

const column = computed(() => (appStore.isMobile ? 1 : 2));

interface PkgJson {
  name: string;
  version: string;
  dependencies: PkgVersionInfo[];
  devDependencies: PkgVersionInfo[];
}

interface PkgVersionInfo {
  name: string;
  version: string;
}

const { name, version, dependencies, devDependencies } = pkg;

function transformVersionData(tuple: [string, string]): PkgVersionInfo {
  const [$name, $version] = tuple;
  return {
    name: $name,
    version: $version
  };
}

const pkgJson: PkgJson = {
  name,
  version,
  dependencies: Object.entries(dependencies).map(item => transformVersionData(item)),
  devDependencies: Object.entries(devDependencies).map(item => transformVersionData(item))
};

const latestBuildTime = BUILD_TIME;
</script>

<template>
  <ElSpace direction="vertical" fill :size="16">
    <ElCard :header="$t('page.about.title')" size="small" segmented class="card-wrapper">
      <p>{{ $t('page.about.introduction') }}</p>
    </ElCard>
    <ElCard :header="$t('page.about.projectInfo.title')" size="small" class="card-wrapper">
      <ElDescriptions label-placement="left" border :column="column">
        <ElDescriptionsItem :label="$t('page.about.projectInfo.version')">
          <ElTag type="primary">{{ pkgJson.version }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.about.projectInfo.latestBuildTime')">
          <ElTag type="primary">{{ latestBuildTime }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.about.projectInfo.githubLink')">
          <a class="text-primary" :href="pkg.homepage" target="_blank" rel="noopener noreferrer">
            {{ $t('page.about.projectInfo.githubLink') }}
          </a>
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="$t('page.about.projectInfo.previewLink')">
          <a class="text-primary" :href="pkg.website" target="_blank" rel="noopener noreferrer">
            {{ $t('page.about.projectInfo.previewLink') }}
          </a>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
    <ElCard :header="$t('page.about.prdDep')" class="card-wrapper">
      <ElDescriptions label-placement="left" border :column="column">
        <ElDescriptionsItem v-for="item in pkgJson.dependencies" :key="item.name" :label="item.name">
          {{ item.version }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
    <ElCard :header="$t('page.about.devDep')" class="card-wrapper">
      <ElDescriptions label-placement="left" border :column="column">
        <ElDescriptionsItem v-for="item in pkgJson.devDependencies" :key="item.name" :label="item.name">
          {{ item.version }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </ElSpace>
</template>

<style scoped></style>
