<template>
  <div>
    <el-table
      align="center"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="name" :label="$t('ads.name')" width="200"></el-table-column>
      <el-table-column prop="type" :label="$t('ads.type')" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.type == '0'">{{$t('ads.typeText')}}</span>
          <span v-if="scope.row.type == '1'">{{$t('ads.typePic')}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="state" :label="$t('ads.enable')" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <svg-icon v-show="scope.row.state" :style="green" icon-class="check-circle-fill" />
          <svg-icon v-show="!scope.row.state" :style="red" icon-class="minus-circle-fill" />
        </template>
      </el-table-column>
      <el-table-column prop="comments" :label="$t('ads.dis')" show-overflow-tooltip></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="150">
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" content="Get code" placement="top-start">
            <el-button
              size="mini"
              type="warning"
              plain
              round
              v-clipboard:copy="inputData(scope.$index, dataList)"
              v-clipboard:success="clipboardSuccess"
            >
              <svg-icon icon-class="code" />
            </el-button>
          </el-tooltip>
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editAdsInfo(scope.$index, dataList)"
          >
            <svg-icon icon-class="edit" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteAds(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { delAds } from "@/api/ads";
import clipboard from "@/directive/clipboard/index.js";

export default {
  props: {
    dataList: Array
  },
  data() {
    return {
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
      // inputData: "hello"
    };
  },
  directives: {
    clipboard
  },
  methods: {
    inputData(index, rows) {
      let targetRow = rows[index];
      let adsStr = `
      {% ads name="${targetRow.name}" %}
      {{adsPannel.slider(${targetRow.name})}}
      `;
      return adsStr;
    },
    clipboardSuccess() {
      this.$message({
        message: "复制成功",
        type: "success",
        duration: 1500
      });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editAdsInfo(index, rows) {
      let rowData = rows[index];
      this.$store.dispatch("ads/adsInfoForm", {
        edit: true,
        formData: rowData
      });
      this.$router.push(
        this.$root.adminBasePath + "/ads/editAds/" + rowData._id
      );
    },
    deleteAds(index, rows) {
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
          return delAds({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("ads/getAdsList");
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
  }
};
</script>