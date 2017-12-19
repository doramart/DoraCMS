<template>
    <div class="login-pannel">
        <ul>
            <li v-if="loginState.logined && loginState.userInfo">
                <div class="logo"><img :src="loginState.userInfo.logo" alt=""></div>
                <el-dropdown>
                    <span class="el-dropdown-link">
                        {{loginState.userInfo.userName}}
                        <i class="el-icon-caret-bottom el-icon--right"></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item @click.native="userCenter('messages')">用户中心</el-dropdown-item>
                        <el-dropdown-item @click.native="userCenter('center')">帐号设置</el-dropdown-item>
                        <el-dropdown-item @click.native="logout">退出</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </li>
            <li class="login-txt" v-else>
                <el-button type="text" style="color:#878D99;fontSize:15px;" @click="login">登录</el-button>
                <el-button type="primary" size="small" @click="regUser">注册</el-button>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import api from "~api";
export default {
  name: "loginPannel",
  props: ["userLoginState"],
  beforeMount() {
    this.$store.dispatch("frontend/user/getSessionState");
  },
  computed: {
    ...mapGetters({
      loginState: "frontend/user/getSessionState"
    })
  },
  methods: {
    login() {
      this.$router.push("/users/login");
    },
    regUser() {
      this.$router.push("/users/reg");
    },
    userCenter(page) {
      this.$router.push("/users/" + page);
    },
    logout() {
      api.get("users/logOut").then(result => {
        if (result.data.state === "success") {
          this.$message({
            message: "登出成功",
            type: "success",
            onClose: () => {
              window.location = "/";
            }
          });
        } else {
          this.$message({
            message: result.data.err,
            type: "error"
          });
        }
      });
    }
  }
};
</script>

<style lang="scss">



</style>
