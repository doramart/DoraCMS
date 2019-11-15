<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <UserForm :device="device" :dialogState="formState" :groups="adminGroupList.docs"></UserForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="adminUser"></TopBar>
          <DataTable :dataList="adminUserList.docs"></DataTable>
          <Pagination :device="device" :pageInfo="adminUserList.pageInfo" pageType="adminUser"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import UserForm from "./userForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import Cookies from "js-cookie";
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
    TopBar,
    UserForm,
    Pagination
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["adminUserList", "adminGroupList"]),
    formState() {
      return this.$store.getters.adminUserFormState;
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
    this.$store.dispatch("adminUser/getAdminUserList");
    this.$store.dispatch("adminGroup/getAdminGroupList");
  }
};
</script>

<style lang="scss" scoped>
</style>
