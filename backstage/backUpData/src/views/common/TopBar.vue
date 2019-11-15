<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" plain round @click="bakUpData">
        <svg-icon icon-class="icon_cspace_fill" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import { bakUpCMSData } from "@/api/backUpData";
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      selectUserList: [],
      searchkey: ""
    };
  },
  methods: {
    bakUpData() {
      this.$confirm(
        this.$t("backUpData.askBak"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return bakUpCMSData();
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("backUpData/getBakDateList");
            this.$message({
              message: this.$t("backUpData.bakSuccess"),
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("backUpData.bakEr") + err
          });
        });
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
