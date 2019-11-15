<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button type="primary" size="small" plain round @click="addAds">
        <svg-icon icon-class="icon_add" />
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
    addAds() {
      this.$store.dispatch("ads/adsInfoForm", {
        edit: false,
        formData: {}
      });
      this.$router.push(this.$root.adminBasePath + "/ads/addAds");
    }

    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
