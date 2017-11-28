<template>
    <div class="dr-adminGroupForm">
        <el-dialog width="35%" size="small" title="分配资源" :visible.sync="roleState.show" :close-on-click-modal="false">
            <el-tree :data="treeData" show-checkbox node-key="_id" ref="tree" highlight-current :props="defaultProps">
            </el-tree>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="closeTree">取 消</el-button>
                <el-button size="medium" type="primary" @click="savePower">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
import services from "../../store/services.js";
import _ from "lodash";

export default {
  props: {
    roleState: Object,
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
    savePower() {
      let currentNodes = this.$refs.tree.getCheckedNodes();
      let currentArr = [];
      currentNodes.length > 0 &&
        currentNodes.map((item, index) => {
          if (item.type == "1") {
            currentArr.push(item._id);
          }
        });
      let params = this.roleState.formData;
      params.power = currentArr;
      services.updateAdminGroup(params).then(result => {
        if (result.data.state === "success") {
          this.$store.dispatch("hideAdminGroupRoleForm");
          this.$store.dispatch("getAdminGroupList");
          this.$message({
            message: "更新成功,重新登录后权限生效",
            type: "success"
          });
        } else {
          this.$message.error(result.data.message);
        }
      });
    },
    closeTree() {
      this.$store.dispatch("hideAdminGroupRoleForm");
    }
  },
  updated() {
    this.$refs.tree &&
      this.$refs.tree.setCheckedKeys(this.roleState.formData.power);
  }
};
</script>
