<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSystemLogsSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="logs" :label="$t('systemOptionLog.actions')">
                <template slot-scope="scope">
                    <el-tag size="small" :type="(scope.row.type).indexOf('exception') > -1 ? 'danger' : 'gray'">{{ scope.row.logs | cutWords(50)}}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="type" :label="$t('systemOptionLog.type')">
                <template slot-scope="scope">
                    <span v-if="scope.row.type == 'login'">{{$t('systemOptionLog.sysLogin')}}</span>
                    <span v-if="(scope.row.type).indexOf('exception') > -1 ">{{$t('systemOptionLog.syserror')}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="date" :label="$t('systemOptionLog.date')">
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="150">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="showDetails(scope.$index, dataList)"><i :class="'fa ' +((scope.row.type).indexOf('exception') > -1 ? 'fa-bug' : 'fa-eye')" aria-hidden="true"></i></el-button>
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
    showDetails(index, dataList) {
      this.$alert(dataList[index].logs, this.$t("systemOptionLog.logDetail"), {
        confirmButtonText: this.$t("main.close_modal")
      });
    },
    handleSystemLogsSelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeSystemLogsSelectList", ids);
      }
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
          return services.deleteSystemOptionLogs({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getSystemLogsList");
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
