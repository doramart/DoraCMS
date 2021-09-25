<template>
  <div class="dr-adminUserForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="$t('adminUser.lb_form_title')"
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
        <el-form-item :label="$t('adminUser.lb_userName')" prop="userName">
          <el-input size="small" v-model="dialogState.formData.userName"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>
        <el-form-item label="头像" prop="logo">
          <el-upload
            class="avatar-uploader"
            action="/api/upload/files"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :data="{action:'uploadimage'}"
          >
            <img v-if="dialogState.formData.logo" :src="dialogState.formData.logo" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_password')" prop="password">
          <el-input
            size="small"
            :placeholder="$t('main.noModifyPasswordTips')"
            type="password"
            v-model="dialogState.formData.password"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_confirmPassword')" prop="confirmPassword">
          <el-input
            size="small"
            :placeholder="$t('main.noModifyPasswordTips')"
            type="password"
            v-model="dialogState.formData.confirmPassword"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_userGroup')" prop="group">
          <el-select
            size="small"
            v-model="dialogState.formData.group"
            :placeholder="$t('main.ask_select_label')"
          >
            <el-option
              :key="index"
              v-for="(group,index) in groups"
              :label="group.name"
              :value="group._id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_countryCode')" prop="countryCode">
          <el-select size="small" v-model="dialogState.formData.countryCode" placeholder="国家代码">
            <el-option
              v-for="item in countryCode"
              :key="'kw_'+item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_phoneNum')" prop="phoneNum">
          <el-input size="small" v-model="dialogState.formData.phoneNum"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_email')" prop="email">
          <el-input size="small" v-model="dialogState.formData.email"></el-input>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_enable')" prop="enable">
          <el-switch
            :on-text="$t('main.radioOn')"
            :off-text="$t('main.radioOff')"
            v-model="dialogState.formData.enable"
          ></el-switch>
        </el-form-item>
        <el-form-item :label="$t('adminUser.lb_comments')" prop="comments">
          <el-input size="small" type="textarea" v-model="dialogState.formData.comments"></el-input>
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
import settings from "@root/publicMethods/settings";
import {
  checkUserName,
  checkEmail,
  checkName,
  checkPwd,
  checkPhoneNum
} from "@/utils/validate";
import { addAdminUser, updateAdminUser } from "@/api/adminUser";

export default {
  props: {
    dialogState: Object,
    groups: Array,
    device: String
  },
  data() {
    return {
      server_api: settings.server_api,
      countryCode: [
        { value: "86", label: "中国 +86" }
      ],
      rules: {
        userName: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminUser.lb_userName")
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
        name: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminUser.lb_name")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkName(value)) {
                callback(this.$t("validate.rangelength", { min: 2, max: 6 }));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        password: [
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
                this.dialogState.formData.password &&
                value !== this.dialogState.formData.password
              ) {
                callback(new Error(this.$t("validate.passwordnotmatching")));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        group: [
          {
            required: true,
            message: this.$t("validate.selectNull", {
              label: this.$t("adminUser.lb_userGroup")
            }),
            trigger: "change"
          }
        ],
        countryCode: [
          {
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminUser.lb_countryCode")
            }),
            trigger: "blur"
          }
        ],
        phoneNum: [
          {
            type: "string",
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminUser.lb_phoneNum")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkPhoneNum(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("adminUser.lb_phoneNum")
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
              label: this.$t("adminUser.lb_email")
            }),
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!checkEmail(value)) {
                callback(
                  new Error(
                    this.$t("validate.inputCorrect", {
                      label: this.$t("adminUser.lb_email")
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
            required: true,
            message: this.$t("validate.inputNull", {
              label: this.$t("adminUser.lb_comments")
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
    handleAvatarSuccess(res, file) {
      let imageUrl = res.data.path;
      this.$store.dispatch("adminUser/showAdminUserForm", {
        edit: this.dialogState.edit,
        formData: Object.assign({}, this.dialogState.formData, {
          logo: imageUrl
        })
      });
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isGIF = file.type === "image/gif";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG && !isGIF) {
        this.$message.error(this.$t("validate.limitUploadImgType"));
      }
      if (!isLt2M) {
        this.$message.error(
          this.$t("validate.limitUploadImgSize", { size: 2 })
        );
      }
      return (isJPG || isPNG || isGIF) && isLt2M;
    },
    confirm() {
      this.$store.dispatch("adminUser/hideAdminUserForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = Object.assign({}, this.dialogState.formData);
          // 更新
          if (this.dialogState.edit) {
            updateAdminUser(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("adminUser/hideAdminUserForm");
                this.$store.dispatch("adminUser/getAdminUserList");
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
            addAdminUser(params).then(result => {
              if (result.status === 200) {
                this.$store.dispatch("adminUser/hideAdminUserForm");
                this.$store.dispatch("adminUser/getAdminUserList");
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
    },
    resetForm(formName) {
      this.dialogState.formData = {};
    }
  },
  computed: {}
};
</script>


<style lang="scss">
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px !important;
  text-align: center;
}
.avatar {
  width: 150px;
  height: 158px;
  display: block;
}
</style>