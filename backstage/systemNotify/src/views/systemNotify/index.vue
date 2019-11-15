<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="systemNotify" :ids="selectlist"></TopBar>
          <DataTable :dataList="systemNotify.docs" @changeSystemNotifySelectList="changeLogsSelect"></DataTable>
          <Pagination :device="device" :pageInfo="systemNotify.pageInfo" pageType="systemNotify"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { initEvent } from "@root/publicMethods/events";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "systemNotify",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop",
      selectlist: []
    };
  },
  components: {
    DataTable,
    TopBar,
    Pagination
  },
  methods: {
    changeLogsSelect(ids) {
      this.selectlist = ids;
    }
  },
  computed: {
    ...mapGetters(["systemNotify"]),
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
    this.$store.dispatch("systemNotify/getSystemNotifyList");
  }
};
</script>

<style lang="">
</style>
