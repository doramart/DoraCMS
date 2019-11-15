<template>
  <div class="dr-adminResourceForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="$t('adminResource.lb_parentType')"
      :visible.sync="selectDialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="selectDialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('adminResource.lb_parentType')" prop="parentId">
          <el-select
            size="small"
            v-model="selectDialogState.formData.parentId"
            :placeholder="$t('main.ask_select_label')"
          >
            <el-option
              v-for="item in parentResource"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{$t('main.form_btnText_update')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { updateResourceParentId } from "@/api/adminResource";

import _ from "lodash";
export default {
  props: {
    parentResource: Array,
    selectDialogState: Object,
    groups: Array,
    device: String
  },
  data() {
    return {
      rules: {}
    };
  },
  methods: {
    confirm() {
      this.$store.dispatch("adminResource/hideAdminSelectResourceForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.selectDialogState.formData;
          updateResourceParentId(params).then(result => {
            if (result.status === 200) {
              this.$store.dispatch("adminResource/hideAdminSelectResourceForm");
              this.$store.dispatch("adminResource/getAdminResourceList");
              this.$message({
                message: this.$t("main.updateSuccess"),
                type: "success"
              });
            } else {
              this.$message.error(result.message);
            }
          });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
  }
};
</script>