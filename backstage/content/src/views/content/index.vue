<template>
  <div :class="classObj" class="content">
    <div class="main-container">
      <DirectUser
        :targetEditor="adminUserInfo.targetEditor"
        :dialogState="directUserFormState"
        :ids="selectlist"
      />
      <DraftTable :dialogState="draftContentDialog" />
      <MoveCate :dialogState="moveCateFormState" :ids="selectlist" />
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar
            :device="device"
            type="content"
            :ids="selectlist"
            :pageInfo="contentList.pageInfo"
          ></TopBar>
          <DataTable
            :dataList="contentList.docs"
            :pageInfo="contentList.pageInfo"
            @changeContentSelectList="changeSelect"
          ></DataTable>
          <Pagination :device="device" :pageInfo="contentList.pageInfo" pageType="content"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import DataTable from "./dataTable.vue";
import DirectUser from "./directUser.vue";
import DraftTable from "./draftTable";
import MoveCate from "./moveCate.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "index",
  data() {
    return {
      selectlist: [],
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    Pagination,
    DirectUser,
    MoveCate,
    DraftTable
  },
  methods: {
    changeSelect(ids) {
      this.selectlist = ids;
    }
  },
  computed: {
    ...mapGetters([
      "contentList",
      "directUserFormState",
      "adminUserInfo",
      "moveCateFormState",
      "draftContentDialog"
    ]),
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
    this.$store.dispatch("content/getContentList");
    this.$store.dispatch("adminUser/getUserInfo");
  }
};
</script>

<style lang="">
</style>