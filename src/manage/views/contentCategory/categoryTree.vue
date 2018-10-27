<template>
  <el-tree :data="treeData" :props="defaultProps" node-key="id" default-expand-all :expand-on-click-node="false" :render-content="renderContent">
  </el-tree>
</template>

<script>
import services from "../../store/services.js";

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
      this.$store.dispatch("showContentCategoryForm", {
        edit: false,
        type: "children",
        formData: formData
      });
    },

    edit(store, data) {
      this.$store.dispatch("showContentCategoryForm", {
        edit: true,
        type: "children",
        formData: data
      });
    },

    remove(store, data) {
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
          return services.deleteContentCategory({
            ids: data._id
          });
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$store.dispatch("getContentCategoryList");
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
    },

    renderContent(h, { node, data, store }) {
      return (
        <span style="flex: 1; display: flex; align-items: center; justify-content: space-between; font-size: 14px; padding-right: 8px;">
          <span>
            <span>{node.label}</span>
          </span>
          <span style="float: right; margin-right: 20px">
            <el-button type="text" on-click={() => this.append(store, data)}>
              <i class="fa fa-plus-circle" aria-hidden="true" />
            </el-button>
            <el-button type="text" on-click={() => this.edit(store, data)}>
              <i class="fa fa-edit" />
            </el-button>
            <el-button type="text" on-click={() => this.remove(store, data)}>
              <i class="fa fa-trash-o" />
            </el-button>
          </span>
        </span>
      );
    }
  }
};
</script>