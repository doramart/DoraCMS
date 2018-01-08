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
                  <h3 class="top-bar"><i class="fa fa-user"></i><span>基本资料</span></h3>
                  <el-form label-position="top" :model="loginState.userInfo" :rules="rules" ref="ruleForm" label-width="150px" class="info-form">
                    <el-form-item label="用户名" prop="userName">
                      <el-input v-model="loginState.userInfo.userName"></el-input>
                    </el-form-item>
                    <el-form-item label="姓名" prop="name">
                      <el-input v-model="loginState.userInfo.name"></el-input>
                    </el-form-item>
                    <el-form-item label="电话" prop="phoneNum">
                      <el-input v-model="loginState.userInfo.phoneNum"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                      <el-input v-model="loginState.userInfo.email"></el-input>
                    </el-form-item>
                    <el-form-item label="备注" prop="comments">
                      <el-input type="textarea" v-model="loginState.userInfo.comments"></el-input>
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
import UserBar from "../components/UserBar";
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
    UserBar,
    UserCenterLeftMenu
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