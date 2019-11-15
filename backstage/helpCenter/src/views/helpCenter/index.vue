<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <HelpCenterForm :device="device" :dialogState="formState" ref="contentFrom"></HelpCenterForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="helpCenter" :pageInfo="helpCenterList.pageInfo"></TopBar>
          <DataTable
            :pageInfo="helpCenterList.pageInfo"
            :dataList="helpCenterList.docs"
            @changeEditorContents="changeEditorContents"
          ></DataTable>
          <Pagination :device="device" :pageInfo="helpCenterList.pageInfo" pageType="helpCenter"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import HelpCenterForm from "./helpCenterForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "helpCenter",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    HelpCenterForm,
    Pagination
  },
  methods: {
    changeEditorContents(contents) {
      this.$refs.contentFrom.setContents(contents);
    }
  },
  computed: {
    ...mapGetters(["helpCenterList"]),
    formState() {
      return this.$store.getters.helpCenterFormState;
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
    this.$store.dispatch("helpCenter/getHelpCenterList");
  }
};
</script>

<style lang="">
</style>