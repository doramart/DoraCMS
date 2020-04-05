<template>
  <div>
    <el-table
      align="center"
      v-loading="loading"
      ref="multipleTable"
      :data="dataList"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSystemAnnounceSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="title" :label="$t('announce.title')"></el-table-column>
      <el-table-column prop="content" :label="$t('announce.content')">
        <template slot-scope="scope">
          <span v-html="scope.row.content"></span>
        </template>
      </el-table-column>
      <el-table-column prop="adminSender" :label="$t('announce.author')">
        <template slot-scope="scope">
          <span>{{scope.row.adminSender.userName}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="date" :label="$t('announce.happenTime')"></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="danger"
            plain
            size="mini"
            round
            @click="deleteAnnounce(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<style lang="scss">
.fa-star {
  cursor: pointer;
}

.fa-star-o {
  cursor: pointer;
}
</style>
<script>
import { deleteSystemAnnounce } from "@/api/announce";
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
    toggleSelection(rows) {
      if (rows) {
        rows.forEach(row => {
          this.$refs.multipleTable.toggleRowSelection(row);
        });
      } else {
        this.$refs.multipleTable.clearSelection();
      }
    },
    handleSystemAnnounceSelectionChange(val) {
      if (val && val.length > 0) {
        let ids = val.map((item, index) => {
          return item._id;
        });
        this.multipleSelection = ids;
        this.$emit("handleSystemAnnounceChange", ids);
      } else {
        this.multipleSelection = "";
        this.$emit("handleSystemAnnounceChange", "");
      }
    },
    deleteAnnounce(index, rows) {
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
          return deleteSystemAnnounce({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("announce/getSystemAnnounceList");
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
            message: this.$t("main.scr_modal_del_error_info")
          });
        });
    }
  },
  computed: {}
};
</script>
