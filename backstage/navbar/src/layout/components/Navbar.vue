<template>
  <div>
    <div class="navbar">
      <hamburger
        :is-active="sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />

      <breadcrumb class="breadcrumb-container" />
      <div class="right-menu">
        <el-dropdown class="avatar-container" trigger="click">
          <div class="avatar-wrapper">
            <img :src="avatar" class="user-avatar" />
            <i class="el-icon-caret-bottom" />
          </div>
          <el-dropdown-menu slot="dropdown" class="user-dropdown">
            <router-link to="/">
              <el-dropdown-item>{{ $t("navbar.dashboard") }}</el-dropdown-item>
            </router-link>
            <a target="_blank" href="https://github.com/doramart/DoraCMS">
              <el-dropdown-item>Github</el-dropdown-item>
            </a>

            <el-dropdown-item>
              <!-- <span style="display:block;" v-if="!singleUserInfo.userName" @click="loginCmsVip">
              DoraCMS
              <svg-icon style="red" icon-class="icon_vip" />
            </span>-->
              <span
                style="display:block;"
                v-if="singleUserInfo.userName"
                @click="showCmsVipInfo"
              >
                <svg-icon style="red" icon-class="icon_vip" />
                {{ singleUserInfo.userName }}
              </span>
            </el-dropdown-item>
            <el-dropdown-item divided>
              <span style="display:block;" @click="logout">{{
                $t("navbar.logOut")
              }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <Tabs />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Breadcrumb from "@/components/Breadcrumb";
import Hamburger from "@/components/Hamburger";
import settings from "@root/publicMethods/settings";
import Tabs from "../components/tabs";
export default {
  data() {
    return {};
  },
  components: {
    Breadcrumb,
    Hamburger,
    Tabs,
  },
  computed: {
    ...mapGetters(["sidebar", "avatar", "singleUserInfo", "tabs"]),
    formState() {
      return this.$store.getters.singleUserFormState;
    },
  },
  methods: {
    toggleSideBar() {
      let _this = this;
      this.$store.dispatch("app/toggleSideBar");
      if (this.$root && this.$root.eventBus) {
        this.$root.eventBus.$emit("toggleSideBar", "1");
      }
    },
    logout() {
      var _this = this;
      this.$confirm(
        _this.$t("main.confirm_logout"),
        _this.$t("main.scr_modal_title"),
        {
          type: "warning",
        }
      )
        .then(async () => {
          var _this = this;
          await this.$store.dispatch("user/logout");
          window.location.href = `${settings.server_api}${this.$root.adminBasePath}/login`;
        })
        .catch(() => {});
    },
    logOutSingleUser() {
      var _this = this;
      this.$confirm(
        _this.$t("main.confirm_logout"),
        _this.$t("main.scr_modal_title"),
        {
          type: "warning",
        }
      )
        .then(async () => {
          var _this = this;
          await this.$store.dispatch("singleUser/logOut");
          this.$store.dispatch("singleUser/getUserInfo");
        })
        .catch(() => {});
    },
    loginCmsVip() {
      this.$store.dispatch("singleUser/showSingleUserForm", {
        formData: {},
        regFormData: {},
      });
    },
    showCmsVipInfo() {
      this.$confirm(
        `欢迎DoraCMS荣誉会员 ${this.singleUserInfo.userName}!`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "注销",
          type: "success",
        }
      )
        .then(() => {})
        .catch(() => {
          this.logOutSingleUser();
        });
    },
  },
  mounted() {
    this.$store.dispatch("user/showSideBar");
    if (this.$root && this.$root.eventBus) {
      this.$root.eventBus.$on("showSideBar", (message) => {
        this.$store.dispatch("user/showSideBar");
      });
    }
  },
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
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
