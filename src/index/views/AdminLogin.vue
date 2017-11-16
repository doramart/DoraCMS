<template>
  <div class="dr-admin-login">
    <div class="admin-login-form">
      <el-row :gutter="10">
        <el-col :xs="2" :sm="6" :md="8" :lg="8">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="20" :sm="12" :md="8" :lg="8">
          <div class="admin-logo-title">
            <h3>
              <b style="color:#1D8CE0">Dora</b>CMS</h3>
          </div>
          <el-form :model="adminLoginFormData" :rules="rules" ref="ruleForm" label-width="80px" class="demo-ruleForm login-container">
            <h3 class="pannel-title">
              <span>管理员登录</span>
            </h3>
            <el-form-item label="用户名" prop="userName">
              <el-input size="small" v-model="adminLoginFormData.userName"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input size="small" type="password" v-model="adminLoginFormData.password"></el-input>
            </el-form-item>
            <el-form-item label="验证码" prop="imageCode">
              <el-input size="small" style="width: 30%" type="imageCode" @keyup.enter.native="submitForm('ruleForm')" v-model="adminLoginFormData.imageCode"></el-input>
              <img :src="imgCodeUrl" class="imageCode" @click="reSetImgCode"/>
            </el-form-item>
            <el-form-item class="submit-btn">
              <el-button size="small" type="primary" @click="submitForm('ruleForm')">登录</el-button>
              <el-button size="small" @click="resetForm('ruleForm')">重置</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :xs="2" :sm="6" :md="8" :lg="8">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import api from "~api";
import  crypto from "../../../server/lib/utils/crypto.js";
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
          let params = this.adminLoginFormData;
          params.password = crypto.MD5(params.password);
          console.log(params);
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
  beforeMount() {
    // this.$store.dispatch('simplePage');
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
.admin-logo-title {
  h3 {
    color: #99a9bf;
    font-size: 35px;
    text-align: center;
    font-weight: normal;
  }
}

.admin-login-form {
  margin: 0 auto;
  margin-top: 70px;
  margin-bottom: 100px;

  .submit-btn {
    text-align: left;
  }

  .imageCode {
    width: 10rem;
    height: 2rem;
    float: right;
  }

  .login-container {
    -webkit-border-radius: 5px;
    border-radius: 5px;
    -moz-border-radius: 5px;
    background-clip: padding-box; // margin: 180px auto;
    padding: 25px 35px 10px 35px;
    background: #fff;
    border: 1px solid #eaeaea;
    box-shadow: 0 0 25px #cac6c6;
    .el-form-item {
      margin-bottom: 15px;
    }
    .title {
      margin: 0px auto 40px auto;
      text-align: center;
      color: #505458;
    }
    .remember {
      margin: 0px 0px 35px 0px;
    }
  }
}
</style>