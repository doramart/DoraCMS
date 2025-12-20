<script setup lang="ts" generic="T extends Record<string, unknown>, K = never">
import { VueDraggable } from 'vue-draggable-plus';
import { $t } from '@/locales';

defineOptions({ name: 'TableColumnSetting' });

const columns = defineModel<UI.TableColumnCheck[]>('columns', {
  required: true
});
</script>

<template>
  <ElPopover placement="bottom-end" trigger="click">
    <template #reference>
      <ElButton>
        <template #icon>
          <icon-ant-design-setting-outlined class="text-icon" />
        </template>
        {{ $t('common.columnSetting') }}
      </ElButton>
    </template>
    <VueDraggable v-model="columns" :animation="150" filter=".none_draggable">
      <div
        v-for="item in columns"
        :key="item.prop"
        class="h-36px flex-y-center rd-4px hover:(bg-primary bg-opacity-20)"
      >
        <icon-mdi-drag class="mr-8px h-full cursor-move text-icon" />
        <ElCheckbox v-model="item.checked" class="none_draggable flex-1">{{ item.label }}</ElCheckbox>
      </div>
    </VueDraggable>
  </ElPopover>
</template>

<style scoped></style>
