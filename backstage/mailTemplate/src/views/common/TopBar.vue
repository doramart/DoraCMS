<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-20">
      <el-button type="primary" size="small" plain round @click="addMailTemplate">
        <svg-icon icon-class="icon_add" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-4">
      <el-input
        class="dr-searchInput"
        size="small"
        :placeholder="$t('mailTemplate.title')"
        v-model="pageInfo.searchkey"
        suffix-icon="el-icon-search"
        @keyup.enter.native="searchResult"
      ></el-input>
      <!-- TOPBARRIGHT -->
    </div>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/mailTemplate";
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
    addMailTemplate() {
      this.$store.dispatch("mailTemplate/showMailTemplateForm");
    },
    // TOPBARLEFTOPTION

    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("mailTemplate/getMailTemplateList", {
        searchkey
      });
    } // TOPBARRIGHTSEARCH
  },
  components: {}
};
</script>
<style lang="scss">
</style>
