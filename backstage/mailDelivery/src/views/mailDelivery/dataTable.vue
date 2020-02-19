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

      <el-table-column prop="sender" :label="$t('mailDelivery.sender')">
        <template slot-scope="scope">{{scope.row.sender.userName}}</template>
      </el-table-column>

      <el-table-column prop="emailType" :label="$t('mailDelivery.emailType')">
        <template slot-scope="scope">{{scope.row.emailType.title}}</template>
      </el-table-column>

      <el-table-column prop="type" :label="$t('mailDelivery.type')">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.type == '0'" type="info">
            <svg-icon icon-class="icon_send" />&nbsp;立即
          </el-tag>
          <el-tag v-if="scope.row.type == '1'" type="info">
            <svg-icon icon-class="icon_dingshi" />&nbsp;定时
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="state" :label="$t('mailDelivery.state')">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.state == '0'" type="danger">
            <svg-icon icon-class="icon_wait" />&nbsp;待发送
          </el-tag>
          <el-tag v-if="scope.row.state == '1'" type="warning">
            <svg-icon icon-class="icon_copyto" />&nbsp;未完成
          </el-tag>
          <el-tag v-if="scope.row.state == '2'" type="success">
            <svg-icon icon-class="icon_wait" />&nbsp;已发送
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="timing" :label="$t('mailDelivery.timing')" width="180"></el-table-column>

      <el-table-column prop="comments" :label="$t('mailDelivery.comments')"></el-table-column>

      <el-table-column prop="createTime" :label="$t('mailDelivery.createTime')" width="180"></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" min-width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editMailDelivery(scope.$index, dataList)"
          >
            <svg-icon icon-class="edit" />
          </el-button>
          <el-button
            size="mini"
            type="warning"
            plain
            round
            @click="showTasklogs(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_calendar" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteMailDelivery(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import {
  deleteMailDelivery,
  getOneMailDelivery,
  sendLogList
} from "@/api/mailDelivery";

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
    showTasklogs(index, rows) {
      let rowData = rows[index];
      let _this = this;
      this.$store.dispatch("mailDelivery/sendLogList", {
        taskId: rowData._id
      });
      this.$store.dispatch("mailDelivery/showSendLogForm", {
        edit: true
      });
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editMailDelivery(index, rows) {
      let rowData = rows[index];
      let _this = this;
      getOneMailDelivery({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            let taskObj = result.data;
            let targetsArr = [];
            if (taskObj.targets) {
              this.$emit("renderUsers", taskObj.targets);
              taskObj.targets.map((item, index) => {
                if (item) {
                  targetsArr.push(item._id);
                }
              });
              taskObj.targets = targetsArr;
            }

            this.$store.dispatch("mailDelivery/showMailDeliveryForm", {
              edit: true,
              formData: taskObj
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
    deleteMailDelivery(index, rows) {
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
          return deleteMailDelivery({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch(
              "mailDelivery/getMailDeliveryList",
              this.pageInfo
            );
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