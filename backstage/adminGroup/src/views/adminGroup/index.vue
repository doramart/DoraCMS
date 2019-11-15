<template>
  <div :class="classObj" class="adminGroup">
    <div class="main-container">
      <RoleForm :device="device" :dialogState="formState"></RoleForm>
      <PowerForm :device="device" :roleState="roleState" :treeData="adminResourceList.docs"></PowerForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="adminGroup"></TopBar>
          <DataTable :dataList="adminGroupList.docs"></DataTable>
          <Pagination :device="device" :pageInfo="adminGroupList.pageInfo" pageType="adminGroup"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import RoleForm from "./roleForm";
import PowerForm from "./powerForm";
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
      device: "desktop"
    };
  },
  components: {
    DataTable,
    PowerForm,
    TopBar,
    RoleForm,
    Pagination
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["adminGroupList", "adminResourceList"]),
    formState() {
      return this.$store.getters.adminGroupFormState;
    },
    roleState() {
      return this.$store.getters.adminGroupRoleFormState;
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

    this.$store.dispatch("adminGroup/getAdminGroupList");
    this.$store.dispatch("adminResource/getAdminResourceList");
  }
};
</script>

<style lang="">
</style>