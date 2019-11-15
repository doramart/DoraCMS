<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button type="primary" size="small" plain round @click="addProjectConfigration">
        <svg-icon icon-class="icon_add" />
      </el-button>
      <el-button type="warning" size="small" plain round @click="renderCms">
        <svg-icon icon-class="icon_render" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/renderCms";
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      selectUserList: [],
      searchkey: ""
    };
  },
  methods: {
    addProjectConfigration() {
      this.$store.dispatch("renderCms/showProjectConfigurationForm", {
        edit: false
      });
    },
    renderCms() {
      this.$router.push(this.$root.adminBasePath + "/renderCms/configRender");
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
