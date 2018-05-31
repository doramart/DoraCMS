<template>
    <div>
        <el-table align="center" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="name" :label="$t('adminGroup.lb_group_name')" width="120">
            </el-table-column>
            <el-table-column prop="comments" :label="$t('adminGroup.lb_group_dis')" show-overflow-tooltip>
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="200">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @ @click="editRoleInfo(scope.$index, dataList)"><i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="warning" plain round @click="editPowerInfo(scope.$index, dataList)"><i class="fa fa-superpowers"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteRole(scope.$index, dataList)"></el-button>
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
    return {};
  },

  methods: {
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
    editRoleInfo(index, rows) {
      this.$store.dispatch("showAdminGroupForm", {
        edit: true,
        formData: rows[index]
      });
    },
    editPowerInfo(index, rows) {
      this.$store.dispatch("showAdminGroupRoleForm", {
        edit: true,
        formData: rows[index]
      });
    },
    deleteRole(index, rows) {
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
          return services.deleteAdminGroup({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getAdminGroupList");
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