<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" @click="addUser" plain round>
        <svg-icon icon-class="add-user" />
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
    addUser() {
      this.$store.dispatch("adminUser/showAdminUserForm");
    },

    delUser() {
      // this.$store.dispatch('showAdminUserForm')
    }

    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
