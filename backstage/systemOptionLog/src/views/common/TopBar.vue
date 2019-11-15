<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="danger" plain round @click="branchDelete('systemlogs')">
        <svg-icon icon-class="icon_delete" />
      </el-button>
      <el-tooltip class="item" effect="dark" content="清空所有日志" placement="right-start">
        <el-button size="small" type="warning" plain round @click="clearSystemOptionLogs">
          <svg-icon icon-class="clearAll" />
        </el-button>
      </el-tooltip>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import {
  clearSystemOptionLogs,
  deleteSystemOptionLogs
} from "@/api/systemOptionLog";
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
    branchDelete(target) {
      let _this = this;
      if (_.isEmpty(_this.ids)) {
        this.$message({
          type: "info",
          message: this.$t("validate.selectNull", {
            label: this.$t("main.target_Item")
          })
        });
        return false;
      }
      this.$confirm(
        this.$t("main.del_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          let ids = _this.ids.join();
          return deleteSystemOptionLogs({
            ids
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("systemOptionLog/getSystemLogsList");
            this.$message({
              message: `${this.$t("main.scr_modal_del_succes_info")}`,
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    clearSystemOptionLogs() {
      this.$confirm(
        this.$t("main.del_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return clearSystemOptionLogs();
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("systemOptionLog/getSystemLogsList");
            this.$message({
              message: `清空日志成功`,
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
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
