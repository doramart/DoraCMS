<template>
  <div class="navbar">
    <hamburger :toggle-click="toggleSideBar" :is-active="sidebar.opened" class="hamburger-container"/>

    <breadcrumb class="breadcrumb-container"/>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <el-tooltip :content="$t('navbar.screenfull')" effect="dark" placement="bottom">
          <screenfull class="screenfull right-menu-item"/>
        </el-tooltip>

        <!-- <el-tooltip :content="$t('navbar.size')" effect="dark" placement="bottom">
          <size-select class="international right-menu-item"/>
        </el-tooltip> -->

        <lang-select class="international right-menu-item"/>

        <!-- <el-tooltip :content="$t('navbar.theme')" effect="dark" placement="bottom">
          <theme-picker class="theme-switch right-menu-item"/>
        </el-tooltip> -->
      </template>

      <el-dropdown v-if="loginState && loginState.userInfo" class="avatar-container right-menu-item" trigger="click">
        <div class="avatar-wrapper">
          <img :src="loginState.userInfo.logo" class="user-avatar">
          <i class="el-icon-caret-bottom"/>
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="sysMessage">{{$t('main.myMessage')}}
              <el-badge v-show="loginState.noticeCounts > 0" class="mark" :value="loginState.noticeCounts" />
          </el-dropdown-item>
          <el-dropdown-item @click.native="sysSettings">{{$t('main.settings')}}</el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">{{$t('main.logOut')}}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Breadcrumb from "@/components/Breadcrumb";
import Hamburger from "@/components/Hamburger";
import Screenfull from "@/components/Screenfull";
import SizeSelect from "@/components/SizeSelect";
import LangSelect from "@/components/LangSelect";
import ThemePicker from "@/components/ThemePicker";
import services from "@/store/services.js";
export default {
  components: {
    Breadcrumb,
    Hamburger,
    Screenfull,
    SizeSelect,
    LangSelect,
    ThemePicker
  },
  computed: {
    ...mapGetters(["sidebar", "name", "avatar", "device", "loginState"]),
    contentFormState() {
      return this.$store.getters.contentFormState;
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch("toggleSideBar");
    },
    //退出登录
    logout: function() {
      var _this = this;
      this.$confirm(
        this.$t("main.confirm_logout"),
        this.$t("main.scr_modal_title"),
        {
          type: "warning"
        }
      )
        .then(() => {
          this.loading = true;
          services.logOut().then(result => {
            if (result && result.data.status === 200) {
              window.location = "/dr-admin";
            } else {
              this.$message.error(this.$t("main.server_error_notice"));
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
    savePageInfo(route) {
      if (route === "/addContent") {
        let params = this.contentFormState.formData,
          postState = this.contentFormState.edit ? "editContent" : "addContent";
        localStorage.setItem(postState, JSON.stringify(params));
      }
      window.location = "/dr-admin";
    }
  },
  watch: {
    loginState() {
      if (!this.$store.getters.loginState.state) {
        this.$confirm(
          this.$t("main.login_timeout"),
          this.$t("main.scr_modal_title"),
          {
            showCancelButton: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
            confirmButtonText: this.$t("main.re_login"),
            type: "warning"
          }
        )
          .then(() => {
            this.loading = true;
            this.savePageInfo(this.$route.path);
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

<style rel="stylesheet/scss" lang="scss" scoped>
.navbar {
  height: 50px;
  line-height: 50px;
  border-radius: 0px !important;
  .hamburger-container {
    line-height: 58px;
    height: 50px;
    float: left;
    padding: 0 10px;
  }
  .breadcrumb-container {
    float: left;
  }
  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }
  .right-menu {
    float: right;
    height: 100%;
    &:focus {
      outline: none;
    }
    .right-menu-item {
      display: inline-block;
      margin: 0 8px;
    }
    .screenfull {
      height: 20px;
    }
    .international {
      vertical-align: top;
    }
    .theme-switch {
      vertical-align: 15px;
    }
    .avatar-container {
      height: 50px;
      margin-right: 30px;
      .avatar-wrapper {
        cursor: pointer;
        margin-top: 5px;
        position: relative;
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }
        .el-icon-caret-bottom {
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
