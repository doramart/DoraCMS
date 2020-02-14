<template>
  <el-tree
    :data="treeData"
    :props="defaultProps"
    node-key="id"
    default-expand-all
    :expand-on-click-node="false"
    :render-content="renderContent"
  ></el-tree>
</template>

<script>
import {
  deleteContentCategory,
  getOneContentCategory
} from "@/api/contentCategory";

import _ from "lodash";
export default {
  props: {
    treeData: Array
  },
  data() {
    return {
      defaultProps: {
        children: "children",
        label: "name"
      }
    };
  },

  methods: {
    append(store, data) {
      let formData = {};
      formData.parentId = data._id;
      formData.parentObj = data;
      this.$store.dispatch("contentCategory/showContentCategoryForm", {
        edit: false,
        type: "children",
        formData: formData
      });
    },

    edit(store, data) {
      let rowData = data;
      getOneContentCategory({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            let categoryInfo = result.data;
            if (!_.isEmpty(categoryInfo)) {
              this.$store.dispatch("contentCategory/showContentCategoryForm", {
                edit: true,
                type: "children",
                formData: _.assign({}, categoryInfo, {
                  contentTemp: !_.isEmpty(categoryInfo.contentTemp)
                    ? categoryInfo.contentTemp._id
                    : ""
                })
              });
            }
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

    remove(store, data) {
      this.$confirm("您确认要删除该类别吗？", this.$t("main.scr_modal_title"), {
        confirmButtonText: this.$t("main.confirmBtnText"),
        cancelButtonText: this.$t("main.cancelBtnText"),
        type: "warning"
      })
        .then(() => {
          return deleteContentCategory({
            ids: data._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("contentCategory/getContentCategoryList");
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
    },

    renderContent(h, { node, data, store }) {
      return (
        <span style="flex: 1; display: flex; align-items: center; justify-content: right; font-size: 14px; padding-right: 8px;">
          <span>
            <span>{node.label}</span>
          </span>
          <span style="float: left; margin-left: 20px">
            <el-button type="text" on-click={() => this.append(store, data)}>
              <svg-icon icon-class="icon_add" />
            </el-button>
            <el-button type="text" on-click={() => this.edit(store, data)}>
              <svg-icon icon-class="edit" />
            </el-button>
            <el-button type="text" on-click={() => this.remove(store, data)}>
              <svg-icon icon-class="icon_delete" />
            </el-button>
          </span>
        </span>
      );
    }
  }
};
</script>