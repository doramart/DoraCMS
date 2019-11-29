<template>
  <div :class="classObj" class="contentTag">
    <div class="main-container">
      <TagForm :device="device" :dialogState="formState"></TagForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="contentTag" :pageInfo="contentTagList.pageInfo"></TopBar>
          <DataTable :pageInfo="contentTagList.pageInfo" :dataList="contentTagList.docs"></DataTable>
          <Pagination :device="device" :pageInfo="contentTagList.pageInfo" pageType="contentTag"></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import TagForm from "./tagForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "contentTag",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    TagForm,
    Pagination
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["contentTagList"]),
    formState() {
      return this.$store.getters.contentTagFormState;
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
    this.$store.dispatch("contentTag/getContentTagList");
  }
};
</script>

<style lang="">
</style>