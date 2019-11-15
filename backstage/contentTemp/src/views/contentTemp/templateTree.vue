<template>
  <el-tree
    :data="treeData"
    :highlight-current="true"
    :props="defaultProps"
    node-key="id"
    accordion
    @node-click="handleNodeClick"
    :render-content="renderContent"
  ></el-tree>
</template>

<script>
import { getTemplateFileInfo } from "@/api/contentTemp";

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
      if (data && data.path) {
        getTemplateFileInfo({
          filePath: data.path
        }).then(result => {
          if (result.status === 200) {
            this.$emit("changeTreeFile", result.data);
          } else {
            this.$message.error(result.message);
          }
        });
      }
    },
    append(store, data) {
      let formData = {};
      formData.parentId = data._id;
      formData.parent = {
        label: data.label
      };
      this.$store.dispatch("contentTemp/showAdminResourceForm", {
        edit: false,
        type: "children",
        formData: formData
      });
    },

    renderContent(h, { node, data, store }) {
      let nodeIcon =
        node.data.parentId == "0" && node.data.name.indexOf(".html") < 0 ? (
          <svg-icon icon-class="icon_file_fill" />
        ) : node.data.name.indexOf(".html") > 0 ? (
          <svg-icon icon-class="icon_doc" />
        ) : (
          ""
        );
      return (
        <span
          class="tempTreeMenu"
          style="display: block; align-items: center; font-size: 14px; padding-right: 8px;"
        >
          {nodeIcon}
          <span style="marginLeft:5px;">
            <span>{node.label}</span>
          </span>
        </span>
      );
    }
  },

  mounted() {
    setTimeout(() => {
      let templist = this.treeData;
      let newdocs = _.filter(templist, doc => {
        return doc.name.indexOf("index.html") >= 0;
      });
      if (newdocs && newdocs.length > 0) {
        this.handleNodeClick(newdocs[0]);
      }
    }, 1000);
  }
};
</script>

<style lang="scss">
.tempTreeMenu {
  svg {
    color: #f5da9a;
  }
}
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
