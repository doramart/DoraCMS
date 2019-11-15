<template>
  <div class="dr-ProjectConfigurationForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      size="small"
      title="填写信息"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      {{dialogState}}
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-form-item :label="$t('projectConfiguration.tableName')" prop="tableName">
          <el-input size="small" v-model="dialogState.formData.tableName"></el-input>
        </el-form-item>

        <el-form-item :label="$t('projectConfiguration.localPath')" prop="localPath">
          <el-input size="small" v-model="dialogState.formData.localPath"></el-input>
        </el-form-item>

        <el-form-item :label="$t('projectConfiguration.type')" prop="type">
          <!-- <el-input size="small" v-model="dialogState.formData.type"></el-input> -->
          <el-select size="small" v-model="dialogState.formData.type" placeholder="请选择项目类型">
            <el-option
              v-for="item in projectTypes"
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
          >{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import {
  addProjectConfigration,
  updateProjectConfigration
} from "@/api/renderCms";

import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array
  },
  data() {
    return {
      projectTypes: [
        {
          lable: "DoraCMS2",
          value: "doracms2"
        }
      ],
      rules: {
        tableName: [
          {
            required: true,

            trigger: "blur"
          }
        ],

        localPath: [
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
        ]
      }
    };
  },
  methods: {
    confirm() {
      this.$store.dispatch("renderCms/hideProjectConfigurationForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateProjectConfigration(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("renderCms/hideProjectConfigurationForm");
                this.$store.dispatch("renderCms/getProjectConfigurationList");
                this.$message({
                  message: this.$t("main.updateSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
              }
            });
          } else {
            // 新增
            addProjectConfigration(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("renderCms/hideProjectConfigurationForm");
                this.$store.dispatch("renderCms/getProjectConfigurationList");
                this.$message({
                  message: this.$t("main.addSuccess"),
                  type: "success"
                });
              } else {
                this.$message.error(result.data.message);
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