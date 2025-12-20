<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getOneShopPlugin } from '@/service/api/plugin';
import { $t } from '@/locales';

// Note: These would need to be installed in the project
// import showdown from 'showdown';
// import { useBoolean } from '@/hooks/common';

defineOptions({ name: 'PluginOperateModal' });

export type OperateType = 'add' | 'edit' | 'view' | 'addChild';

interface Props {
  // visible?: boolean;
  operateType?: string;
  rowData?: Api.PluginManage.Plugin | null;
}

const props = defineProps<Props>();

const modalVisible = defineModel<boolean>('visible', {
  default: false
});

// interface Emits {
//   (e: 'update:visible', visible: boolean): void;
//   (e: 'submitted'): void;
// }

// const emit = defineEmits<Emits>();

// Manually implement useBoolean since it's not found
// const modalVisible = ref(props.visible);
const openModal = () => {
  modalVisible.value = true;
};
const closeModal = () => {
  modalVisible.value = false;
};

const loading = ref(false);
const formData = ref<Api.PluginManage.Plugin | null>(null);

// Convert markdown to HTML
const instructionsHtml = computed(() => {
  if (!formData.value?.operationInstructions) return '';

  // Would use showdown in a real implementation
  // const converter = new showdown.Converter();
  // return converter.makeHtml(formData.value.operationInstructions);

  // Simple markdown-like formatting for now
  return formData.value.operationInstructions
    .replace(/\n\n/g, '<br><br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/#{3}\s(.*?)(?:\n|$)/g, '<h3>$1</h3>')
    .replace(/#{2}\s(.*?)(?:\n|$)/g, '<h2>$1</h2>')
    .replace(/#{1}\s(.*?)(?:\n|$)/g, '<h1>$1</h1>');
});

// Watch visibility changes
watch(
  () => modalVisible.value,
  (newValue: boolean) => {
    if (modalVisible.value) {
      openModal();
      if (props.operateType === 'view' && props.rowData) {
        formData.value = props.rowData;

        // If we need to fetch additional data
        if (props.rowData.pluginId) {
          fetchPluginDetails(props.rowData.pluginId);
        }
      }
    } else {
      closeModal();
    }
  },
  {
    deep: true,
    immediate: true
  }
);

// Watch modal visibility to emit changes
// watch(
//   () => modalVisible.value,
//   (newValue: boolean) => {
//     if (!newValue) {
//       emit('update:visible', false);
//     }
//   }
// );

// Fetch plugin details if needed
async function fetchPluginDetails(id: string) {
  try {
    loading.value = true;
    const result = await getOneShopPlugin(id);
    // Check response format
    if (result?.data) {
      formData.value = result.data;
    }
  } catch (error) {
    console.error('Failed to fetch plugin details:', error);
  } finally {
    loading.value = false;
  }
}

// Handle dialog close
function handleClose() {
  closeModal();
}
</script>

<template>
  <ElDialog
    v-model="modalVisible"
    :title="$t('page.extend.plugin.pluginDetail')"
    width="70%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading">
      <div v-if="formData" class="plugin-info">
        <div class="mb-5">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem :label="$t('page.extend.plugin.name')">
              {{ formData.name }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('page.extend.plugin.version')">
              {{ formData.version }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('page.extend.plugin.description')">
              {{ formData.description }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('page.extend.plugin.hooks')">
              {{ formData.hooks ? formData.hooks.join(', ') : '' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('page.extend.plugin.createdAt')">
              {{ formData.createdAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="formData.updatedAt" :label="$t('page.extend.plugin.updatedAt')">
              {{ formData.updatedAt }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <ElDivider v-if="instructionsHtml" />

        <div v-if="instructionsHtml" class="markdown-content" v-html="instructionsHtml"></div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">{{ $t('common.close') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
.plugin-info {
  padding: 16px;
}

.markdown-content {
  padding: 16px;

  :deep(h1) {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }

  :deep(h2) {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  :deep(h3) {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  :deep(ul, ol) {
    padding-left: 2rem;
    margin-bottom: 1rem;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
  }

  :deep(pre) {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow: auto;
    margin-bottom: 1rem;
  }

  :deep(code) {
    font-family: monospace;
  }
}
</style>
