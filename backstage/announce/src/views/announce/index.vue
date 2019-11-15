<template>
  <div :class="classObj" class="content">
    <div class="main-container">
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="systemAnnounce"></TopBar>
          <DataTable
            :dataList="systemAnnounce.docs"
            @handleSystemAnnounceChange="changeAnnounceSelect"
          ></DataTable>
          <Pagination
            :device="device"
            :pageInfo="systemAnnounce.pageInfo"
            pageType="systemAnnounce"
          ></Pagination>
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
    changeAnnounceSelect(ids) {
      this.selectlist = ids;
    }
  },
  computed: {
    ...mapGetters(["systemAnnounce"]),
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
    this.$store.dispatch("announce/getSystemAnnounceList");
  }
};
</script>

<style lang="">
</style>