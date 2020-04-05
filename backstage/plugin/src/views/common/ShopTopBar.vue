<template>
  <div class="dr-toolbar">
    <div class="option-button el-xs-12 el-col-18">
      &nbsp;
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-xs-12 el-col-6" style="textAlign:right;">
      <el-input
        class="dr-searchInput"
        size="small"
        :placeholder="$t('main.name')"
        v-model="pageInfo.searchkey"
        suffix-icon="el-icon-search"
        @keyup.enter.native="searchResult"
      ></el-input>
      <!-- TOPBARRIGHT -->
    </div>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/plugin";
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
    addPlugin() {
      this.$store.dispatch("plugin/showPluginForm");
    },
    // TOPBARLEFTOPTION

    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("plugin/getShopPluginList", {
        searchkey
      });
    } // TOPBARRIGHTSEARCH
  },
  components: {}
};
</script>
<style lang="scss">
</style>
