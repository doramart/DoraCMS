<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleMsgSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="contentId.stitle" :label="$t('contentMessage.stitle')" width="200">
            </el-table-column>
            <el-table-column prop="content" :label="$t('contentMessage.content')" width="280" show-overflow-tooltip>
                <template slot-scope="scope">{{scope.row.content | cutWords(20)}}</template>
            </el-table-column>
            <el-table-column prop="author" :label="$t('contentMessage.author')">
                <template slot-scope="scope">{{scope.row.utype ==='0'?(scope.row.author?scope.row.author.userName:$t('contentMessage.nimin')):(scope.row.adminAuthor?scope.row.adminAuthor.userName:'')}}</template>
            </el-table-column>
            <el-table-column prop="replyAuthor" :label="$t('contentMessage.replyAuthor')">
                <template slot-scope="scope">{{scope.row.replyAuthor ? scope.row.replyAuthor.userName :(scope.row.adminReplyAuthor ? scope.row.adminReplyAuthor.userName : '')}}</template>
            </el-table-column>
            <el-table-column prop="date" :label="$t('contentMessage.date')">
                <template slot-scope="scope">{{scope.row.date}}</template>
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="150" fixed="right">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="replyContentMessage(scope.$index, dataList)"><i class="fa fa-mail-reply" aria-hidden="true"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteContentMessage(scope.$index, dataList)"></el-button>
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
      }
    },
    replyContentMessage(index, rows) {
      let rowData = rows[index];
      this.$store.dispatch("showContentMessageForm", {
        edit: true,
        parentformData: rowData
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
          return services.deleteContentMessage({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getContentMessageList", this.pageInfo);
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
            message: this.$t("main.scr_modal_del_error_info") + err
          });
        });
    }
  }
};
</script>