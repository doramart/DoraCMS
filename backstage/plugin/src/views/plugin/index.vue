<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <PluginForm :dialogState="formState" ref="contentFrom"></PluginForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <el-tabs type="border-card" @tab-click="askPluginTab">
            <el-tab-pane label="插件列表">
              <ShopTopBar type="shopPlugin" :pageInfo="pluginList.pageInfo"></ShopTopBar>
              <ShopDataTable :pageInfo="shopPluginList.pageInfo" :dataList="shopPluginList.docs"></ShopDataTable>
              <ShopPagination
                :device="device"
                :pageInfo="shopPluginList.pageInfo"
                pageType="plugin"
              ></ShopPagination>
            </el-tab-pane>
            <el-tab-pane label="已安装插件">
              <TopBar type="plugin" :pageInfo="pluginList.pageInfo"></TopBar>
              <DataTable :pageInfo="pluginList.pageInfo" :dataList="pluginList.docs"></DataTable>
              <Pagination :device="device" :pageInfo="pluginList.pageInfo" pageType="plugin"></Pagination>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import PluginForm from "./form";
import DataTable from "./dataTable.vue";
import ShopDataTable from "./shopDataTable.vue";
import TopBar from "../common/TopBar.vue";
import ShopTopBar from "../common/ShopTopBar.vue";
import Pagination from "../common/Pagination.vue";
import ShopPagination from "../common/ShopPagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "plugin",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    ShopTopBar,
    PluginForm,
    Pagination,
    ShopPagination,
    ShopDataTable
  },
  methods: {
    askPluginTab(tabObj) {
      if (tabObj.index == 0) {
        this.$store.dispatch("plugin/getShopPluginList");
      } else if (tabObj.index == 1) {
        this.$store.dispatch("plugin/getPluginList");
      }
    }
  },
  computed: {
    ...mapGetters(["pluginList", "shopPluginList"]),
    formState() {
      return this.$store.getters.pluginFormState;
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
    this.$store.dispatch("plugin/getPluginList");
    this.$store.dispatch("plugin/getShopPluginList");
  }
};
</script>

<style lang="">
</style>