<template>
  <el-dialog
    :xs="20"
    :sm="20"
    :md="6"
    :lg="6"
    :xl="6"
    width="70%"
    title="发送详情"
    :visible.sync="sendLogFormState.show"
    :before-close="handleClose"
  >
    <el-table :data="sendLogList.docs" style="width: 100%">
      <el-table-column prop="taskId" label="任务ID"></el-table-column>
      <el-table-column prop="state" label="状态" width="100">
        <template slot-scope="scope">
          <svg-icon v-show="scope.row.state=='1'" :style="green" icon-class="check-circle-fill" />
          <svg-icon v-show="scope.row.state=='0'" :style="red" icon-class="minus-circle-fill" />
        </template>
      </el-table-column>
      <el-table-column prop="recipient" label="目标" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span
            v-for="userItem in scope.row.recipient"
            :key="userItem._id"
          >{{userItem.userName+','}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="recipientEmail" label="目标邮箱" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span
            v-for="(emailItem,index) in scope.row.recipientEmail"
            :key="'email_'+index"
          >{{emailItem+','}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="日期" width="180"></el-table-column>
    </el-table>

    <SendLogPagination :device="device" :pageInfo="sendLogList.pageInfo"></SendLogPagination>
  </el-dialog>
</template>
<script>
import {
  addMailDelivery,
  updateMailDelivery,
  regUserList
} from "@/api/mailDelivery";
import {
  showFullScreenLoading,
  tryHideFullScreenLoading
} from "@root/publicMethods/axiosLoading";
import _ from "lodash";
import { mapGetters, mapActions } from "vuex";
import SendLogPagination from "../common/SendLogPagination.vue";
export default {
  props: {
    device: String,
    sendlogs: Object
  },
  data() {
    return {
      dialogVisible: false,
      green: { color: "#13CE66" },
      red: { color: "#FF4949" }
    };
  },
  components: {
    SendLogPagination
  },
  computed: {
    ...mapGetters(["sendLogFormState", "sendLogList"])
  },
  methods: {
    handleClose() {
      this.$store.dispatch("mailDelivery/hideSendLogForm");
    }
  }
};
</script>
<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
.targetsSelect {
  width: 90%;
}
</style>