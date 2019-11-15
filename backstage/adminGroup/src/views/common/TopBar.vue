<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" @click="addRole" plain round>
        <svg-icon icon-class="icon_group" />
      </el-button>
      <!-- TOPBARLEFT -->
    </div>
    <div class="el-col-18">&nbsp;</div>
  </div>
</template>
<script>
export default {
  props: {
    device: String,
    pageInfo: Object,
    type: String,
    ids: Array
  },
  data() {
    return {
      selectUserList: [],
      searchkey: ""
    };
  },
  methods: {
    addRole() {
      this.$store.dispatch("adminGroup/showAdminGroupForm");
    },
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
