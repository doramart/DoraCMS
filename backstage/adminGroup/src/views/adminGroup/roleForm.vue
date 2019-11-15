<template>
  <div class="dr-adminGroupForm">
    <el-dialog
      width="30%"
      :title="$t('adminGroup.lb_roleForm_title')"
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
        <el-form-item :label="$t('adminGroup.lb_group_name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminGroup.lb_group_dis')" prop="comments">
          <el-input size="small" v-model="dialogState.formData.comments"></el-input>
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
import { checkName } from "@/utils/validate";
import { updateAdminGroup, addAdminGroup } from "@/api/adminGroup";

export default {
  props: {
    dialogState: Object,
    device: String
  },
  data() {
    return {
      rules: {
        name: [
          {
            message: this.$t("validate.inputNull", {
              label: this.$t("adminGroup.lb_group_name")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkName(value, 2, 10)) {
                callback(
                  new Error(
                    this.$t("validate.rangelength", { min: 2, max: 10 })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        comments: [
          {
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          },
          {
            min: 5,
            max: 30,
            message: this.$t("validate.ranglengthandnormal", {
              min: 5,
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
      this.$store.dispatch("adminGroup/hideAdminGroupForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            updateAdminGroup(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("adminGroup/hideAdminGroupForm");
                this.$store.dispatch("adminGroup/getAdminGroupList");
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
            addAdminGroup(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("adminGroup/hideAdminGroupForm");
                this.$store.dispatch("adminGroup/getAdminGroupList");
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