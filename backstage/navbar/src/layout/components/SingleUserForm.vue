<template>
  <div class="dr-SingleUserForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      width="30%"
      title="Dora VIP登录"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <div v-show="loginState">
        <el-form
          :model="dialogState.formData"
          :rules="loginRules"
          ref="loginRuleForm"
          label-width="80px"
          class="demo-ruleForm"
          :label-position="device == 'mobile' ? 'top' : 'right'"
        >
          <el-form-item :label="$t('singleUser.email')" prop="email">
            <el-input size="small" v-model="dialogState.formData.email"></el-input>
          </el-form-item>
          <el-form-item :label="$t('singleUser.password')" prop="password">
            <el-input type="password" size="small" v-model="dialogState.formData.password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button size="medium" type="primary" @click="submitForm('loginRuleForm')">登录</el-button>
            <el-button size="medium" @click="toggleReg(true)">注册</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div v-show="!loginState">
        <el-form
          :model="dialogState.regFormData"
          :rules="regRules"
          ref="regRuleForm"
          label-width="80px"
          class="demo-ruleForm"
          :label-position="device == 'mobile' ? 'top' : 'right'"
        >
          <el-form-item :label="$t('singleUser.userName')" prop="userName">
            <el-input size="small" v-model="dialogState.regFormData.userName"></el-input>
          </el-form-item>

          <el-form-item :label="$t('singleUser.email')" prop="email">
            <el-input size="small" v-model="dialogState.regFormData.email">
              <template slot="append">
                <el-button
                  maxlength="6"
                  minlength="6"
                  :disabled="basetime!=120"
                  @click="getMessageCode"
                >{{initSendBtnTxt}}</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="$t('singleUser.messageCode')" prop="messageCode">
            <el-input size="small" v-model="dialogState.regFormData.messageCode"></el-input>
          </el-form-item>
          <el-form-item :label="$t('singleUser.password')" prop="password">
            <el-input type="password" size="small" v-model="dialogState.regFormData.password"></el-input>
          </el-form-item>
          <el-form-item :label="$t('singleUser.lb_confirmPassword')" prop="confirmPassword">
            <el-input
              size="small"
              type="password"
              v-model="dialogState.regFormData.confirmPassword"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button size="medium" type="primary" @click="submitForm('regRuleForm')">注册</el-button>
            <el-button size="medium" @click="toggleReg(false)">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  addSingleUser,
  loginSingleUser,
  sendVerificationCode
} from "@/api/singleUser";
import { checkUserName, checkEmail, checkPwd } from "@/utils/validate";
import _ from "lodash";
export default {
  props: {
    dialogState: Object,
    device: String
  },
  data() {
    return {
      loginState: true,
      basetime: 120,
      lateResendTxt: " s",
      initSendBtnTxt: "获取验证码",
      reSendBtnTxt: "重新发送",
      mytask: "",
      loginRules: {
        password: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("singleUser.email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (value && !checkPwd(value)) {
                callback(
                  new Error(
                    this.$t("validate.ranglengthandnormal", { min: 6, max: 12 })
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
              label: this.$t("singleUser.email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkEmail(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("singleUser.email")
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ]
      },
      regRules: {
        userName: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("singleUser.userName")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkUserName(value)) {
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

        password: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("singleUser.password")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (value && !checkPwd(value)) {
                callback(
                  new Error(
                    this.$t("validate.ranglengthandnormal", { min: 6, max: 12 })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        confirmPassword: [
          {
            validator: (rule, value, callback) => {
              if (
                this.dialogState.regFormData.password &&
                value !== this.dialogState.regFormData.password
              ) {
                callback(new Error(this.$t("validate.passwordnotmatching")));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        messageCode: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("singleUser.messageCode")
            }),
            trigger: "blur"
          }
        ],
        email: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("singleUser.email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkEmail(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("singleUser.email")
                    })
                  )
                );
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ]
      }
    };
  },
  components: {},
  methods: {
    confirm() {
      this.$store.dispatch("singleUser/hideSingleUserForm");
    },
    toggleReg(val) {
      this.loginState = !val;
      this.$store.dispatch("singleUser/showSingleUserForm", {
        formData: {},
        regFormData: {}
      });
    },
    clearMessageCode() {
      clearInterval(this.mytask);
      this.initSendBtnTxt = "重新发送";
      this.basetime = 120;
    },
    getMessageCode() {
      let params = {
        sendType: "2",
        messageType: "0",
        email: this.dialogState.regFormData.email
      };
      if (!checkEmail(params.email)) {
        this.$message.error("请输入正确的邮箱");
        return;
      }
      sendVerificationCode(params).then(result => {
        if (result.status === 200) {
          this.mytask = setInterval(() => {
            this.initSendBtnTxt = --this.basetime + this.lateResendTxt;
          }, 1000);
          setTimeout(() => {
            this.clearMessageCode();
          }, 1000 * this.basetime);
          this.$message({
            message: "验证码发送成功！",
            type: "success"
          });
        } else {
          this.$message.error(result.message);
        }
      });
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.dialogState.formData;
          let messageInfo = this.dialogState.messageInfo;
          // 登录
          if (this.loginState) {
            params.loginType = "3";
            loginSingleUser(params).then(result => {
              this.clearMessageCode();
              if (result.status === 200) {
                this.$store.dispatch("singleUser/hideSingleUserForm");
                this.$store.dispatch("singleUser/setUserInfo", {
                  userInfo: result.data
                });
                this.$root.eventBus.$emit("notifyVipLoginSuccess", messageInfo);
                this.$message({
                  message: "恭喜您，登录成功！",
                  type: "success"
                });
              } else {
                this.$message.error(result.message);
              }
            });
          } else {
            params = this.dialogState.regFormData;
            // 注册
            params.regType = "2"; // 邮箱注册
            addSingleUser(params).then(result => {
              this.clearMessageCode();
              if (result.status === 200) {
                this.$store.dispatch("singleUser/hideSingleUserForm");
                this.$store.dispatch("singleUser/getSingleUserList");
                this.$message({
                  message: "恭喜您，注册成功！",
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