<template>
    <div>
        <el-table align="center" v-loading="loading" ref="multipleTable" :data="dataList" tooltip-effect="dark" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column prop="name" :label="$t('contentTag.name')" width="120">
            </el-table-column>
            <el-table-column prop="comments" :label="$t('contentTag.comments')">
            </el-table-column>
            <el-table-column :label="$t('main.dataTableOptions')" width="150">
                <template slot-scope="scope">
                    <el-button size="mini" type="primary" plain round @click="editContentTag(scope.$index, dataList)"><i class="fa fa-edit"></i></el-button>
                    <el-button size="mini" type="danger" plain round icon="el-icon-delete" @click="deleteContentTag(scope.$index, dataList)"></el-button>
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
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    editContentTag(index, rows) {
      let rowData = rows[index];
      this.$store.dispatch("showContentTagForm", {
        edit: true,
        formData: rowData
      });
    },
    deleteContentTag(index, rows) {
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
          return services.deleteContentTag({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getContentTagList", this.pageInfo);
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