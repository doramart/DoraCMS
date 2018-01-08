<template>
  <div class="contentContainer">
    <div class="mainbody user-center">
      <el-row :gutter="0">
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
          <div class="grid-content bg-purple">&nbsp;</div>
        </el-col>
        <el-col :xs="22" :sm="22" :md="22" :lg="22" :xl="14">
          <div class="user-info">
            <el-row :gutter="30" class="basic-info">
              <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8" class="left-pannel">
                <UserCenterLeftMenu @setNewlogo="setFormLogo" :userInfo="loginState.userInfo"/>
              </el-col>
              <el-col :xs="16" :sm="16" :md="16" :lg="16" :xl="16" class="right-pannel">
                  <h3 class="top-bar"><i class="fa fa-asterisk"></i><span>修改密码</span></h3>
                  <el-form label-position="top" :model="loginState.userInfo" :rules="rules" ref="ruleForm" label-width="150px" class="info-form">
                    <el-form-item label="密码" prop="password">
                      <el-input placeholder="请输入密码" type="password" v-model="loginState.userInfo.password"></el-input>
                    </el-form-item>
                    <el-form-item label="确认密码" prop="confirmPassword">
                      <el-input placeholder="请确认密码" type="password" v-model="loginState.userInfo.confirmPassword"></el-input>
                    </el-form-item>
                    
                    <el-form-item>
                      <el-button size="small" type="primary" @click="submitForm('ruleForm')">更新信息</el-button>
                    </el-form-item>
                  </el-form>
              </el-col>
            </el-row>
          </div>
        </el-col>
        <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="5">
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
import UserCenterLeftMenu from "../components/UserCenterLeftMenu";
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
    UserCenterLeftMenu
  },
  data() {
    return {
      rules: {
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
        ]
      }
    };
  },
  methods: {
    setFormLogo(res) {
      this.loginState && (this.loginState.userInfo.logo = res);
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
    }
  },
  computed: {
    ...mapGetters({
      loginState: "frontend/user/getSessionState"
    })
  }
};
</script>

<style lang="scss">

</style>