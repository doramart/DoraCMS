<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElIcon, ElMenu, ElMenuItem } from 'element-plus';
import { Monitor, Setting } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'MainLayout',
  components: {
    Monitor,
    Setting,
    ElMenu,
    ElMenuItem,
    ElIcon,
  },
  setup() {
    const route = useRoute();
    const activeMenu = ref('/demo1');

    watch(
      () => route.path,
      newPath => {
        if (newPath.startsWith('/demo1')) {
          activeMenu.value = '/demo1';
        } else if (newPath.startsWith('/demo2')) {
          activeMenu.value = '/demo2';
        }
      },
      { immediate: true }
    );

    return {
      activeMenu,
    };
  },
});
</script>

<template>
  <div class="app-layout">
    <ElMenu class="menu-container" :default-active="activeMenu" router :collapse="false">
      <ElMenuItem index="/demo1">
        <ElIcon><Monitor /></ElIcon>
        <span>Demo1 应用</span>
      </ElMenuItem>
      <ElMenuItem index="/demo2">
        <ElIcon><Setting /></ElIcon>
        <span>Demo2 应用</span>
      </ElMenuItem>
    </ElMenu>
    <div class="content-container">
      <div id="subapp-container"></div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.menu-container {
  width: 200px;
  height: 100vh;
  border-right: 1px solid #eee;
}

.content-container {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}

#subapp-container {
  min-height: 100%;
}
</style>
