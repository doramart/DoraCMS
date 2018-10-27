<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleUserSelect">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="userName" :label="$t('regUser.userName')" width="120">
            </el-table-column>
            <el-table-column prop="date" :label="$t('regUser.date')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="email" :label="$t('regUser.email')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column prop="integral" :label="$t('regUser.integral')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="150">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="editUserInfo(scope.$index, dataList)"><i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteUser(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import services from "../../store/services.js";
export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      loading: false,
      tableData3: this.$store.getters.regUserList.docs,
      multipleSelection: []
    };
  },

  methods: {
    handleUserSelect(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeUserSelectList", ids);
      }
    },
    toggleSelection(rows) {
      if (rows) {
        rows.forEach(row => {
          this.$refs.multipleTable.toggleRowSelection(row);
        });
      } else {
        this.$refs.multipleTable.clearSelection();
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editUserInfo(index, rows) {
      let rowData = rows[index];
      this.$store.dispatch("showRegUserForm", {
        edit: true,
        formData: rowData
      });
    },
    deleteUser(index, rows) {
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
          return services.deleteRegUser({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getRegUserList", this.pageInfo);
            this.$message({
              message: this.$t("main.scr_modal_del_succes_info"),
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("regUser.scr_modal_del_error_info")
          });
        });
    }
  }
};
</script>