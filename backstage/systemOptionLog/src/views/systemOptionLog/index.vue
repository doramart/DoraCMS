<template>
  <div :class="classObj" class="systemOptionLogs">
    <div class="main-container">
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="systemOptionLogs" :ids="selectlist"></TopBar>
          <DataTable
            :pageInfo="systemOptionLogs.pageInfo"
            :dataList="systemOptionLogs.docs"
            @changeSystemLogsSelectList="changeLogsSelect"
          ></DataTable>
          <Pagination :device="device" :pageInfo="systemOptionLogs.pageInfo" pageType="systemOptionLogs"></Pagination>
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
  name: "index",
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
    ...mapGetters(["systemOptionLogs"]),
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
    this.$store.dispatch("systemOptionLog/getSystemLogsList");
  }
};
</script>

<style lang="">
</style>
