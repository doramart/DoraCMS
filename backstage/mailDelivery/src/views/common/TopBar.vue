<template>
  <div class="dr-toolbar">
    <el-col :xs="12" :md="20" class="option-button">
      <el-button type="primary" size="small" plain round @click="addMailDelivery">
        <svg-icon icon-class="icon_add" />
      </el-button>
      <!-- TOPBARLEFT -->
    </el-col>
    <el-col :xs="12" :md="4">
      <el-input
        class="dr-searchInput"
        size="small"
        :placeholder="$t('main.name')"
        v-model="pageInfo.searchkey"
        suffix-icon="el-icon-search"
        @keyup.enter.native="searchResult"
      ></el-input>
      <!-- TOPBARRIGHT -->
    </el-col>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/mailDelivery";
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
    addMailDelivery() {
      this.$store.dispatch("mailDelivery/showMailDeliveryForm", {
        formData: {
          type: "0",
          targetType: "0"
        }
      });
    },
    // TOPBARLEFTOPTION

    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("mailDelivery/getMailDeliveryList", {
        searchkey
      });
    } // TOPBARRIGHTSEARCH
  },
  components: {}
};
</script>
<style lang="scss">
</style>
