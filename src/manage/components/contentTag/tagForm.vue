<template>
    <div class="dr-contentTagForm">
        <el-dialog width="35%" size="small" :title="$t('contentTag.form_title')" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item :label="$t('contentTag.name')" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item :label="$t('contentTag.comments')" prop="comments">
                    <el-input size="small" type="textarea" v-model="dialogState.formData.comments"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button size="medium" type="primary" @click="submitForm('ruleForm')">{{dialogState.edit ? $t('main.form_btnText_update') : $t('main.form_btnText_save')}}</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>
<script>
import services from "../../store/services.js";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array
  },
  data() {
    return {
      rules: {
        name: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("contentTag.name")
            }),
            trigger: "blur"
          },
          {
            min: 1,
            max: 12,
            message: this.$t("validate.rangelength", { min: 1, max: 12 }),
            trigger: "blur"
          }
        ],
        comments: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 30,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 30
            }),
            trigger: "blur"
          }
        ]
      }
    };
  },
  methods: {
    confirm() {
      this.$store.dispatch("hideContentTagForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            services.updateContentTag(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideContentTagForm");
                this.$store.dispatch("getContentTagList");
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
            services.addContentTag(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideContentTagForm");
                this.$store.dispatch("getContentTagList");
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