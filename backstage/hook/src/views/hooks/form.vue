<template>
  <div class="dr-HookForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="50%"
      title="编辑"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
        :label-position="device == 'mobile' ? 'top' : 'right'"
      >
        <el-form-item :label="$t('hooks.name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>

        <el-form-item :label="$t('hooks.description')" prop="description">
          <el-input size="small" v-model="dialogState.formData.description"></el-input>
        </el-form-item>

        <el-form-item :label="$t('hooks.type')" prop="type">
          <el-input size="small" v-model="dialogState.formData.type"></el-input>
        </el-form-item>

        <el-form-item :label="$t('hooks.ext')" prop="ext">
          <el-input size="small" v-model="dialogState.formData.ext"></el-input>
        </el-form-item>

        <el-form-item :label="$t('hooks.status')" prop="status">
          <el-radio v-model="dialogState.formData.status" label="1">正常</el-radio>
          <el-radio v-model="dialogState.formData.status" label="0">锁定</el-radio>
        </el-form-item>

        <el-form-item>
          <el-button
            size="medium"
            type="primary"
            @click="submitForm('ruleForm')"
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import { addHook, updateHook } from "@/api/hooks";

import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array,
    device: String
  },
  data() {
    return {
      rules: {
        name: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        description: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        type: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        status: [
          {
            required: true,

            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  methods: {
    confirm() {
      this.$store.dispatch("hooks/hideHookForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateHook(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("hooks/hideHookForm");
                this.$store.dispatch("hooks/getHookList");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.message);
              }
            });
          } else {
            // 新增
            addHook(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("hooks/hideHookForm");
                this.$store.dispatch("hooks/getHookList");
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.message);
              }
            });
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    }
  }
};
</script>
<style lang="scss">
.edui-default .edui-toolbar {
  line-height: 20px !important;
}
</style>