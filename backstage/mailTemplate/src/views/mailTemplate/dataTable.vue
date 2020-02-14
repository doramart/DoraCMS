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

      <el-table-column prop="type" :label="$t('mailTemplate.type')">
        <template slot-scope="scope">
          <span>{{mailTemplateTypeList[scope.row.type]}}</span>
        </template>
      </el-table-column>

      <el-table-column prop="comment" :label="$t('mailTemplate.comment')"></el-table-column>

      <el-table-column prop="title" :label="$t('mailTemplate.title')"></el-table-column>

      <el-table-column prop="createTime" :label="$t('mailTemplate.createTime')"></el-table-column>
      <el-table-column :label="$t('main.dataTableOptions')" width="150">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            round
            @click="editMailTemplate(scope.$index, dataList)"
          >
            <svg-icon icon-class="edit" />
          </el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            round
            @click="deleteMailTemplate(scope.$index, dataList)"
          >
            <svg-icon icon-class="icon_delete" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { deleteMailTemplate, getOneMailTemplate } from "@/api/mailTemplate";

export default {
  props: {
    dataList: Array,
    pageInfo: Object,
    mailTemplateTypeList: Object
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
    editMailTemplate(index, rows) {
      let rowData = rows[index];
      getOneMailTemplate({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("mailTemplate/showMailTemplateForm", {
              edit: true,
              formData: result.data
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
    deleteMailTemplate(index, rows) {
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
          return deleteMailTemplate({
            ids: rows[index]._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch(
              "mailTemplate/getMailTemplateList",
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