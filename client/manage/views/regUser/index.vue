<template>
  <div class="regUser">
    <UserForm :dialogState="formState"></UserForm>
    <el-row class="dr-datatable">
      <el-col :span="24">
        <TopBar type="regUser" :ids="selectlist" :pageInfo="regUserList.pageInfo"></TopBar>
        <DataTable
          :pageInfo="regUserList.pageInfo"
          :dataList="regUserList.docs"
          @changeUserSelectList="changeSelect"
        ></DataTable>
        <Pagination :pageInfo="regUserList.pageInfo" pageType="regUser"></Pagination>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import UserForm from "./userForm";
import DataTable from "./dataTable.vue";
import TopBar from "../common/TopBar.vue";
import Pagination from "../common/Pagination.vue";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "index",
  data() {
    return {
      selectlist: []
    };
  },
  components: {
    DataTable,
    TopBar,
    UserForm,
    Pagination
  },
  methods: {
    changeSelect(ids) {
      this.selectlist = ids;
    }
  },
  computed: {
    ...mapGetters(["regUserList"]),
    formState() {
      return this.$store.getters.regUserFormState;
    }
  },
  mounted() {
    this.$store.dispatch("getRegUserList");
  }
};
</script>

<style lang="">
</style>