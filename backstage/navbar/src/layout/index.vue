<template>
  <div :class="classObj" class="app-wrapper">
    <SingleUserForm :device="device" :dialogState="singleUserFormState"></SingleUserForm>
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <div v-show="showSideBar">
      <sidebar class="sidebar-container" />

      <div class="main-container">
        <div :class="{'fixed-header':fixedHeader}">
          <navbar />
        </div>
        <app-main />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { Navbar, Sidebar, AppMain, SingleUserForm } from "./components";
import ResizeMixin from "./mixin/ResizeHandler";
import { getToken } from "@root/publicMethods/auth";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "Layout",
  data() {
    return {
      device: "desktop"
    };
  },
  components: {
    Navbar,
    Sidebar,
    AppMain,
    SingleUserForm
  },
  mixins: [ResizeMixin],
  computed: {
    ...mapGetters(["showSideBar", "singleUserInfo"]),
    singleUserFormState() {
      return this.$store.getters.singleUserFormState;
    },
    singleUserRegFormState() {
      return this.$store.getters.singleUserRegFormState;
    },
    loginToken() {
      return getToken();
    },
    sidebar() {
      return this.$store.state.app.sidebar;
    },
    fixedHeader() {
      return this.$store.state.settings.fixedHeader;
    },
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === "mobile"
      };
    }
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch("app/closeSideBar", { withoutAnimation: false });
    }
  },
  mounted() {
    initEvent(this);
    if (this.$root.appName == "doracms-egg") {
      this.$store.dispatch("singleUser/getUserInfo");
    }
    // 触发DoraVIP登录
    this.$root.eventBus.$on("toggleVipLogin", message => {
      this.$store.dispatch("singleUser/showSingleUserForm", {
        messageInfo: message,
        formData: {},
        regFormData: {}
      });
    });
  }
};
</script>

<style lang="scss" scoped>
@import "~@/styles/mixin.scss";
@import "~@/styles/variables.scss";

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;
  &.mobile.openSidebar {
    position: fixed;
    top: 0;
    z-index: 100;
  }
}
.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.mobile .fixed-header {
  width: 100%;
}
</style>
