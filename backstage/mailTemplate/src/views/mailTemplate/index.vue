<template>
  <div :class="classObj" class="adminUser">
    <div class="main-container">
      <MailTemplateForm
        :templateSelectOption="templateSelectOption"
        :device="device"
        :dialogState="formState"
        ref="contentFrom"
      ></MailTemplateForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="mailTemplate" :pageInfo="mailTemplateList.pageInfo"></TopBar>
          <DataTable
            :mailTemplateTypeList="mailTemplateTypeList"
            :pageInfo="mailTemplateList.pageInfo"
            :dataList="mailTemplateList.docs"
          ></DataTable>
          <Pagination
            :device="device"
            :pageInfo="mailTemplateList.pageInfo"
            pageType="mailTemplate"
          ></Pagination>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import MailTemplateForm from "./form";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "mailTemplate",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    DataTable,
    TopBar,
    MailTemplateForm,
    Pagination
  },
  methods: {},
  computed: {
    ...mapGetters(["mailTemplateList", "mailTemplateTypeList"]),
    formState() {
      return this.$store.getters.mailTemplateFormState;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    },
    templateSelectOption() {
      let typelist = this.mailTemplateTypeList;
      if (typelist) {
        let tempTypeArr = [];
        for (const typeItem in typelist) {
          if (typelist.hasOwnProperty(typeItem)) {
            const element = typelist[typeItem];
            tempTypeArr.push({
              label: element,
              value: typeItem
            });
          }
        }
        return tempTypeArr;
      } else {
        return [];
      }
    }
  },
  mounted() {
    initEvent(this);
    this.$store.dispatch("mailTemplate/getMailTemplateList");
    this.$store.dispatch("mailTemplate/getMailTemplateTypeList");
  }
};
</script>

<style lang="">
</style>