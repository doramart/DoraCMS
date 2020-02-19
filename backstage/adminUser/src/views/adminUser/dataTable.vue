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
      <el-table-column prop="userName" :label="$t('adminUser.lb_userName')" width="120"></el-table-column>
      <el-table-column prop="group.name" :label="$t('adminUser.lb_userGroup')" width="120"></el-table-column>
      <el-table-column prop="name" :label="$t('adminUser.lb_name')" show-overflow-tooltip></el-table-column>
      <el-table-column prop="phoneNum" :label="$t('adminUser.lb_phoneNum')" show-overflow-tooltip></el-table-column>
      <el-table-column prop="email" :label="$t('adminUser.lb_email')" show-overflow-tooltip></el-table-column>
      <el-table-column prop="enable" :label="$t('adminUser.lb_enable')" show-overflow-tooltip>
        <template slot-scope="scope">
          <svg-icon v-show="scope.row.enable" :style="green" icon-class="check-circle-fill" />
          <svg-icon v-show="!scope.row.enable" :style="red" icon-class="minus-circle-fill" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('adminUser.lb_options')" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editUserInfo(scope.$index, dataList)"
          >
            <svg-icon icon-class="edit" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteUser(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import _ from "lodash";
import { getOneAdminUser, deleteAdminUser } from "@/api/adminUser";
export default {
  props: {
    dataList: Array
  },
  data() {
    return {
      loading: false,
      multipleSelection: [],
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
    };
  },

  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editUserInfo(index, rows) {
      let rowData = rows[index];
      getOneAdminUser({ id: rowData._id })
        .then(result => {
          let adminUserInfo = result.data;
          this.$store.dispatch("adminUser/showAdminUserForm", {
            edit: true,
            formData: adminUserInfo
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    },
    deleteUser(index, rows) {
      this.$confirm(
        this.$t("adminUser.scr_del_ask"),
        this.$t("main.scr_modal_title"),
        {
          confirmButtonText: this.$t("main.confirmBtnText"),
          cancelButtonText: this.$t("main.cancelBtnText"),
          type: "warning"
        }
      )
        .then(() => {
          return deleteAdminUser({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminUser/getAdminUserList");
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