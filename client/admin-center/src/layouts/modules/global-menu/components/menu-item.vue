<script setup lang="ts">
interface Props {
  item: App.Global.Menu;
}

const { item } = defineProps<Props>();

const hasChildren = item.children && item.children.length > 0;
</script>

<template>
  <ElSubMenu v-if="hasChildren" :index="item.key">
    <template #title>
      <ElIcon>
        <component :is="item.icon" />
      </ElIcon>
      <span class="ib-ellipsis">{{ item.label }}</span>
    </template>
    <MenuItem v-for="child in item.children" :key="child.key" :item="child" :index="child.key"></MenuItem>
  </ElSubMenu>
  <ElMenuItem v-else>
    <ElIcon>
      <component :is="item.icon" />
    </ElIcon>
    <span class="ib-ellipsis">{{ item.label }}</span>
  </ElMenuItem>
</template>

<style scoped>
.ib-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}
</style>
