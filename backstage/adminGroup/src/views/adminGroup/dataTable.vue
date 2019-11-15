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
      <el-table-column prop="name" :label="$t('adminGroup.lb_group_name')" width="120"></el-table-column>
      <el-table-column prop="comments" :label="$t('adminGroup.lb_group_dis')" show-overflow-tooltip></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="200">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @
            @click="editRoleInfo(scope.$index, dataList)"
          >
            <svg-icon icon-class="edit" />
          </el-button>
          <el-button
            size="mini"
            type="warning"
            plain
            round
            @click="editPowerInfo(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_newgroup_fill" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
             @click="deleteRole(scope.$index, dataList)"
          ><svg-icon icon-class="icon_delete" /></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import _ from "lodash";
import { getOneAdminGroup, deleteAdminGroup } from "@/api/adminGroup";
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
      let rowData = rows[index];
      getOneAdminGroup({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminGroup/showAdminGroupForm", {
              edit: true,
              formData: result.data
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
    editPowerInfo(index, rows) {
      let rowData = rows[index];
      getOneAdminGroup({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminGroup/showAdminGroupRoleForm", {
              edit: true,
              formData: result.data
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
          return deleteAdminGroup({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminGroup/getAdminGroupList");
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