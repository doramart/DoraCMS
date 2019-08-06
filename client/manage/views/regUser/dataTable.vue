<template>
  <div>
    <el-table
      align="center"
      v-loading="loading"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleUserSelect"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="userName" :label="$t('regUser.userName')" width="120"></el-table-column>
      <el-table-column prop="phoneNum" :label="$t('regUser.phoneNum')" width="180">
        <template slot-scope="scope">
          <div v-if="scope.row.countryCode&&scope.row.phoneNum">{{scope.row.countryCode + ' ' + scope.row.phoneNum}}</div>
          <div v-else-if="scope.row.deviceId">{{scope.row.deviceId}}</div>
          <div v-else></div>
        </template>
      </el-table-column>
      <el-table-column prop="group" :label="$t('regUser.group')">
        <template slot-scope="scope">
          <span v-if="scope.row.group == '0'">普通用户</span>
        </template>
      </el-table-column>
      <el-table-column prop="enable" :label="$t('regUser.enable')" show-overflow-tooltip>
        <template slot-scope="scope">
          <i
            :class="scope.row.enable ? 'fa fa-check-circle' : 'fa fa-minus-circle'"
            :style="scope.row.enable ? green : red"
          ></i>
        </template>
      </el-table-column>
      <el-table-column prop="date" :label="$t('regUser.date')" show-overflow-tooltip></el-table-column>
      <el-table-column prop="email" :label="$t('regUser.email')" show-overflow-tooltip></el-table-column>
      <el-table-column prop="integral" :label="$t('regUser.integral')" show-overflow-tooltip></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editUserInfo(scope.$index, dataList)"
          >
            <i class="fa fa-edit"></i>
          </el-button>
          <el-button
            :disabled="lockDel"
            size="mini"
            type="danger"
            plain
            round
            icon="el-icon-delete"
            @click="deleteUser(scope.$index, dataList)"
          ></el-button>
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
      green: { color: "#13CE66" },
      red: { color: "#FF4949" },
      lockDel: true,
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
      services
        .getOneRegUser({ id: rowData._id })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("showRegUserForm", {
              edit: true,
              formData: result.data.data
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