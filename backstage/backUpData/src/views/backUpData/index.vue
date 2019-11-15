<template>
  <div :class="classObj" class="backUpData">
    <div class="main-container">
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="backUpData"></TopBar>
          <DataTable :dataList="bakDataList.docs" :pageInfo="bakDataList.pageInfo"></DataTable>
          <Pagination :device="device" :pageInfo="bakDataList.pageInfo" pageType="backUpData"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "backUpData",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    Pagination
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["bakDataList"]),
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    }
  },
  mounted() {
    initEvent(this);
    this.$store.dispatch("backUpData/getBakDateList");
  }
};
</script>

<style lang="">
</style>
