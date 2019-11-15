<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" plain round @click="setHasRead()">
        <svg-icon icon-class="had_read" />
      </el-button>
      <el-button size="small" type="danger" plain round @click="branchDelete('systemnotify')">
        <svg-icon icon-class="icon_delete" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
import { deleteSystemNotify, setNoticeRead } from "@/api/systemNotify";
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
    setHasRead() {
      if (_.isEmpty(this.ids)) {
        this.$message({
          type: "info",
          message: this.$t("validate.selectNull", {
            label: this.$t("main.target_Item")
          })
        });
        return false;
      }
      let ids = this.ids.join();
      setNoticeRead({ ids }).then(result => {
        if (result.status === 200) {
          this.$store.dispatch("systemNotify/getSystemNotifyList");
        } else {
          this.$message.error(result.message);
        }
      });
    },
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
          return deleteSystemNotify({
            ids
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("systemNotify/getSystemNotifyList");
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
    }

    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
