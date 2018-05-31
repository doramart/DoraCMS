<template>
    <div class="adminTemplate">
        <el-row class="dr-datatable">
            <el-col :span="24">
                <TopBar :code="codetxt" :path="codePath" type="adminTemplate"></TopBar>
                <el-row :gutter="20">
                    <el-col :span="16"><div class="grid-content bg-purple">
                        <el-input
                        type="textarea"
                        :rows="20"
                        placeholder="请输入内容"
                        v-model="codetxt">
                        </el-input>
                        </div>
                        </el-col>
                    <el-col :span="8">
                        <div class="grid-content bg-purple">
                            <TemplateTree :treeData="adminTemplateList.docs" pageType="adminTemplate" @changeTreeFile="readTreeFile"></TemplateTree>
                        </div>
                    </el-col>
                </el-row>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import TemplateTree from "./templateTree";
import TopBar from "../common/TopBar.vue";
import { mapGetters, mapActions } from "vuex";
export default {
  name: "index",
  data() {
    return {
      codetxt: "",
      codePath: ""
    };
  },
  components: {
    TopBar,
    TemplateTree
  },
  methods: {
    readTreeFile(data) {
      this.codetxt = data.doc;
      this.codePath = data.path;
    }
  },
  computed: {
    ...mapGetters(["adminTemplateList"])
  },
  mounted() {
    this.$store.dispatch("getAdminTemplateList");
  }
};
</script>

<style lang="">

</style>