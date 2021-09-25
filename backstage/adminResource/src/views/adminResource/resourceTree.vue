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
import { getOneAdminResource, deleteAdminResource } from "@/api/adminResource";

export default {
  props: {
    treeData: Array
  },
  data() {
    return {
      defaultProps: {
        children: "children",
        label: "label"
      }
    };
  },

  methods: {
    append(store, data) {
      let formData = {};
      formData.parentId = data._id;
      formData.parent = {
        label: data.label
      };
      this.$store.dispatch("adminResource/showAdminResourceForm", {
        edit: false,
        type: "children",
        formData: formData
      });
    },

    edit(store, data) {
      let rowData = data;
      getOneAdminResource({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminResource/showAdminResourceForm", {
              edit: true,
              type: "children",
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
          return deleteAdminResource({
            ids: data._id
          });
        })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminResource/getAdminResourceList");
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

    moveResource(store, data) {
      let rowData = data;
      getOneAdminResource({ id: rowData._id })
        .then(result => {
          if (result.status === 200) {
            this.$store.dispatch("adminResource/showAdminSelectResourceForm", {
              edit: true,
              type: "children",
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

    renderContent(h, { node, data, store }) {
      let moveBtn =
        node.data.type == "0" && node.data.parentId != "0" ? (
          <el-tooltip
            class="item"
            effect="dark"
            content="移动"
            placement="top-start"
          >
            <el-button
              type="text"
              on-click={() => this.moveResource(store, data)}
            >
              <span style="color:#ff0">
                <svg-icon icon-class="icon_move" />
              </span>
            </el-button>
          </el-tooltip>
        ) : (
          ""
        );
      return (
        <span style="flex: 1; display: flex; align-items: center; justify-content: left; font-size: 14px;">
          <span>
            <span>{node.data.comments}</span>
          </span>
          <span style="float: left; margin-left: 20px">
            <el-button type="text" on-click={() => this.append(store, data)}>
              <svg-icon icon-class="icon_im_more" />
            </el-button>
            <el-button type="text" on-click={() => this.edit(store, data)}>
              <svg-icon icon-class="edit" />
            </el-button>
            <el-button type="text" on-click={() => this.remove(store, data)}>
              <svg-icon icon-class="icon_delete" />
            </el-button>
            {moveBtn}
          </span>
        </span>
      );
    }
  }
};
</script>

<style lang="scss">
.icon_move {
  color: #ccc;
}
</style>