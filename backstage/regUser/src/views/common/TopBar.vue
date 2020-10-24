<template>
  <div class="dr-toolbar">
    <el-col :xs="12" :md="18" class="option-button">
      <el-button size="small" type="danger" plain round @click="branchDelete('user')">
        <svg-icon icon-class="icon_delete" />
      </el-button>
      <!-- TOPBARLEFT -->
    </el-col>
    <el-col :xs="12" :md="6">
      <div class="dr-toolbar-right">
        <el-input
          class="dr-searchInput"
          size="small"
          placeholder="用户名/手机号/邮箱"
          v-model="pageInfo.searchkey"
          suffix-icon="el-icon-search"
          @keyup.enter.native="searchResult"
        ></el-input>
      </div>
    </el-col>
  </div>
</template>
<script>
import { deleteRegUser } from "@/api/regUser";
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
          return deleteRegUser({
            ids
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("regUser/getRegUserList");
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
    searchResult(ev) {
      let searchkey = this.pageInfo ? this.pageInfo.searchkey : "";
      this.$store.dispatch("regUser/getRegUserList", {
        searchkey,
        isTopBar: "1"
      });
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
