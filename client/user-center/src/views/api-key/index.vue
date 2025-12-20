<template>
  <div class="api-key-page">
    <!-- <page-header
      title="API Key Management"
      description="Create and manage API keys for accessing the API without user authentication."
    /> -->
    <api-key-list />
  </div>
</template>

<script setup>
// import PageHeader from '@/components/PageHeader.vue';
import ApiKeyList from './components/ApiKeyList.vue';
</script>

<style lang="scss" scoped>
.api-key-page {
  // padding: 24px;
}
</style>
