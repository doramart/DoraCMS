<template>
  <div :class="classObj" class="admincategory">
    <div class="main-container">
      <CategoryForm :dialogState="formState" :forderlist="getDefaultTempItems"></CategoryForm>
      <el-row class="dr-datatable">
        <el-col :span="24">
          <TopBar type="contentCategory"></TopBar>
          <CategoryTree :treeData="contentCategoryList.docs"></CategoryTree>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import CategoryForm from "./categoryForm";
import CategoryTree from "./categoryTree";
import TopBar from "../common/TopBar.vue";
import { mapGetters, mapActions } from "vuex";
import _ from "lodash";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "contentCategory",
  data() {
    return {
      sidebarOpened: true,
      device: "desktop"
    };
  },
  components: {
    TopBar,
    CategoryForm,
    CategoryTree
  },
  methods: mapActions([]),
  computed: {
    ...mapGetters(["contentCategoryList", "templateConfigList"]),
    formState() {
      return this.$store.getters.contentCategoryFormState;
    },
    getDefaultTempItems() {
      let myTemps = this.templateConfigList;
      let currentTemp = _.filter(myTemps, temp => {
        return temp.using;
      });
      return currentTemp.length > 0 ? currentTemp[0].items : [];
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
    this.$store.dispatch("contentCategory/getContentCategoryList");
    this.$store.dispatch("contentTemplate/getMyTemplateList");
  }
};
</script>

<style lang="">
</style>