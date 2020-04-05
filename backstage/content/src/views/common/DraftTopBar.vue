<template>
  <div class="dr-toolbar">
    <el-col :xs="8" :md="6" class="option-button">
      <el-button size="small" type="primary" plain @click="reserveContent()" round>
        <svg-icon icon-class="icon_reserve" />
      </el-button>
      <el-button size="small" type="danger" plain round @click="branchDelete()">
        <svg-icon icon-class="icon_delete" />
      </el-button>

      <!-- TOPBARLEFT -->
    </el-col>
    <el-col :xs="16" :md="18">
      <div class="dr-toolbar-right">
        <div class="dr-select-box">
          <el-input
            class="dr-searchInput"
            style="width:180px"
            size="small"
            :placeholder="$t('topBar.keywords')"
            v-model="pageInfo.searchkey"
            suffix-icon="el-icon-search"
            @keyup.enter.native="searchResult"
          ></el-input>
        </div>
      </div>
    </el-col>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { deleteContent, updateManyContent } from "@/api/content";
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      loading: false,
      selectUserList: [],
      searchkey: ""
    };
  },
  computed: {},
  methods: {
    reserveContent() {
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
      this.$confirm("确认要恢复该文档吗？", this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning"
      })
        .then(() => {
          return updateManyContent({
            ids: _this.ids.join(),
            updates: { draft: "0" }
          });
        })
        .then(result => {
          if (result.status === 200) {
            Object.assign(this.pageInfo);
            this.$store.dispatch("content/getDraftContentList", this.pageInfo);
            this.$store.dispatch("content/getContentList");
            this.$message({
              message: "恢复成功",
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
    branchDelete() {
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
        this.$t("main.just_del_notice"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          let ids = _this.ids.join();
          return deleteContent({
            ids
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("content/getDraftContentList", this.pageInfo);
            this.$store.dispatch("content/getContentList");
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
      this.$store.dispatch("content/getDraftContentList", this.pageInfo);
    }

    // TOPBARLEFTOPTION
  },
  components: {},
  mounted() {}
};
</script>
<style lang="scss">
</style>
