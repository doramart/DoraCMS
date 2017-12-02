<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleMsgSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="contentId.stitle" label="文章标题" width="200">
            </el-table-column>
            <el-table-column prop="content" label="留言内容" width="280" show-overflow-tooltip>
                <template slot-scope="scope">{{scope.row.content | cutWords(20)}}</template>
            </el-table-column>
            <el-table-column prop="author" label="留言者">
                <template slot-scope="scope">{{scope.row.utype ==='0'?(scope.row.author?scope.row.author.userName:'匿名'):(scope.row.adminAuthor?scope.row.adminAuthor.userName:'')}}</template>
            </el-table-column>
            <el-table-column prop="replyAuthor" label="关联用户(被回复)">
                <template slot-scope="scope">{{scope.row.replyAuthor ? scope.row.replyAuthor.userName :(scope.row.adminReplyAuthor ? scope.row.adminReplyAuthor.userName : '')}}</template>
            </el-table-column>
            <el-table-column prop="date" label="时间">
                <template slot-scope="scope">{{scope.row.date}}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
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
      this.$confirm("此操作将永久删除该留言, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          let targetId = [];
          return services.deleteContentMessage({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.state === "success") {
            this.$store.dispatch("getContentMessageList", this.pageInfo);
            this.$message({
              message: "删除成功",
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(err => {
          this.$message({
            type: "info",
            message: "已取消删除" + err
          });
        });
    }
  }
};
</script>