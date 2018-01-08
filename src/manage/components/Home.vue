<template>
    <el-row class="container" v-loading.body="loading">
        <el-col :span="24" class="header">
            <el-col :span="10" class="logo" :class="collapsed?'logo-collapse-width':'logo-width'">
                <router-link v-show="!collapsed" :to="{path: '/main'}"><img src="../assets/images/doracms-logo.png" alt="DoraCMS内容管理系统" /></router-link>
            </el-col>
            <el-col :span="10">
                <div class="tools" @click.prevent="collapse">
                    <i class="fa fa-align-justify"></i>
                </div>
            </el-col>
            <el-col :span="4" class="userinfo" v-if="loginState && loginState.userInfo">
                <el-dropdown trigger="hover">
                    <span class="el-dropdown-link userinfo-inner">
                        <img :src="loginState.userInfo.logo" /> {{loginState.userInfo.userName}}</span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item @click.native="sysMessage">我的消息
                            <el-badge v-show="loginState.noticeCounts > 0" class="mark" :value="loginState.noticeCounts" /></el-dropdown-item>
                        <el-dropdown-item @click.native="sysSettings">设置</el-dropdown-item>
                        <el-dropdown-item divided @click.native="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </el-col>
        </el-col>
        <el-col :span="24" class="main">
            <aside>
                <!--导航菜单-->
                <el-menu unique-opened :default-active="$route.path" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" :collapse="collapsed">
                     <template v-for="(item,index) in $router.options.routes" v-if="!item.hidden">
                         <el-submenu :index="index+''" :key="index">
                            <template slot="title">
                            <i :class="item.iconCls"></i>
                            <span slot="title">{{item.name}}</span>
                            </template>
                            <el-menu-item-group>
                                <el-menu-item v-for="child in item.children" :index="child.path" :key="child.path" :class="$route.path == child.path?'is-active':''"
                                    v-if="!child.hidden" @click="$router.push(child.path)">{{child.name}}</el-menu-item>
                            </el-menu-item-group>     
                        </el-submenu>
                     </template>
                </el-menu>
            </aside>
            <section class="content-container">
                <div class="grid-content bg-purple-light">
                    <el-col :span="24" class="breadcrumb-container">
                        <strong class="title">{{$route.name}}</strong>
                        <el-breadcrumb separator="/" class="breadcrumb-inner">
                            <el-breadcrumb-item v-for="item in $route.matched" :key="item.path">
                                {{ item.name }}
                            </el-breadcrumb-item>
                        </el-breadcrumb>
                    </el-col>
                    <el-col :span="24" class="content-wrapper">
                        <transition name="fade" mode="out-in">
                            <router-view></router-view>
                        </transition>
                    </el-col>
                </div>
            </section>
        </el-col>
    </el-row>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import services from "../store/services.js";
export default {
  data() {
    return {
      loading: false,
      sysName: "DoraCMS",
      collapsed: false,
      isCollapse: true
    };
  },
  methods: {
    onSubmit() {
      console.log("submit!");
    },
    handleOpen(key, keyPath) {
      console.log(key, keyPath);
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath);
    },
    handleselect: function(a, b) {},
    //退出登录
    logout: function() {
      var _this = this;
      this.$confirm("确认退出吗?", "提示", {
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          services.logOut().then(result => {
            if (result && result.data.state === "success") {
              window.location = "/dr-admin";
            } else {
              this.$message.error("服务异常,请稍后再试");
            }
          });
        })
        .catch(() => {});
    },
    sysMessage() {
      this.$router.push("/systemNotify");
    },
    sysSettings() {
      this.$router.push("/systemConfig");
    },
    //折叠导航栏
    collapse: function() {
      this.collapsed = !this.collapsed;
    },
    showMenu(i, status) {
      this.$refs.menuCollapsed.getElementsByClassName(
        "submenu-hook-" + i
      )[0].style.display = status ? "block" : "none";
    },
    sendLogOut() {
      services.logOut().then(result => {
        if (result && result.data.state === "success") {
          window.location = "/dr-admin";
        } else {
          this.$message.error("服务异常,请稍后再试");
        }
      });
    }
  },
  mounted() {},
  computed: {
    ...mapGetters(["loginState"])
  },
  watch: {
    loginState() {
      if (!this.$store.getters.loginState.state) {
        this.$confirm("您的登录已超时?", "提示", {
          showCancelButton: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          confirmButtonText: "重新登录",
          type: "warning"
        })
          .then(() => {
            this.loading = true;
            window.location = "/dr-admin";
          })
          .catch(() => {
            this.loading = true;
            window.location = "/dr-admin";
          });
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "~scss_vars";
.container {
  position: absolute;
  top: 0px;
  bottom: 0px;
  width: 100%;
  .header {
    height: 60px;
    line-height: 60px;
    background: $color-primary;
    color: #fff;
    .userinfo {
      text-align: right;
      padding-right: 35px;
      float: right;
      .userinfo-inner {
        cursor: pointer;
        color: #878d99;
        img {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          margin: 10px 0px 10px 10px;
          float: right;
        }
      }
    }
    .logo {
      color: #409eff;
      height: 60px;
      font-size: 26px;
      padding-left: 20px;
      padding-right: 20px;
      border-color: #ffffff;
      border-right-width: 1px;
      border-right-style: solid;
      img {
        width: 100%;
        float: left;
        margin: 10px 10px 10px 0px;
      }
      .txt {
        color: #fff;
      }
    }
    .logo-width {
      width: 230px;
      text-align: center;
    }
    .logo-collapse-width {
      width: 60px;
    }
    .tools {
      padding: 0px 23px;
      width: 14px;
      height: 60px;
      line-height: 60px;
      cursor: pointer;
      color: #d8dce6;
    }
  }
  .main {
    display: flex;
    background: #ffffff;
    position: absolute;
    top: 60px;
    bottom: 0px;
    overflow: hidden;
    aside {
      .el-menu-vertical-demo:not(.el-menu--collapse) {
        width: 230px;
        min-height: 400px;
      }
      .el-menu {
        height: 100%;
      }
      .collapsed {
        // width: 60px;
        .item {
          position: relative;
        }
        .submenu {
          position: absolute;
          top: 0px;
          left: 60px;
          z-index: 99999;
          height: auto;
          display: none;
        }
      }
    }
    .menu-collapsed {
      flex: 0 0 60px;
      width: 60px;
    }
    .menu-expanded {
      flex: 0 0 230px;
      width: 230px;
    }
    .content-container {
      flex: 1;
      overflow-y: scroll;
      padding: 20px;
      .breadcrumb-container {
        .title {
          width: 200px;
          float: left;
          color: #475669;
        }
        .breadcrumb-inner {
          float: right;
        }
      }
      .content-wrapper {
        background-color: #fff;
        box-sizing: border-box;
      }
    }
  }
}
</style>