<script setup lang="ts">
import { computed, reactive } from 'vue';
import { fetchGetContentCategoryList, fetchGetContentTagList } from '@/service/api/content';
import { $t } from '@/locales';
import { convertToTree } from '../utils';
defineOptions({ name: 'ContentSearch' });

const stateOptions = [
  { value: '0', label: 'page.document.content.draft' },
  { value: '1', label: 'page.document.content.pendingReview' },
  { value: '2', label: 'page.document.content.approved' },
  { value: '3', label: 'page.document.content.offline' },
];

interface Props {
  model: Record<string, any>;
}
interface Emits {
  (e: 'update:model', model: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'search'): void;
}
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const state = reactive({
  // model: {} as Record<string, any>,
  categories: [] as any[],
  categoryTree: [] as any[],
  tags: [] as any[],
});

const searchModel = computed({
  get: () => props.model,
  set: value => {
    emit('update:model', value);
  },
});

function search() {
  emit('search');
}

function handleReset() {
  emit('reset');
}

async function getCategoryOptions() {
  const { error, data } = await fetchGetContentCategoryList();
  if (!error && data) {
    // state.categories = data;
    state.categoryTree = data;
  }
}

async function getTagOptions() {
  const { error, data } = await fetchGetContentTagList({ isPaging: '0', pageSize: 200 });
  if (!error && data) {
    state.tags = data;
  }
}

// Initialize data
getCategoryOptions();
getTagOptions();
</script>

<template>
  <ElCard>
    <ElForm :model="searchModel" label-width="80px">
      <ElRow :gutter="16">
        <ElCol :span="6">
          <ElFormItem :label="$t('page.document.content.mainTitle')">
            <ElInput v-model="searchModel.title" clearable />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem :label="$t('page.document.content.category')">
            <ElCascader
              v-model="searchModel.categories"
              :options="state.categoryTree"
              :props="{
                checkStrictly: true,
                emitPath: false,
                value: 'id',
                label: 'name',
                children: 'children',
              }"
              clearable
              filterable
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem :label="$t('page.document.content.state')">
            <ElSelect v-model="searchModel.state" clearable style="width: 100%">
              <ElOption
                v-for="item in stateOptions"
                :key="item.value"
                :label="$t(item.label)"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <div class="flex justify-end gap-12px">
            <ElButton type="primary" @click="search">{{ $t('common.search') }}</ElButton>
            <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
          </div>
        </ElCol>
        <!--
 <ElCol :span="6">
          <ElFormItem :label="$t('page.document.content.tags')">
            <ElSelect v-model="searchModel.tags" clearable filterable style="width: 100%">
              <ElOption v-for="item in state.tags" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
-->
      </ElRow>
    </ElForm>
  </ElCard>
</template>
