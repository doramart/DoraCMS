<template>
  <div>
    <el-table
      align="center"
      v-loading="loading"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleMsgSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="contentId.stitle" :label="$t('contentMessage.stitle')" width="200">
        <template slot-scope="scope">
          <a
            :href="'/details/'+scope.row.contentId._id+'.html'"
            target="_blank"
          >{{scope.row.contentId.stitle}}</a>
        </template>
      </el-table-column>
      <el-table-column
        prop="content"
        :label="$t('contentMessage.content')"
        width="280"
        show-overflow-tooltip
      >
        <template slot-scope="scope">{{scope.row.content | cutWords(20)}}</template>
      </el-table-column>
      <el-table-column prop="author" :label="$t('contentMessage.author')">
        <template
          slot-scope="scope"
        >{{scope.row.utype ==='0'?(scope.row.author?scope.row.author.userName:$t('contentMessage.nimin')):(scope.row.adminAuthor?scope.row.adminAuthor.userName:'')}}</template>
      </el-table-column>
      <el-table-column prop="replyAuthor" :label="$t('contentMessage.replyAuthor')">
        <template
          slot-scope="scope"
        >{{scope.row.replyAuthor ? scope.row.replyAuthor.userName :(scope.row.adminReplyAuthor ? scope.row.adminReplyAuthor.userName : '')}}</template>
      </el-table-column>
      <el-table-column prop="date" :label="$t('contentMessage.date')">
        <template slot-scope="scope">{{scope.row.date}}</template>
      </el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="replyContentMessage(scope.$index, dataList)"
          >
            <svg-icon icon-class="details" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteContentMessage(scope.$index, dataList)"
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
  deleteContentMessage,
  getOneContentMessage
} from "@/api/contentMessage";

export default {
  props: {
    dataList: Array,
    pageInfo: Object
  },
  data() {
    return {
      loading: false,
      multipleSelection: []
    };
  },

  methods: {
    handleMsgSelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeMsgSelectList", ids);
      } else {
        this.multipleSelection = "";
        this.$emit("changeMsgSelectList", "");
      }
    },
    replyContentMessage(index, rows) {
      let rowData = rows[index];
      getOneContentMessage({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("contentMessage/showContentMessageForm", {
              edit: true,
              parentformData: result.data
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
    deleteContentMessage(index, rows) {
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
          let targetId = [];
          return deleteContentMessage({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch(
              "contentMessage/getContentMessageList",
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
        .catch(err => {
          this.$message({
            type: "info",
            message: this.$t("main.scr_modal_del_error_info") + err
          });
        });
    }
  }
};
</script>