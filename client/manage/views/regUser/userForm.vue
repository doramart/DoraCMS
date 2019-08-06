<template>
  <div class="dr-regUserForm">
    <el-dialog
      :xs="20"
      :sm="20"
      :md="6"
      :lg="6"
      :xl="6"
      :title="$t('regUser.form_title')"
      :visible.sync="dialogState.show"
      :close-on-click-modal="false"
    >
      <el-form
        :model="dialogState.formData"
        :rules="rules"
        ref="ruleForm"
        label-width="120px"
        class="demo-ruleForm"
      >
        <el-form-item :label="$t('regUser.userName')" prop="userName">
          <el-input size="small" v-model="dialogState.formData.userName"></el-input>
        </el-form-item>
        <el-form-item :label="$t('regUser.name')" prop="name">
          <el-input size="small" v-model="dialogState.formData.name"></el-input>
        </el-form-item>
        <el-form-item label="头像" prop="logo">
          <el-upload
            class="avatar-uploader"
            action="/api/v0/upload/files?type=images"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="dialogState.formData.logo" :src="dialogState.formData.logo" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('regUser.group')" prop="group">
          <el-radio class="radio" v-model="dialogState.formData.group" label="0">普通用户</el-radio>
        </el-form-item>
        <el-form-item :label="$t('regUser.enable')" prop="enable">
          <el-switch
            :on-text="$t('main.radioOn')"
            :off-text="$t('main.radioOff')"
            v-model="dialogState.formData.enable"
          ></el-switch>
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
import services from "../../store/services.js";
const validatorUtil = require("~server/lib/utils/validatorUtil.js");

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
              if (!validatorUtil.isRegularCharacter(value)) {
                callback(
                  new Error(
                    this.$t("validate.rangelength", { min: 2, max: 30 })
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
              if (!validatorUtil.isRegularCharacter(value)) {
                callback(
                  new Error(
                    this.$t("validate.rangelength", { min: 2, max: 20 })
                  )
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
        comments: [
          {
            message: this.$t("validate.inputNull", {
              label: this.$t("main.comments_label")
            }),
            trigger: "blur"
          },
          {
            min: 2,
            max: 100,
            message: this.$t("validate.ranglengthandnormal", {
              min: 2,
              max: 100
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
      this.$store.dispatch("showRegUserForm", {
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
      this.$store.dispatch("hideRegUserForm");
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          // console.log("---formdatas--", this);
          let params = this.dialogState.formData;
          // 更新(只更新基础信息)
          if (this.dialogState.edit) {
            let {
              userName,
              name,
              logo,
              group,
              category,
              enable,
              phoneNum,
              email,
              comments,
              _id
            } = params;
            let currentParams = {
              _id,
              userName,
              logo,
              name,
              group,
              category,
              enable,
              phoneNum,
              email,
              comments
            };
            services.updateRegUser(currentParams).then(result => {
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
  line-height: 150px;
  text-align: center;
}
.avatar {
  width: 150px;
  height: 158px;
  display: block;
}
</style>