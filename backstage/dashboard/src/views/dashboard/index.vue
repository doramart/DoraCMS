<template>
  <div :class="classObj" class="dashboard-container">
    <div class="main-container">
      <component :is="currentRole" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import adminDashboard from "./admin";
import { initEvent } from "@root/publicMethods/events";

export default {
  name: "Dashboard",
  components: { adminDashboard },
  data() {
    return {
      currentRole: "adminDashboard",
      sidebarOpened: true,
      device: "desktop"
    };
  },
  computed: {
    classObj() {
      return {
        hideSidebar: !this.sidebarOpened,
        openSidebar: this.sidebarOpened,
        withoutAnimation: "false",
        mobile: this.device === "mobile"
      };
    }
  },
  mounted() {
    initEvent(this);
  }
};
</script>
