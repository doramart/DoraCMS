<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button type="primary" size="small" plain round @click="addHelp">
        <svg-icon icon-class="icon_add" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/helpCenter";
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
    addHelp() {
      this.$store.dispatch("helpCenter/showHelpCenterForm");
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
