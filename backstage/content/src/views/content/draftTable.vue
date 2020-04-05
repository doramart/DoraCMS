<template>
  <div :class="'dr-contentDraftDioalog ' + device">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="4"
      :lg="4"
      :xl="4"
      class="cover-dialog"
      title="回收站"
      width="60%"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <DraftTopBar :device="device" :ids="selectDraftList" :pageInfo="draftContentList.pageInfo"></DraftTopBar>
      <el-table
        @selection-change="handleDraftSelectionChange"
        :data="draftContentList.docs"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column
          prop="title"
          :label="$t('contents.title')"
          width="350"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <div v-if="scope.row.state =='2'">
              <a :href="'/details/'+scope.row._id+'.html'" target="_blank">{{scope.row.title}}</a>
            </div>
            <div v-else>{{scope.row.title}}</div>
          </template>
        </el-table-column>
        <el-table-column prop="state" :label="$t('contents.enable')" show-overflow-tooltip>
          <template slot-scope="scope">
            <svg-icon v-show="scope.row.state=='2'" :style="green" icon-class="check-circle-fill" />
            <svg-icon v-show="scope.row.state!='2'" :style="red" icon-class="minus-circle-fill" />
          </template>
        </el-table-column>
        <el-table-column prop="updateDate" :label="$t('contents.updateDate')" width="180">
          <template slot-scope="scope">{{scope.row.updateDate}}</template>
        </el-table-column>
        <el-table-column :label="$t('main.dataTableOptions')" min-width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              plain
              round
              @click="reserveContent(scope.$index, draftContentList.docs)"
            >
              <svg-icon icon-class="icon_reserve" />
            </el-button>
            <el-button
              size="mini"
              type="danger"
              plain
              round
              @click="justDelete(scope.$index, draftContentList.docs)"
            >
              <svg-icon icon-class="icon_delete" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <DraftPagination :device="device" :pageInfo="draftContentList.pageInfo" pageType="content"></DraftPagination>
    </el-dialog>
  </div>
</template>
<script>
import { deleteContent, updateManyContent } from "@/api/content";
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
import DraftPagination from "../common/DraftPagination";
import DraftTopBar from "../common/DraftTopBar";
export default {
  props: {
    dialogState: Object,
    device: String
  },
  data() {
    return {
      // draftContentList: [],
      selectDraftList: [],
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
    };
  },
  computed: {
    ...mapGetters(["draftContentList"])
  },
  components: {
    DraftPagination,
    DraftTopBar
  },
  methods: {
    handleDraftSelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.selectDraftList = ids;
      } else {
        this.selectDraftList = "";
      }
    },
    reserveContent(index, rows) {
      this.$confirm("确认要恢复该文档吗？", this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning"
      })
        .then(() => {
          return updateManyContent({
            ids: rows[index]._id,
            updates: { draft: "0" }
          });
        })
        .then(result => {
          if (result.status === 200) {
            Object.assign(this.draftContentList.pageInfo);
            this.$store.dispatch(
              "content/getDraftContentList",
              this.draftContentList.pageInfo
            );
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
    justDelete(index, rows) {
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
          return deleteContent({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            Object.assign(this.draftContentList.pageInfo);
            this.$store.dispatch(
              "content/getDraftContentList",
              this.draftContentList.pageInfo
            );
            this.$store.dispatch("content/getContentList");
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    }
  },
  mounted() {}
};
</script>
<style lang="scss" >
.dr-contentDraftDioalog {
  .el-dialog__body {
    padding-top: 0 !important;
  }
}
</style>
