<template>
  <div class="contentContainer">
    <div class="mainbody login-form">
      <el-row :gutter="10">
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14" class="login-main">
          <div class="login-box">
            <el-form label-position="top" :model="userLoginFormData" :rules="rules" ref="ruleForm" label-width="80px" class="demo-ruleForm">
            <h3 class="title">
              <span>登录</span>
            </h3>
            <el-form-item prop="email" label="邮箱">
              <el-input placeholder="请填写邮箱" v-model="userLoginFormData.email"></el-input>
            </el-form-item>
            <el-form-item prop="password" label="密码">
              <el-input placeholder="请输入密码" type="password" @keyup.enter.native="submitForm('ruleForm')" v-model="userLoginFormData.password"></el-input>
            </el-form-item>
            <el-form-item>
              <el-row :gutter="10">
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
                <el-button type="primary" @click="submitForm('ruleForm')">登录</el-button>
              </el-col>
              <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
                <el-button @click="resetForm('ruleForm')">重置</el-button>
              </el-col>
              </el-row>
            </el-form-item>
          </el-form>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
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
      referPath: "/",
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
  beforeRouteEnter(to, from, next) {
    next(vm => {
      from.path && (vm.referPath = from.path);
    });
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
                window.location = this.referPath;
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
  computed: {
    ...mapGetters({
      userLoginFormData: "frontend/user/loginForm"
    })
  }
};
</script>

<style lang="scss">

</style>