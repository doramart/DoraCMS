<template>
  <div>
    <el-table
      align="center"
      v-loading="loading"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="fileName" :label="$t('backUpData.fileName')" width="200">
        <template slot-scope="scope">
          <i :style="{color: '#99A9BF'}" class="fa fa-database"></i>
          &nbsp;{{scope.row.fileName}}
        </template>
      </el-table-column>
      <el-table-column prop="logs" :label="$t('backUpData.option')"></el-table-column>
      <el-table-column prop="date" :label="$t('backUpData.bakTime')"></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            v-if="scope.row.fileName"
            @click="restoreData(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_restore" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteDataItem(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { deletetBakDataItem, restoreCMSData } from "@/api/backUpData";

export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      loading: false,
      multipleSelection: []
    };
  },

  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    deleteDataItem(index, rows) {
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
          return deletetBakDataItem({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("backUpData/getBakDateList", this.pageInfo);
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
    },
    restoreData(index, rows) {
      this.$confirm(
        this.$t("backUpData.askRestore"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return restoreCMSData({
            id: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("backUpData/getBakDateList");
            this.$message({
              message: this.$t("backUpData.restoreSuccess"),
              type: "success"
            });
          } else {
            this.$message.error(result.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("backUpData.restoreEr") + err
          });
        });
    }
  }
};
</script>
