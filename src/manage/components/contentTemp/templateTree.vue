<template>
<el-tree :data="treeData" :highlight-current="true" :props="defaultProps" node-key="id" accordion @node-click="handleNodeClick" :render-content="renderContent">
  </el-tree>
</template>

<script>
import services from "../../store/services.js";
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
    handleNodeClick(data) {
      services
        .getTemplateFileInfo({
          filePath: data.path
        })
        .then(result => {
          if (result.data.status === 200) {
            this.$emit("changeTreeFile", result.data.data);
          } else {
            this.$message.error(result.data.message);
          }
        });
    },
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

    renderContent(h, { node, data, store }) {
      let nodeIcon =
        node.data.parentId == "0" && node.data.name.indexOf(".html") < 0 ? (
          <i class="fa fa-folder" aria-hidden="true" />
        ) : node.data.name.indexOf(".html") > 0 ? (
          <i class="fa fa-file-code-o" aria-hidden="true" />
        ) : (
          ""
        );
      return (
        <span style="display: block; align-items: center; font-size: 14px; padding-right: 8px;">
          {nodeIcon}
          <span>
            <span>{node.label}</span>
          </span>
        </span>
      );
    }
  },

  mounted() {
    setTimeout(() => {
      console.log("----", this.treeData);
      // this.defaultFile && this.handleNodeClick(this.defaultFile);
      let templist = this.treeData;
      let newdocs = _.filter(templist, doc => {
        return doc.name.indexOf("index.html") >= 0;
      });
      console.log("---newdocs---", newdocs);
      if (newdocs && newdocs.length > 0) {
        this.handleNodeClick(newdocs[0]);
      }
    }, 1000);
  }
};
</script>

<style lang="scss">
.el-tree-node.is-expanded .fa-folder:before {
  content: "\f07c";
}
.fa-folder {
  color: #f5da9a;
  margin-right: 10px;
}
.fa-file-code-o {
  margin-right: 10px;
}
</style>
