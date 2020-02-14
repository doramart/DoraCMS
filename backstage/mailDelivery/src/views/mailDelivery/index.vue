<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">

      <MailDeliveryForm
        :mailTemplateList="mailTemplateList"
        :device="device"
        :dialogState="formState"
        ref="deliveryFrom"
      ></MailDeliveryForm>
      <SendLogDataTable :device="device" ref="sendlogFrom"></SendLogDataTable>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="mailDelivery" :pageInfo="mailDeliveryList.pageInfo"></TopBar>
          <DataTable
            @renderUsers="renderUsers"
            :pageInfo="mailDeliveryList.pageInfo"
            :dataList="mailDeliveryList.docs"
          ></DataTable>
          <Pagination
            :device="device"
            :pageInfo="mailDeliveryList.pageInfo"
            pageType="mailDelivery"
          ></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import MailDeliveryForm from "./form";
import SendLogDataTable from "./sendLogDataTable";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "mailDelivery",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    MailDeliveryForm,
    SendLogDataTable,
    Pagination
  },
  methods: {
    // 回选用户信息
    renderUsers(targetsArr) {
      let selectUserList = [];
      for (const targetItem of targetsArr) {
        selectUserList.push({
          value: targetItem._id,
          label: targetItem.userName
        });
      }
      this.$refs.deliveryFrom.selectUserList = selectUserList;
    }
  },
  computed: {
    ...mapGetters(["mailDeliveryList", "mailTemplateList"]),
    formState() {
      return this.$store.getters.mailDeliveryFormState;
    },
    // sendLogFormState() {
    //   return this.$store.getters.sendLogFormState;
    // },
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
    this.$store.dispatch("mailDelivery/getMailDeliveryList");
    this.$store.dispatch("mailDelivery/getMailTemplateList");
  }
};
</script>

<style lang="">
</style>