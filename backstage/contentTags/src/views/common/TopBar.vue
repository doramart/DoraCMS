<template>
  <div class="dr-toolbar">
    <el-col :xs="12" :md="18" class="option-button">
      <el-button size="small" type="primary" plain round @click="addTag">
        <svg-icon icon-class="icon_add" />
      </el-button>
      <!-- TOPBARLEFT -->
    </el-col>
    <el-col :xs="12" :md="6">
      <div class="dr-toolbar-right">
        <el-input
          class="dr-searchInput"
          size="small"
          :placeholder="$t('topBar.tagName')"
          v-model="pageInfo.searchkey"
          suffix-icon="el-icon-search"
          @keyup.enter.native="searchResult"
        ></el-input>
      </div>
    </el-col>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/contentTag";
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
    addTag() {
      this.$store.dispatch("contentTag/showContentTagForm");
    },
    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("contentTag/getContentTagList", {
        searchkey
      });
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
