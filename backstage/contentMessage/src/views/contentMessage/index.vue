<template>
  <div :class="classObj" class="contentMessage">
    <div class="main-container">
      <MessageForm :device="device" :dialogState="formState"></MessageForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="contentMessage" :ids="selectlist" :pageInfo="contentMessageList.pageInfo"></TopBar>
          <DataTable
            :dataList="contentMessageList.docs"
            :pageInfo="contentMessageList.pageInfo"
            @changeMsgSelectList="changeSelect"
          ></DataTable>
          <Pagination
            :device="device"
            :pageInfo="contentMessageList.pageInfo"
            pageType="contentMessage"
          ></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import MessageForm from "./messageForm";
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
    MessageForm,
    Pagination
  },
  methods: {
    changeSelect(ids) {
      this.selectlist = ids;
    }
  },
  computed: {
    ...mapGetters(["contentMessageList"]),
    formState() {
      return this.$store.getters.contentMessageFormState;
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
    this.$store.dispatch("contentMessage/getContentMessageList");
  }
};
</script>

<style lang="">
</style>