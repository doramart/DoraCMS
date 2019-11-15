<template>
  <div class="dr-toolbar">
    <div class="option-button el-col-6">
      <el-button size="small" type="primary" plain @click="addTopCates" round>
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
    addTopCates() {
      this.$store.dispatch("contentCategory/showContentCategoryForm", {
        type: "root",
        formData: {
          parentId: "0"
        }
      });
    }
    // TOPBARLEFTOPTION
  },
  components: {}
};
</script>
<style lang="scss">
</style>
