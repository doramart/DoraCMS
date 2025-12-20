<template>
  <div class="page-header">
    <div class="page-title">{{ title }}</div>
    <div v-if="subtitle" class="page-subtitle">{{ subtitle }}</div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
});
</script>

<style lang="scss" scoped>
.page-header {
  // margin-bottom: 20px;
  // padding-bottom: 15px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color-light);

  .page-title {
    font-size: 18px;
    color: var(--text-color-primary);
    display: inline-block;
    // margin: 0 0 8px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--text-color-secondary);
  }
}
</style>
