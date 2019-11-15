<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <ProjectConfigrationForm :dialogState="formState" ref="contentFrom"></ProjectConfigrationForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="projectConfigration" :pageInfo="projectConfigurationList.pageInfo"></TopBar>
          <DataTable
            :pageInfo="projectConfigurationList.pageInfo"
            :dataList="projectConfigurationList.docs"
          ></DataTable>
          <Pagination
            :device="device"
            :pageInfo="projectConfigurationList.pageInfo"
            pageType="projectConfigration"
          ></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import ProjectConfigrationForm from "./projectConfigrationForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "projectConfigration",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    ProjectConfigrationForm,
    Pagination
  },
  methods: {},
  computed: {
    ...mapGetters(["projectConfigurationList"]),
    formState() {
      return this.$store.getters.projectConfigurationFormState;
    },
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
    this.$store.dispatch("renderCms/getProjectConfigurationList");
  }
};
</script>

<style lang="">
</style>