<template>
<el-tree :data="treeData" :props="defaultProps" node-key="id" default-expand-all :expand-on-click-node="false" :render-content="renderContent">
  </el-tree>
</template>

<script>
let id = 1000;
import services from "../../store/services.js";

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
      this.$store.dispatch("showAdminResourceForm", {
        edit: false,
        type: "children",
        formData: formData
      });
    },

    edit(store, data) {
      this.$store.dispatch("showAdminResourceForm", {
        edit: true,
        type: "children",
        formData: data
      });
    },

    remove(store, data) {
      this.$confirm("此操作将永久删除该记录, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          return services.deleteAdminResource({
            ids: data._id
          });
        })
        .then(result => {
          if (result.data.state === "success") {
            this.$store.dispatch("getAdminResourceList");
            this.$message({
              message: "删除成功",
              type: "success"
            });
          } else {
            this.$message.error(result.data.message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
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