<template>
  <div class="dr-adminGroupForm">
    <el-dialog
      width="40%"
      :title="$t('adminGroup.lb_give_power')"
      :visible.sync="roleState.show"
      :close-on-click-modal="false"
    >
      <el-tree
        :data="treeData"
        show-checkbox
        node-key="_id"
        ref="tree"
        highlight-current
        :props="defaultProps"
        :render-content="renderContent"
      ></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button size="medium" @click="closeTree">{{$t("main.cancelBtnText")}}</el-button>
        <el-button size="medium" type="primary" @click="savePower">{{$t("main.confirmBtnText")}}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { updateAdminGroup } from "@/api/adminGroup";
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
      updateAdminGroup(params).then(result => {
        if (result.status === 200) {
          this.$store.dispatch("adminGroup/hideAdminGroupRoleForm");
          this.$store.dispatch("adminGroup/getAdminGroupList");
          this.$message({
            message: this.$t("adminGroup.lb_updatePower_success"),
            type: "success"
          });
        } else {
          this.$message.error(result.message);
        }
      });
    },
    closeTree() {
      this.$store.dispatch("adminGroup/hideAdminGroupRoleForm");
    },
    renderContent(h, { node, data, store }) {
      return (
        <span style="flex: 1; display: flex; align-items: center; justify-content: space-between; font-size: 14px; padding-right: 8px;">
          <span>
            <span>{node.data.comments}</span>
          </span>
        </span>
      );
    }
  },
  updated() {
    this.$refs.tree &&
      this.$refs.tree.setCheckedKeys(this.roleState.formData.power);
  }
};
</script>
