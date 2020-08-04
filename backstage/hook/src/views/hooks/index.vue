<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <HookForm :device="device" :dialogState="formState" ref="contentFrom"></HookForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="hooks" :pageInfo="hooksList.pageInfo"></TopBar>
          <DataTable :pageInfo="hooksList.pageInfo" :dataList="hooksList.docs"></DataTable>
          <Pagination :device="device" :pageInfo="hooksList.pageInfo" pageType="hooks"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import HookForm from "./form";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "hooks",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    HookForm,
    Pagination
  },
  methods: {},
  computed: {
    ...mapGetters(["hooksList"]),
    formState() {
      return this.$store.getters.hooksFormState;
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
    this.$store.dispatch("hooks/getHookList");
  }
};
</script>

<style lang="">
</style>