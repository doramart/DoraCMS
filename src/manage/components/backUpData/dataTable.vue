<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="fileName" :label="$t('backUpData.fileName')" width="200">
                <template slot-scope="scope">
                    <i :style="{color: '#99A9BF'}" class="fa fa-database"></i>&nbsp;{{scope.row.fileName}}
                </template>
            </el-table-column>
            <el-table-column prop="logs" :label="$t('backUpData.option')">
            </el-table-column>
            <el-table-column prop="date" :label="$t('backUpData.bakTime')">
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="120">
                <template slot-scope="scope">
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteDataItem(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import services from "../../store/services.js";
export default {
  props: {
    dataList: Array
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
          return services.deletetBakDataItem({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getBakDateList");
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
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
