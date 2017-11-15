<template>
  <div class="user-center">
    <div>
      <UserBar />
      <el-row :gutter="0" class="header-main">
        <el-col :xs="1" :sm="1" :md="3" :lg="3">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="18" :lg="18">
          <div class="user-info">
            <el-form :model="loginState.userInfo" :rules="rules" ref="ruleForm" label-width="150px" class="demo-ruleForm">
              <div class="user-logo">
                <el-form-item prop="sImg">
                    <el-upload class="avatar-uploader" action="/system/upload?type=images" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
                        <img v-if="loginState.userInfo.logo" :src="loginState.userInfo.logo" class="avatar">
                        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                    </el-upload>
                </el-form-item>
              </div>
              <el-form-item label="用户名" prop="userName">
                <el-input size="small" v-model="loginState.userInfo.userName"></el-input>
              </el-form-item>
              <el-form-item label="姓名" prop="name">
                <el-input size="small" v-model="loginState.userInfo.name"></el-input>
              </el-form-item>
              <el-form-item label="电话" prop="phoneNum">
                <el-input size="small" v-model="loginState.userInfo.phoneNum"></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input size="small" v-model="loginState.userInfo.email"></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input size="small" placeholder="请输入密码" type="password" v-model="loginState.userInfo.password"></el-input>
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input size="small" placeholder="请确认密码" type="password" v-model="loginState.userInfo.confirmPassword"></el-input>
              </el-form-item>
              <el-form-item label="备注" prop="comments">
                <el-input size="small" type="textarea" v-model="loginState.userInfo.comments"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button size="small" type="primary" @click="submitForm('ruleForm')">保存</el-button>
                <el-button size="small" @click="resetForm('ruleForm')">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="3" :lg="3">
          <div class="grid-content bg-purple">
            &nbsp;
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import api from "~api";
import UserBar from "../components/UserBar";
const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userLogin",
  metaInfo() {
    return {
      title: "用户中心"
    };
  },
  components: {
    UserBar
  },
  data() {
    return {
      rules: {
        userName: [
          {
            required: true,
            message: "请输入用户名",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkUserName(value)) {
                callback(new Error("5-12个英文字符!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        name: [
          {
            message: "请输入用户姓名",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback();
              } else {
                if (!validatorUtil.checkName(value)) {
                  callback(new Error("2-6个中文字符!"));
                } else {
                  callback();
                }
              }
            },
            trigger: "blur"
          }
        ],
        phoneNum: [
          {
            message: "请输入手机号",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback();
              } else {
                if (!validatorUtil.checkPhoneNum(value)) {
                  callback(new Error("请填写正确的手机号码!"));
                } else {
                  callback();
                }
              }
            },
            trigger: "blur"
          }
        ],
        email: [
          {
            required: true,
            message: "请填写邮箱",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkEmail(value)) {
                callback(new Error("请填写正确的邮箱!"));
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
            message: "请输入密码",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkPwd(value)) {
                callback(new Error("6-12位，只能包含字母、数字和下划线!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        confirmPassword: [
          {
            required: true,
            message: "请确认密码",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (value !== this.loginState.userInfo.password) {
                callback(new Error("两次输入密码不一致!"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ],
        comments: [
          {
            message: "请填写备注",
            trigger: "blur"
          },
          {
            min: 5,
            max: 30,
            message: "请输入5-30个字符",
            trigger: "blur"
          }
        ]
      }
    };
  },
  methods: {
    handleAvatarSuccess(res, file) {
      this.loginState.userInfo.logo = res;
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isGIF = file.type === "image/gif";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG && !isGIF) {
        this.$message.error("上传头像图片只能是 JPG,PNG,GIF 格式!");
      }
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
      }
      return (isJPG || isPNG || isGIF) && isLt2M;
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.loginState.userInfo;
          api
            .post("users/updateInfo", params)
            .then(result => {
              if (result.data.state == "success") {
                this.$message({
                  message: "信息更新成功！",
                  type: "success"
                });
              } else {
                this.$message({
                  message: result.data.message,
                  type: "error"
                });
              }
            })
            .catch(err => {
              this.$message.error(err.response.data.error);
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  },
  beforeMount() {
    // this.$store.dispatch('simplePage');
  },
  computed: {
    ...mapGetters({
      loginState: "frontend/user/getSessionState"
    })
  }
};
</script>

<style lang="scss">
.user-center {
  background-color: #f4f5f5;
  .user-info {
    form {
      width: 50%;
    }
    margin: 15px 0;
    padding: 15px;
    background-color: #ffffff;
    position: relative;
    .user-logo {
      position: absolute;
      top: 30px;
      right: 100px;
    }
  }

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
    width: 100px;
    height: 100px;
    line-height: 100px;
    text-align: center;
  }
  .avatar {
    width: 100px;
    height: 100px;
    display: block;
  }
}
</style>