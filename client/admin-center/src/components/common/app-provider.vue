<script setup lang="ts">
import { createTextVNode, defineComponent } from 'vue';

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';

defineOptions({ name: 'AppProvider' });

const ContextHolder = defineComponent({
  name: 'ContextHolder',
  setup() {
    function register() {
      window.$notification = ElNotification;
      window.$messageBox = ElMessageBox;
      window.$message = ElMessage;
    }

    register();

    return () => createTextVNode();
  }
});
</script>

<template>
  <div class="h-full">
    <ContextHolder />
    <slot></slot>
  </div>
</template>

<style scoped></style>
