<template>
    <div class="dr-regUserForm">
        <el-dialog :xs="20" :sm="20" :md="6" :lg="6" :xl="6" size="small" :title="$t('regUser.form_title')" :visible.sync="dialogState.show" :close-on-click-modal="false">
            <el-form :model="dialogState.formData" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
                <el-form-item :label="$t('regUser.userName')" prop="userName">
                    <el-input size="small" v-model="dialogState.formData.userName"></el-input>
                </el-form-item>
                <el-form-item :label="$t('regUser.name')" prop="name">
                    <el-input size="small" v-model="dialogState.formData.name"></el-input>
                </el-form-item>
                <el-form-item :label="$t('regUser.enable')" prop="enable">
                    <el-switch :on-text="$t('main.radioOn')" :off-text="$t('main.radioOff')" v-model="dialogState.formData.enable"></el-switch>
                </el-form-item>
                <el-form-item :label="$t('regUser.phoneNum')" prop="phoneNum">
                    <el-input size="small" v-model.number="dialogState.formData.phoneNum"></el-input>
                </el-form-item>
                <el-form-item :label="$t('regUser.email')" prop="email">
                    <el-input size="small" v-model="dialogState.formData.email"></el-input>
                </el-form-item>
                <el-form-item :label="$t('regUser.comments')" prop="comments">
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
const validatorUtil = require("../../../../utils/validatorUtil.js");

import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    groups: Array
  },
  data() {
    return {
      rules: {
        userName: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("regUser.userName")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkUserName(value)) {
                callback(
                  new Error(
                    this.$t("validate.rangelength", { min: 5, max: 12 })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        name: [
          {
            message: this.$t("validate.inputNull", {
              label: this.$t("regUser.name")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkName(value)) {
                callback(
                  new Error(this.$t("validate.rangelength", { min: 2, max: 6 }))
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        phoneNum: [
          {
            type: "number",
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("regUser.phoneNum")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkPhoneNum(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("regUser.phoneNum")
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        email: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("regUser.email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkEmail(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("regUser.email")
                    })
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
      this.$store.dispatch("hideRegUserForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          // console.log("---formdatas--", this);
          let params = this.dialogState.formData;
          // 更新
          if (this.dialogState.edit) {
            services.updateRegUser(params).then(result => {
              if (result.data.status === 200) {
                this.$store.dispatch("hideRegUserForm");
                this.$store.dispatch("getRegUserList");
                this.$message({
                  message: this.$t("main.updateSuccess"),
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