<template>
  <div class="dr-admin-login">
    <div class="admin-login-form">
      <el-row :gutter="10">
        <el-col :xs="2" :sm="7" :md="8" :lg="8" :xl="9">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="20" :sm="10" :md="8" :lg="8" :xl="6">
          <div class="admin-logo-title">
            <h3>
              <b style="color:#1D8CE0">Dora</b>CMS</h3>
          </div>
          <div class="login-container">
            <el-form :model="adminLoginFormData" :rules="rules" ref="ruleForm" label-width="0px" class="loginForm">
              <el-form-item prop="userName">
                <i class="fa fa-user-o"></i>
                <el-input size="medium" v-model="adminLoginFormData.userName" placeholder="请输入用户名"> </el-input>
              </el-form-item>
              <el-form-item prop="password">
                <i class="fa fa-lock"></i>
                <el-input size="medium" type="password" v-model="adminLoginFormData.password" placeholder="请输入密码"></el-input>
              </el-form-item>
              <el-form-item prop="imageCode">
                <i class="fa fa-random"></i>
                <el-input size="medium" style="width: 40%" type="imageCode" placeholder="图形码" @keyup.enter.native="submitForm('ruleForm')" v-model="adminLoginFormData.imageCode"></el-input>
                <img :src="imgCodeUrl" class="imageCode" @click="reSetImgCode"/>
              </el-form-item>
              <el-form-item class="submit-btn">
                <el-button size="medium" type="primary" @click="submitForm('ruleForm')">登录</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="2" :sm="7" :md="8" :lg="8" :xl="9">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import api from "~api";
import crypto from "~server/lib/utils/crypto.js";
const validatorUtil = require("../../../utils/validatorUtil.js");

import { mapGetters, mapActions } from "vuex";
export default {
  name: "adminLogin",
  metaInfo() {
    return {
      title: "管理员登录"
    };
  },
  data() {
    return {
      imgCodeUrl: "/api/getImgCode",
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
        imageCode: [
          { required: true, message: "请输入验证码", trigger: "blur" },
          { min: 5, max: 5, message: "请输入 5 个字符", trigger: "blur" }
        ]
      }
    };
  },
  methods: {
    reSetImgCode() {
      this.imgCodeUrl = "/api/getImgCode?" + Math.random();
    },
    submitForm(formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          //let params = this.adminLoginFormData;
          let params = Object.assign({}, this.adminLoginFormData);
          const password = params.password;
          params.password = crypto.MD5(params.password);

          api
            .post("admin/doLogin", params)
            .then(result => {
              if (result.data.state == "success") {
                window.location = "/manage";
              } else {
                this.reSetImgCode();
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
  mounted() {},
  computed: {
    ...mapGetters({
      adminLoginFormData: "frontend/adminUser/loginForm"
    })
  }
};
</script>

<style lang="scss">

</style>