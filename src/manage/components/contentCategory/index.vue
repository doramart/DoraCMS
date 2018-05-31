<template>
    <div class="admincategory">
        <CategoryForm :dialogState="formState" :forderlist="getDefaultTempItems"></CategoryForm>
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar type="contentCategory"></TopBar>
                <CategoryTree :treeData="contentCategoryList.docs"></CategoryTree>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import CategoryForm from "./categoryForm";
import CategoryTree from "./categoryTree";
import TopBar from "../common/TopBar.vue";
import { mapGetters, mapActions } from "vuex";
import _ from "lodash";
export default {
  name: "index",
  data() {
    return {};
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
    }
  },
  mounted() {
    this.$store.dispatch("getContentCategoryList");
    this.$store.dispatch("getMyTemplateList");
  }
};
</script>

<style lang="">

</style>