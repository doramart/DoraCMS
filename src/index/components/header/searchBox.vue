<template>
    <div class="search-pannel" v-once>
        <div class="input-area">
            <el-input @keyup.enter.native="handleIconClick"  suffix-icon="el-icon-search" size="small" placeholder="请输入关键字" v-model="searchkey"></el-input>
        </div>
    </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
export default {
  name: "searchbox",
  data() {
    return {
      searchkey: ""
      // readySearch: false
    };
  },
  methods: {
    handleIconClick(ev) {
      this.$router.replace("/search/" + this.searchkey);
    },
    search(e) {}
  }
};
</script>
<style lang="scss">
.search-pannel {
  width: 100%;
  display: inline-block;
  margin-top: 5px;
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>