<template>
  <section class="app-main" :style="appMainStyle">
    <transition name="fade-transform" mode="out-in">
      <router-view :key="key" />
    </transition>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'AppMain',
  computed: {
    key() {
      return this.$route.path;
    },
    ...mapGetters(['tabs']),
    appMainStyle() {
      return {
        paddingTop: this.tabs.length > 0 ? '102px' : '65px',
      };
    },
  },
};
</script>

<style scoped>
.app-main {
  /*50 = navbar  */
  /* min-height: calc(100vh - 50px); */
  width: 100%;
  position: relative;
  overflow: hidden;
}

</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
