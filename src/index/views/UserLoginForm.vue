<template>
  <div class="dr-user-login">
    <div class="login-form">
      <el-row :gutter="10">
        <el-col :xs="2" :sm="6" :md="8" :lg="8" :xl="10">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="20" :sm="12" :md="8" :lg="8" :xl="4">
          <el-form :model="userLoginFormData" :rules="rules" ref="ruleForm" label-width="0px" class="demo-ruleForm login-container">
            <h3 class="pannel-title">
              <span>用户登录</span>
            </h3>
            <el-form-item prop="email">
              <el-input size="small" placeholder="请填写邮箱" v-model="userLoginFormData.email"></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input size="small" placeholder="请输入密码" type="password" @keyup.enter.native="submitForm('ruleForm')" v-model="userLoginFormData.password"></el-input>
            </el-form-item>
            <el-form-item class="submit-btn">
              <el-button size="small" round type="primary" @click="submitForm('ruleForm')">登录</el-button>
              <el-button size="small" round @click="resetForm('ruleForm')">重置</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :xs="2" :sm="6" :md="8" :lg="8" :xl="10">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
      </el-row>
  
    </div>
  </div>
</template>
<script>
import api from "~api";
const validatorUtil = require("../../../utils/validatorUtil.js");
import { mapGetters, mapActions } from "vuex";
export default {
  name: "userLogin",
  metaInfo() {
    return {
      title: "用户登录"
    };
  },
  data() {
    return {
      rules: {
        email: [
          {
            required: true,
            message: "请输入邮箱",
            trigger: "blur"
          },
          {
            validator: (rule, value, callback) => {
              if (!validatorUtil.checkEmail(value)) {
                callback(new Error("请输入正确的邮箱!"));
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
        ]
      }
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          let params = this.userLoginFormData;
          api
            .post("users/doLogin", params)
            .then(result => {
              if (result.data.state == "success") {
                window.location = "/";
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
      userLoginFormData: "frontend/user/loginForm"
    })
  }
};
</script>

<style lang="scss">

</style>