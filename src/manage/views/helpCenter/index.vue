<template>
  <div class="adminUser">
    <HelpCenterForm :dialogState="formState" ref="contentFrom"></HelpCenterForm>
    <el-row class="dr-datatable">
      <el-col :span="24">
        <TopBar type="helpCenter" :pageInfo="helpCenterList.pageInfo"></TopBar>
        <DataTable
          :pageInfo="helpCenterList.pageInfo"
          :dataList="helpCenterList.docs"
          @changeEditorContents="changeEditorContents"
        ></DataTable>
        <Pagination :pageInfo="helpCenterList.pageInfo" pageType="helpCenter"></Pagination>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import HelpCenterForm from "./helpCenterForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "index",
  data() {
    return {};
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
    }
  },
  mounted() {
    this.$store.dispatch("getHelpCenterList");
  }
};
</script>

<style lang="">
</style>