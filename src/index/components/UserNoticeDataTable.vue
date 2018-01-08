<template>
    <div class="userNoticeList">
        <el-table :data="dataList" style="width: 100%" row-class-name="notice-list-row" @expand-change="setHasRead">
            <el-table-column type="expand">
                <template slot-scope="props">
                    <el-form label-position="left" inline class="demo-table-expand">
                        <span v-html="props.row.notify.content"></span>
                    </el-form>
                </template>
            </el-table-column>
            <el-table-column label="概要" prop="notify.title" width="300">
                <template slot-scope="scope">
                    <span :style="{fontWeight:scope.row.isRead?'':'bold'}">{{scope.row.notify.title}}</span>
                </template>
            </el-table-column>
            <el-table-column label="发布时间" prop="date">
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button size="mini" type="danger"  icon="el-icon-delete" @click="deleteMessage(scope.$index, dataList)"></el-button>
                </template>
            </el-table-column>
        </el-table>

    </div>
</template>

<script>
import api from "~api";
export default {
  props: {
    dataList: Array
  },
  data() {
    return {
      loading: false,
      multipleSelection: []
    };
  },

  methods: {
    setHasRead(row, expandedRows) {
      if (!row.isRead) {
        api.get("users/setNoticeRead", { ids: row._id }).then(result => {
          if (result.data.state === "success") {
            console.info("设置消息已读成功");
          } else {
            this.$message.error(result.data.message);
          }
        });
      }
    },
    handleUserSelect(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("changeUserSelectList", ids);
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    deleteMessage(index, rows) {
      this.$confirm("确认要删除该消息吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          return api.get("users/delUserNotify", { ids: rows[index]._id });
        })
        .then(result => {
          if (result.data.state === "success") {
            this.$store.dispatch("frontend/user/userNotices");
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
            message: "删除失败" + err
          });
        });
    }
  }
};
</script>

<style lang="scss">
.userNoticeList {
  padding: 15px;
}
.notice-list-row {
  height: 20px;
  font-size: 13px;

  .el-table__expand-icon {
    height: 32px;
  }
}

.el-table__expanded-cell {
  font-size: 13px;
  padding: 10px 20px;
}
</style>
