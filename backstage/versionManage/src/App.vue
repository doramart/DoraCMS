<template>
  <div id="versionManage-app">
    <keep-alive>
      <router-view v-if="keepState"></router-view>
    </keep-alive>
    <router-view v-if="!keepState"></router-view>
  </div>
</template>
<script>
export default {
  name: "VersionManage",
  components: {},
  data() {
    return {
      leftTabs: [],
    };
  },
  computed: {
    keepState() {
      return this.leftTabs.indexOf(this.$route.path) >= 0;
    },
  },
  mounted() {
    this.$root.eventBus.$on("globalTabsChange", (message) => {
      message && (this.leftTabs = message);
    });
  },
};
</script>
<style></style>
