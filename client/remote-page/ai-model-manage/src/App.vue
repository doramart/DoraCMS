<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('AI Model Management App mounted');
});
</script>

<style>
#app {
  height: 100%;
  background-color: #f5f7fa;
}
</style>
