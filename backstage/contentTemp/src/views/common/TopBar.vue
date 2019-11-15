<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" plain round @click="saveTemplate">
        <svg-icon icon-class="save" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import { updateTemplateFileText } from "@/api/contentTemp";
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array,
    code: String,
    path: String
  },
  data() {
    return {
      selectUserList: [],
      searchkey: ""
    };
  },
  methods: {
    saveTemplate() {
      let params = {
        code: this.code,
        path: this.path
      };
      updateTemplateFileText(params).then(result => {
        if (result.status == 200) {
          this.$message({
            message: this.$t("main.updateSuccess"),
            type: "success"
          });
        } else {
          this.$message.error(result.message);
        }
      });
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
