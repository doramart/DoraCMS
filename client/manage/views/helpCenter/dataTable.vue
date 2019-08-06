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
      <el-table-column prop="name" :label="$t('helpCenter.name')" width="120"></el-table-column>
      <el-table-column prop="type" :label="$t('helpCenter.type')">
        <template slot-scope="scope">
          <span v-if="scope.row.type == '0'">普通</span>
          <span v-if="scope.row.type == '1'">其它</span>
        </template>
      </el-table-column>
      <el-table-column prop="lang" :label="$t('helpCenter.lang')" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.lang == '1'">简体中文</span>
          <span v-else-if="scope.row.lang == '2'">EN</span>
          <span v-else-if="scope.row.lang == '3'">繁体中文</span>
        </template>
      </el-table-column>
      <el-table-column prop="state" :label="$t('helpCenter.state')">
        <template slot-scope="scope">
          <i
            :class="scope.row.state ? 'fa fa-check-circle' : 'fa fa-minus-circle'"
            :style="scope.row.state ? green : red"
          ></i>
        </template>
      </el-table-column>
      <el-table-column prop="user" :label="$t('helpCenter.user')">
        <template slot-scope="scope">{{scope.row.user?scope.row.user.userName:''}}</template>
      </el-table-column>
      <el-table-column prop="time" :label="$t('helpCenter.time')"></el-table-column>
      <el-table-column prop="updateTime" :label="$t('helpCenter.updateTime')"></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editHelpCenter(scope.$index, dataList)"
          >
            <i class="fa fa-edit"></i>
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            icon="el-icon-delete"
            @click="deleteHelpCenter(scope.$index, dataList)"
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
      loading: false,
      multipleSelection: []
    };
  },

  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editHelpCenter(index, rows) {
      let rowData = rows[index];
      services
        .getOneHelpCenter({ id: rowData._id })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("showHelpCenterForm", {
              edit: true,
              formData: result.data.data
            });
            this.$emit("changeEditorContents", result.data.data.comments);
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
    deleteHelpCenter(index, rows) {
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
          return services.deleteHelpCenter({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getHelpCenterList", this.pageInfo);
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